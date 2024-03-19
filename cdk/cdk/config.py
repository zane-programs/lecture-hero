import string

from typing import Dict, Optional

from aws_cdk import (
    aws_certificatemanager as acm,
    aws_ec2 as ec2,
    aws_rds as rds,
    aws_route53 as r53,
)

from pydantic import field_validator
from pydantic_core.core_schema import ValidationInfo
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    PROJECT_NAME: str = "lecturehero"
    REGION: str = "us-west-2"
    DNS_ROOT: str = "lecturehero.net"
    APP_DOMAIN: Optional[str] = None

    APP_DIR: str = "../app"
    WEB_DIR: str = "../web"

    DB_SPECIAL_CHARS_EXCLUDE: str = (
        string.printable.replace(string.ascii_letters, "")
        .replace(string.digits, "")
        .replace(string.whitespace, " ")
        .replace("_", "")
    )

    @field_validator("APP_DOMAIN", mode="before")
    @classmethod
    def assemble_app_domain(cls, v: Optional[str], info: ValidationInfo) -> str:
        if isinstance(v, str):
            return v
        # return f"app.{info.data.get('DNS_ROOT')}"
        return info.data.get('DNS_ROOT')


settings = Settings()


class Props:
    network_vpc: ec2.IVpc
    network_backend_certificate: acm.ICertificate
    network_frontend_certificate: acm.ICertificate
    network_hosted_zone: r53.IHostedZone
    data_aurora_db: rds.ServerlessCluster
