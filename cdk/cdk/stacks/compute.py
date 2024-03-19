import json
from typing import Dict
from aws_cdk import (
    Stack,
    Duration,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as cloudfront_origins,
    aws_ec2 as ec2,
    aws_ecr_assets as ecr_assets,
    aws_ecs as ecs,
    aws_ecs_patterns as ecs_patterns,
    aws_elasticloadbalancingv2 as elbv2,
    aws_logs as logs,
    aws_route53 as r53,
    aws_route53_targets as r53_targets,
    aws_s3 as s3,
    aws_s3_deployment as s3_deployment,
    aws_secretsmanager as secretsmanager,
    aws_ecr as ecr,
    aws_iam as iam
)
from constructs import Construct

from cdk.config import settings, Props


class ComputeStack(Stack):
    def __init__(
        self, scope: Construct, construct_id: str, props: Props, **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # ECS cluster for container hosting
        cluster = ecs.Cluster(
            self, f"{settings.PROJECT_NAME}-cluster", vpc=props.network_vpc
        )

        # OpenAI API Key
        openai_api_key = secretsmanager.Secret(
            self,
            f"{settings.PROJECT_NAME}-openai-api-key",
            description="API Key for OpenAI LLMs"
        )

        # TODO: Add Datadog integration once ready
        datadog_api_key = secretsmanager.Secret(
            self,
            f"{settings.PROJECT_NAME}-datadog-api-key",
            description="API Key for Datadog observability"
        )

        # ECS Fargate task definition
        fargate_task_definition = ecs.FargateTaskDefinition(
            self,
            f"{settings.PROJECT_NAME}-fargate-task-definition",
            cpu=512,
            # 2 GiB
            memory_limit_mib=2048,
            # Linux runtime
            runtime_platform=ecs.RuntimePlatform(
                # Linux ofc
                operating_system_family=ecs.OperatingSystemFamily.LINUX,
                # ARM64
                cpu_architecture=ecs.CpuArchitecture.ARM64
            ),
        )

        # Grant Fargate task definition access to Datadog & OpenAI API keys
        datadog_api_key.grant_read(fargate_task_definition.task_role)
        openai_api_key.grant_read(fargate_task_definition.task_role)
        # Grant Fargate task definition access to DB
        props.data_aurora_db.secret.grant_read(
            fargate_task_definition.task_role)
        props.data_aurora_db.secret.grant_write(
            fargate_task_definition.task_role)

        db_host = ecs.Secret.from_secrets_manager(
            props.data_aurora_db.secret, "host")
        db_port = ecs.Secret.from_secrets_manager(
            props.data_aurora_db.secret, "port")
        db_user = ecs.Secret.from_secrets_manager(
            props.data_aurora_db.secret, "user")
        db_password = ecs.Secret.from_secrets_manager(
            props.data_aurora_db.secret, "password")
        # db_name = settings.PROJECT_NAME
        db_name = ecs.Secret.from_secrets_manager(
            props.data_aurora_db.secret, "dbname")

        # Instantiate container secrets with `DATABASE_URL` for Prisma ORM
        # container_secrets = {"DATABASE_URL": f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}?schema=public"}
        container_secrets = {"DB_HOST": db_host, "DB_PASSWORD": db_password,
                             "DB_USER": db_user, "DB_PORT": db_port, "DB_NAME": db_name}

        fargate_task_definition.add_container(
            f"{settings.PROJECT_NAME}-app-container",
            container_name=f"{settings.PROJECT_NAME}-app-container",
            # TODO: Dockerize app so this works
            image=ecs.ContainerImage.from_asset(settings.APP_DIR),
            logging=ecs.AwsLogDriver(
                stream_prefix=f"{settings.PROJECT_NAME}-fargate",
                log_retention=logs.RetentionDays.ONE_WEEK,
            ),
            # See: https://docs.aws.amazon.com/cdk/api/v2/python/aws_cdk.aws_ecs/PortMapping.html#aws_cdk.aws_ecs.PortMapping
            #      https://docs.aws.amazon.com/cdk/api/v2/python/aws_cdk.aws_ecs/FargateTaskDefinition.html#aws_cdk.aws_ecs.FargateTaskDefinition.add_container
            # Expose port 80 (HTTP)
            port_mappings=[ecs.PortMapping(
                name=f"{settings.PROJECT_NAME}-fargate-container-port-mapping", container_port=80, app_protocol=ecs.AppProtocol.http)],
            environment={
                "NODE_ENVPRODUCTION": "prodution",
                "LECTURE_HERO_PORT": "80"
            },
            # Inject DB secrets into container
            secrets=container_secrets,
            # See: https://docs.aws.amazon.com/cdk/api/v2/python/aws_cdk.aws_ecs/HealthCheck.html#aws_cdk.aws_ecs.HealthCheck
            health_check=ecs.HealthCheck(
                command=["CMD-SHELL", "curl -f http://localhost/v1/health/ || exit 1"]),
            # Datadog deployment details
            # TODO: Datadog
            docker_labels={
                "com.datadoghq.ad.instances": '[{"host": "%%host%%", "port": 80}]',
                "com.datadoghq.ad.check_names": '["lecturehero-ecs"]',
                "com.datadoghq.ad.init_configs": "[{}]",
            }
        )

        # TODO: add Datadog sidecar (?)

        # FILLMEIN DONE: Finish the Fargate service backend deployment
        fargate_service = ecs_patterns.ApplicationLoadBalancedFargateService(
            self,
            f"{settings.PROJECT_NAME}-fargate-service",
            # Pass in task definition
            task_definition=fargate_task_definition,
            # Pass in provided ECS cluster
            cluster=cluster,
            # Domain name: api.lecturehero.net
            domain_name=f"api.{settings.APP_DOMAIN}",
            # Certificate created in network stack
            certificate=props.network_backend_certificate,
            # Redirect requests to port 80 => port 443
            redirect_http=True,
            domain_zone=props.network_hosted_zone
        )

        # Health check
        fargate_service.target_group.configure_health_check(path="/v1/health")

        # DB perms
        fargate_service.service.connections.allow_to(
            props.data_aurora_db, ec2.Port.tcp(5432), "DB access"
        )

        # S3 frontend deployment setup steps
        frontend_bucket = s3.Bucket(
            self,
            f"{settings.PROJECT_NAME}-frontend-deployment-bucket",
        )

        access_identity = cloudfront.OriginAccessIdentity(
            self,
            f"{settings.PROJECT_NAME}-frontend-access-identity",
        )
        frontend_bucket.grant_read(access_identity)

        frontend_deployment = s3_deployment.BucketDeployment(
            self,
            f"{settings.PROJECT_NAME}-frontend-deployment",
            sources=[s3_deployment.Source.asset(
                f"{settings.WEB_DIR}/build")],
            destination_bucket=frontend_bucket,
        )

        # Cloudfront distribution for frontend
        frontend_distribution = cloudfront.Distribution(
            self,
            f"{settings.PROJECT_NAME}-frontend-distribution",
            certificate=props.network_frontend_certificate,
            domain_names=[settings.APP_DOMAIN],
            # Frontend default => Direct to index.html
            default_root_object="index.html",
            # Frontend 404 error => redirect to index.html
            error_responses=[cloudfront.ErrorResponse(
                http_status=404, response_page_path="/index.html")],
            # Default behavior: origin from S3 frontend bucket
            default_behavior=cloudfront.BehaviorOptions(
                origin=cloudfront_origins.S3Origin(
                    frontend_bucket, origin_access_identity=access_identity),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS
            ),
            additional_behaviors={"/api/*": cloudfront.BehaviorOptions(
                origin=cloudfront_origins.HttpOrigin(
                    f"api.{settings.APP_DOMAIN}"),
                # Disable caching on api requests
                cache_policy=cloudfront.CachePolicy.CACHING_DISABLED,
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                # Allow all HTTP methods
                allowed_methods=cloudfront.AllowedMethods.ALLOW_ALL,
                # Allow all headers via `cloudfront.OriginRequestPolicy`
                origin_request_policy=cloudfront.OriginRequestPolicy(
                    self, f"{settings.PROJECT_NAME}-frontend-api-orp", header_behavior=cloudfront.OriginRequestHeaderBehavior.deny_list("Host"))
            )}
        )

        # DNS A record for Cloudfront frontend
        frontend_domain = r53.ARecord(
            self,
            f"{settings.PROJECT_NAME}-frontend-domain",
            zone=props.network_hosted_zone,
            record_name=settings.APP_DOMAIN,
            target=r53.RecordTarget.from_alias(
                r53_targets.CloudFrontTarget(frontend_distribution)
            ),
        )
