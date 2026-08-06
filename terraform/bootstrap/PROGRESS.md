# 📌 Terraform Bootstrap Layer — Progress Log

This document serves as the official tracking record for the `terraform/bootstrap` infrastructure provisioning progress.

---

## ⚙️ Configuration Parameters
* **Project Name**: `enterprise-expense-app`
* **AWS Region**: `us-west-2`
* **Environment**: `bootstrap`
* **State Locking Strategy**: Native S3 State Locking (`use_lockfile = true`, Terraform v1.10+) — *No DynamoDB required*.

---

## 📋 Completed Tasks

### Phase 1: Storage Infrastructure Setup (S3 Buckets)
- [x] Defined AWS Provider and HashiCorp Terraform constraint configurations (`main.tf`).
- [x] Configured input variables for `aws_region`, `project_name`, and `environment` (`variables.tf`).
- [x] Created `random_id` generator for globally unique S3 bucket naming (`s3.tf`).
- [x] Created **Terraform Remote State S3 Bucket** (`s3.tf`):
  - Enabled **S3 Versioning** for state rollback capability.
  - Enabled **Server-Side Encryption** (`AES256`).
  - Applied **Public Access Block** (all public access denied).
- [x] Created **AWS CodePipeline Artifacts S3 Bucket** (`s3.tf`):
  - Enabled **Server-Side Encryption** (`AES256`).
  - Applied **Public Access Block**.
  - Configured **Lifecycle Rule** to auto-expire old build zip artifacts after 30 days.
- [x] Defined Terraform stack outputs (`outputs.tf`).
- [x] Configured **S3 Remote Backend with Native Locking** (`backend.tf`):
  - Bucket: `enterprise-expense-app-tf-state-21ac1bae`
  - Key: `bootstrap/terraform.tfstate`
  - Lockfile: `use_lockfile = true`
- [x] Migrated local state to S3 Remote Backend (`terraform init -migrate-state`).

### Phase 2: IAM Service Roles & Permissions
- [x] Created **AWS CodePipeline IAM Role & Policy** (`iam.tf`):
  - Trusted entity: `codepipeline.amazonaws.com`.
  - Permissions: S3 artifact access, CodeBuild start/batch get, and GitHub CodeStar connection permissions.
- [x] Created **AWS CodeBuild IAM Role & Policy** (`iam.tf`):
  - Trusted entity: `codebuild.amazonaws.com`.
  - Permissions: CloudWatch logging, S3 state/artifact storage access, ECR access, and infrastructure provisioning permissions.

### Phase 3: CodeBuild Container Project Setup
- [x] Created **CloudWatch Log Group** (`codebuild.tf`):
  - Log group name: `/aws/codebuild/enterprise-expense-app-build`.
- [x] Created **AWS CodeBuild Project** (`codebuild.tf`):
  - Project name: `enterprise-expense-app-build`.
  - Image: `aws/codebuild/amazonlinux2-x86_64-standard:5.0` (`privileged_mode = true` enabled for Docker image builds).
  - Buildspec path: `terraform/bootstrap/buildspec-infra.yml`.
  - Configured input environment variables for Region, Project Name, and State Bucket.
- [x] Created **CodeBuild Buildspec File** (`buildspec-infra.yml`):
  - Automates downloading Terraform 1.10.0, `terraform init`, `terraform plan`, and `terraform apply -auto-approve`.

### Phase 4: AWS CodePipeline & GitHub Connection
- [x] Configured **Existing AWS CodeStar Connection** (`variables.tf` / `codepipeline.tf`):
  - Connection ARN: `arn:aws:codeconnections:us-west-2:395063533284:connection/a69b0212-a1c5-4916-bf71-0df4812ccc96`.
  - Linked GitHub repo: `awabamjad1/internship-program-2026`.
  - Trigger Branch: `feature/enterprise-expense-terraform-amir`.
- [x] Created **AWS CodePipeline** (`codepipeline.tf`):
  - Pipeline name: `enterprise-expense-app-pipeline`.
  - Stage 1 (`Source`): Listens for GitHub pushes via CodeStar Connection.
  - Stage 2 (`Pipeline_Self_Mutation`): Invokes CodeBuild targeting `TF_DIR = terraform/bootstrap`.
  - Stage 3 (`Dev_Infra_Deploy`): Invokes CodeBuild targeting `TF_DIR = terraform/environments/dev`.

---

## 📦 Resource Inventory

| Resource Name | Terraform Resource Identifier | Description |
|---|---|---|
| State Bucket | `aws_s3_bucket.tf_state` | Stores `.tfstate` files for bootstrap & environments |
| Artifacts Bucket | `aws_s3_bucket.codepipeline_artifacts` | Stores CodePipeline build outputs & source zips |
| Random Suffix | `random_id.bucket_suffix` | Ensures bucket global uniqueness |
| CodePipeline Role | `aws_iam_role.codepipeline_role` | IAM service role for AWS CodePipeline |
| CodeBuild Role | `aws_iam_role.codebuild_role` | IAM service role for AWS CodeBuild |
| CodeBuild Log Group | `aws_cloudwatch_log_group.codebuild` | CloudWatch log group for build streams |
| CodeBuild Project | `aws_codebuild_project.terraform_build` | Container project executing Terraform & builds |
| CodePipeline | `aws_codepipeline.pipeline` | Self-mutating 3-stage CI/CD pipeline |

---

## 🚀 Next Planned Milestone: Application Infrastructure (`terraform/environments/dev`)
- [ ] Create `terraform/environments/dev/backend.tf` pointing to S3 state bucket with key `environments/dev/terraform.tfstate`.
- [ ] Build reusable modules in `terraform/modules/` (VPC, ECR, ECS / EC2, RDS MySQL, ALB, Security Groups).
- [ ] Wire `terraform/environments/dev` configuration.
- [ ] Push changes to `feature/enterprise-expense-terraform-amir` branch to test automated CI/CD pipeline execution in AWS CodePipeline!
