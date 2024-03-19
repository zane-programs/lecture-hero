from aws_cdk import (
    Stack,
    aws_certificatemanager as acm,
    aws_ec2 as ec2,
    aws_route53 as r53,
)
from constructs import Construct

from cdk.config import settings, Props


class NetworkStack(Stack):
    backend_certificate: acm.ICertificate
    frontend_certificate: acm.ICertificate
    vpc: ec2.IVpc

    def __init__(
        self, scope: Construct, construct_id: str, props: Props, **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # VPC
        self.vpc = ec2.Vpc(
            self,
            f"{settings.PROJECT_NAME}-vpc",
            availability_zones=["us-west-2a", "us-west-2b"],
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            # See: https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.SubnetType.html
            #      https://docs.aws.amazon.com/cdk/api/v2/python/aws_cdk.aws_ec2/Vpc.html
            subnet_configuration=[
                {"cidrMask": 24, "name": "pub_ingress",
                    "subnetType": ec2.SubnetType.PUBLIC},
                {"cidrMask": 24, "name": "priv_nat",
                    "subnetType": ec2.SubnetType.PRIVATE_WITH_NAT},
                {"cidrMask": 24, "name": "priv_isolated",
                    "subnetType": ec2.SubnetType.PRIVATE_ISOLATED}
            ]
        )

        # Backend TLS cert
        self.backend_certificate = acm.Certificate(
            self,
            f"{settings.PROJECT_NAME}-backend-certificate",
            domain_name=settings.APP_DOMAIN,
            subject_alternative_names=[f"*.{settings.APP_DOMAIN}"],
            # See: https://docs.aws.amazon.com/cdk/api/v2/python/aws_cdk.aws_certificatemanager/CertificateValidation.html#aws_cdk.aws_certificatemanager.CertificateValidation
            validation=acm.CertificateValidation.from_dns(
                hosted_zone=props.network_hosted_zone)
        )

        # Frontend TLS cert
        self.frontend_certificate = acm.DnsValidatedCertificate(
            self,
            f"{settings.PROJECT_NAME}-frontend-certificate",
            domain_name=settings.APP_DOMAIN,
            subject_alternative_names=[f"*.{settings.APP_DOMAIN}"],
            hosted_zone=props.network_hosted_zone,
            region="us-east-1",  # Cloudfront certificate needs to be in us-east-1
        )
