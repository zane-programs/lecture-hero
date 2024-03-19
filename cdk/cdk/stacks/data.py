from aws_cdk import (
    Duration,
    Stack,
    aws_cloudfront as cloudfront,
    aws_ec2 as ec2,
    aws_lambda as lambda_,
    aws_lambda_event_sources as lambda_event_sources,
    aws_rds as rds,
    aws_s3 as s3,
)
from aws_solutions_constructs import aws_cloudfront_s3 as cfs3
from constructs import Construct

from cdk.config import settings, Props


class DataStack(Stack):
    aurora_db: rds.ServerlessCluster

    def __init__(
        self, scope: Construct, construct_id: str, props: Props, **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # FILLMEIN DONE: Aurora Serverless Database
        self.aurora_db = rds.ServerlessCluster(
            self,
            f"{settings.PROJECT_NAME}-aurora-serverless",
            # See: https://docs.aws.amazon.com/cdk/api/v2/python/aws_cdk.aws_rds/AuroraPostgresEngineVersion.html
            #      https://docs.aws.amazon.com/cdk/api/v2/python/aws_cdk.aws_rds/ServerlessCluster.html
            engine=rds.DatabaseClusterEngine.aurora_postgres(
                version=rds.AuroraPostgresEngineVersion.VER_13_10),
            # Thank you docs!! :)
            vpc=props.network_vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED),
            default_database_name=settings.PROJECT_NAME,
            # NOTE: I used ChatGPT to help me figure out how the fuck
            # to use Secrets Manager. Honestly, it wasn't helpful and
            # somewhat hallucinated a method on `rds.Credentials` that
            # doesn't even exist. So, this is actually just me rawdogging
            # the docs from here on out.
            # See: https://docs.aws.amazon.com/cdk/api/v2/python/aws_cdk.aws_rds/Credentials.html#aws_cdk.aws_rds.Credentials.from_generated_secret
            # DB username = "me"
            credentials=rds.Credentials.from_generated_secret(
                "me", exclude_characters=settings.DB_SPECIAL_CHARS_EXCLUDE)
        )
