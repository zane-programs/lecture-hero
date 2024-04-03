# LectureHero

## About

Generate notes for your course videos automatically with LectureHero!

Comprised of a proof-of-concept Chrom{e, ium} extension (`chrome-extension`), web application (frontend: `web`, backend: `app`), and infrasturcture encoded as AWS CDK (`cdk`).

*(CDK IaC written as final project for [CS 40: Cloud Infrastructure and Scalable Application Deployment](https://infracourse.cloud/), taught by [Aditya Saligrama](https://saligrama.io/) and [Cody Ho](https://github.com/aesrentai))*

## Chrome Extension (`chrome-extension`)

The Chrome extension injects a button into the navigation bar of a Panopto course video that allows a user to easily generate or view a summary for a given lecture video. When clicked, the button grabs a transcript of the lecture from Panopto and provides it to the API to generate a summary.

For purposes of the proof of concept, the browser extension stores username and password and authenticates each request to the LectureHero API with a Basic auth-like authorization scheme (I called it LazyAuth, haha!).

## Web Application

### Frontend (`web`)

I built a simple but clean frontend with TypeScript and [React](https://react.dev/) that renders notes from their original Markdown format. Users are able to share and download notes as Markdown or HTML. Additionally, the user can swap between light and dark modes for readibility.

### Backend (`app`)

The backend is written in TypeScript, using [Express](https://expressjs.com/) to handle user requests and [Prisma](https://www.prisma.io/) as an ORM used to safely and efficiently query Postgres (see [**Infrastructure**](#infrastructure-cdk) for more on DB).

The code is organized in a roughly MVC pattern, such that application logic in `src/controllers` exists separately from routing in `src/routes`.

For easy containerization, the `app` directory contains a `Dockerfile` for Node.js 18 on Alpine Linux that migrates the database schema from Prisma and starts the application server.

## Infrastructure (`cdk`)

- **Data:** The application stores user information (credentials, notes, etc.) in a [Aurora Serverless PostgreSQL](https://aws.amazon.com/rds/aurora/) for improved elasticity and scalability along with the robustness of Postgres. Relevant application secrets are stored by and accessed via [Secrets Manager](https://aws.amazon.com/secrets-manager/).
- **Compute:** Application logic runs on [Elastic Container Service](https://aws.amazon.com/ecs/) instances, scaled automatically by [Fargate](https://aws.amazon.com/fargate/) to handle elastic user demand. Additionally, an [Application Load Balancer](https://aws.amazon.com/elasticloadbalancing/application-load-balancer/) routes user requests to different containers to optimize for efficiency.
- **Network:** This deployment contains a VPC available across two availability zones (`us-west-2a` and `us-west-2b`), such that the Aurora DB instances are in the private subnets, the ECS clusters are in the private subnets *with egress*, and the ALBs exist in the public subnets for user access. TLS certificates for backend and frontend are generated with [Certificate Manager](https://aws.amazon.com/certificate-manager/), and [Route 53](https://aws.amazon.com/route53/) is used to manage DNS.

## Demo

I've posted a demo/tutorial video for my initial deployment [on YouTube](https://www.youtube.com/watch?v=7vUBtNgY49g)!