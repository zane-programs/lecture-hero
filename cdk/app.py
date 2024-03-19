#!/usr/bin/env python3
import os

import aws_cdk as cdk

from cdk.stacks.dns import DnsStack
from cdk.stacks.network import NetworkStack
from cdk.stacks.data import DataStack
from cdk.stacks.compute import ComputeStack

from cdk.config import settings, Props


app = cdk.App()

props = Props()
env = cdk.Environment
# TODO: Verify environment stuff works
env = cdk.Environment(account=os.getenv(
    'CDK_DEFAULT_ACCOUNT'), region=settings.REGION)

dns_stack = DnsStack(app, f"{settings.PROJECT_NAME}-dns-stack", env=env)
props.network_hosted_zone = dns_stack.hosted_zone

network_stack = NetworkStack(
    app, f"{settings.PROJECT_NAME}-network-stack", props, env=env)
props.network_vpc = network_stack.vpc
props.network_backend_certificate = network_stack.backend_certificate
props.network_frontend_certificate = network_stack.frontend_certificate

data_stack = DataStack(
    app, f"{settings.PROJECT_NAME}-data-stack", props, env=env)
props.data_aurora_db = data_stack.aurora_db

compute_stack = ComputeStack(
    app, f"{settings.PROJECT_NAME}-compute-stack", props, env=env)

data_stack.add_dependency(network_stack)
compute_stack.add_dependency(data_stack)

app.synth()
