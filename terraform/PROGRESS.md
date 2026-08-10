# 📌 Terraform Infrastructure Progress Log

This document serves as the official tracking record for the `enterprise-expense-app` Terraform infrastructure provisioning progress.

---

## ⚙️ Configuration Parameters
* **Project Name**: `enterprise-expense-app`
* **AWS Region**: `us-west-2`
* **Environment**: `dev`
* **State Locking Strategy**: Native S3 State Locking (`use_lockfile = true`, Terraform v1.10+) — *No DynamoDB required*.
* **State Bucket**: `enterprise-expense-app-tf-state-21ac1bae`
* **State Key**: `environments/dev/terraform.tfstate`

---

## 📋 Completed Tasks

### Phase 1: Consolidated Modular Architecture
- [x] Preserved remote state bucket `enterprise-expense-app-tf-state-21ac1bae`.
- [x] Restructured project into a single root module (`terraform/environments/dev`) with reusable modules in `terraform/modules/`.
- [x] Created `buildspec-infra.yml` in `terraform/buildspec-infra.yml`.

### Phase 2: Reusable Infrastructure Modules (`terraform/modules/`)
- [x] Created `modules/cicd` (Unified 7-stage self-mutating CodePipeline, CodeBuild runners, S3 Artifact & Frontend Hosting buckets, IAM roles, Manual Approval gate).
- [x] Created `modules/vpc` (Multi-AZ VPC, 6 Subnets across 2 AZs, IGW, 2x NAT Gateways + EIPs, Route Tables).
- [x] Created `modules/security_groups` (ALB -> EC2 -> RDS firewall chain).
- [x] Created `modules/alb` (Application Load Balancer, Target Groups, HTTP Listener).
- [x] Created `modules/asg` (Launch Template, EC2 Auto Scaling Group, IAM Instance Profile, User Data script for Docker & CodeDeploy Agent).
- [x] Created `modules/ecr` (AWS ECR repository for Backend Docker images).
- [x] Created `modules/cognito` (AWS Cognito User Pool & User Pool Client).
- [x] Created `modules/ssm_parameters` (SSM Parameter Store parameters for Cognito User Pool ID, Client ID, API URL, ECR URL).
- [x] Created `modules/codedeploy` (CodeDeploy Application & Blue/Green Group targeting ASG & ALB Target Groups).
- [x] Created `modules/cloudfront` (AWS CloudFront CDN Distribution for Frontend S3 + Backend ALB API, OAC, CORS elimination, SPA routing).
- [x] Created `modules/rds` (Amazon Aurora MySQL Cluster with 2x db.t4g.medium instances, DB Subnet Group, and SSM credentials).
- [x] Created `modules/elasticache` (AWS ElastiCache Redis 7.1 cluster with cache.t4g.micro instance, Subnet Group, Security Group, and SSM endpoints).











### Phase 3: Single Root Environment Wiring (`terraform/environments/dev`)
- [x] Configured `backend.tf` pointing to key `environments/dev/terraform.tfstate`.
- [x] Configured `main.tf` instantiating `module "cicd"`, `module "vpc"`, and `module "security_groups"`.
- [x] Executed local `terraform init` and `terraform apply`.
- [x] Pushed to GitHub and verified automated self-mutating CI/CD pipeline execution in AWS CodePipeline!
