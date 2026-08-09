# Random ID suffix for globally unique S3 bucket naming
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# ==============================================================================
# 1. S3 ARTIFACT BUCKET & FRONTEND HOSTING BUCKET
# ==============================================================================
resource "aws_s3_bucket" "codepipeline_artifacts" {
  bucket        = "${var.project_name}-pipeline-artifacts-${random_id.bucket_suffix.hex}"
  force_destroy = true

  tags = {
    Name        = "${var.project_name}-pipeline-artifacts"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "codepipeline_artifacts_crypto" {
  bucket = aws_s3_bucket.codepipeline_artifacts.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "codepipeline_artifacts_privacy" {
  bucket                  = aws_s3_bucket.codepipeline_artifacts.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "codepipeline_artifacts_lifecycle" {
  bucket = aws_s3_bucket.codepipeline_artifacts.id

  rule {
    id     = "expire-old-artifacts"
    status = "Enabled"

    filter {}

    expiration {
      days = 30
    }
  }
}

# Frontend S3 Web Hosting Bucket
resource "aws_s3_bucket" "frontend_hosting" {
  bucket        = "${var.project_name}-frontend-hosting-${random_id.bucket_suffix.hex}"
  force_destroy = true

  tags = {
    Name        = "${var.project_name}-frontend-hosting"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

resource "aws_s3_bucket_website_configuration" "frontend_hosting_site" {
  bucket = aws_s3_bucket.frontend_hosting.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

resource "aws_s3_bucket_public_access_block" "frontend_hosting_privacy" {
  bucket                  = aws_s3_bucket.frontend_hosting.id
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "frontend_hosting_policy" {
  bucket     = aws_s3_bucket.frontend_hosting.id
  depends_on = [aws_s3_bucket_public_access_block.frontend_hosting_privacy]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.frontend_hosting.arn}/*"
      }
    ]
  })
}

# ==============================================================================
# 2. IAM ROLES & POLICIES (CODEPIPELINE & CODEBUILD)
# ==============================================================================

# CodePipeline IAM Role
resource "aws_iam_role" "codepipeline_role" {
  name = "${var.project_name}-${var.environment}-codepipeline-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "codepipeline.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-${var.environment}-codepipeline-role"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

resource "aws_iam_role_policy" "codepipeline_policy" {
  name = "${var.project_name}-${var.environment}-codepipeline-policy"
  role = aws_iam_role.codepipeline_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:GetBucketVersioning",
          "s3:PutObjectAcl",
          "s3:PutObject"
        ]
        Resource = [
          aws_s3_bucket.codepipeline_artifacts.arn,
          "${aws_s3_bucket.codepipeline_artifacts.arn}/*",
          aws_s3_bucket.frontend_hosting.arn,
          "${aws_s3_bucket.frontend_hosting.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "codebuild:BatchGetBuilds",
          "codebuild:StartBuild"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "codedeploy:CreateDeployment",
          "codedeploy:GetApplication",
          "codedeploy:GetApplicationRevision",
          "codedeploy:GetDeployment",
          "codedeploy:GetDeploymentConfig",
          "codedeploy:RegisterApplicationRevision"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "codestar-connections:UseConnection"
        ]
        Resource = "*"
      }
    ]
  })
}

# CodeBuild IAM Role
resource "aws_iam_role" "codebuild_role" {
  name = "${var.project_name}-${var.environment}-codebuild-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "codebuild.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-${var.environment}-codebuild-role"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

resource "aws_iam_role_policy_attachment" "codebuild_admin" {
  role       = aws_iam_role.codebuild_role.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}

# ==============================================================================
# 3. CODEBUILD PROJECTS (INFRA, BACKEND, FRONTEND)
# ==============================================================================

resource "aws_cloudwatch_log_group" "codebuild" {
  name              = "/aws/codebuild/${var.project_name}-${var.environment}-build"
  retention_in_days = 14

  tags = {
    Name        = "${var.project_name}-${var.environment}-codebuild-log-group"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# Infrastructure CodeBuild Runner
resource "aws_codebuild_project" "terraform_build" {
  name          = "${var.project_name}-${var.environment}-infra-build"
  description   = "CodeBuild project for ${var.project_name} Terraform automation"
  service_role  = aws_iam_role.codebuild_role.arn
  build_timeout = "30"

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type                = "BUILD_GENERAL1_SMALL"
    image                       = "aws/codebuild/amazonlinux2-x86_64-standard:5.0"
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "CODEBUILD"
    privileged_mode             = true

    environment_variable {
      name  = "AWS_DEFAULT_REGION"
      value = "us-west-2"
    }

    environment_variable {
      name  = "PROJECT_NAME"
      value = var.project_name
    }
  }

  source {
    type      = "CODEPIPELINE"
    buildspec = "terraform/buildspec-infra.yml"
  }

  logs_config {
    cloudwatch_logs {
      group_name  = aws_cloudwatch_log_group.codebuild.name
      stream_name = "infra-build-log"
    }
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-infra-build"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# Backend CodeBuild Runner (Docker & ECR)
resource "aws_codebuild_project" "backend_build" {
  name          = "${var.project_name}-${var.environment}-backend-build"
  description   = "CodeBuild project for ${var.project_name} Backend Docker build"
  service_role  = aws_iam_role.codebuild_role.arn
  build_timeout = "30"

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type                = "BUILD_GENERAL1_SMALL"
    image                       = "aws/codebuild/amazonlinux2-x86_64-standard:5.0"
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "CODEBUILD"
    privileged_mode             = true

    environment_variable {
      name  = "AWS_DEFAULT_REGION"
      value = "us-west-2"
    }

    environment_variable {
      name  = "IMAGE_REPO_NAME"
      value = "${var.project_name}-backend-${var.environment}"
    }
  }

  source {
    type      = "CODEPIPELINE"
    buildspec = "backend/buildspec.yml"
  }

  logs_config {
    cloudwatch_logs {
      group_name  = aws_cloudwatch_log_group.codebuild.name
      stream_name = "backend-build-log"
    }
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-backend-build"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# Frontend CodeBuild Runner (Vite & S3 Sync)
resource "aws_codebuild_project" "frontend_build" {
  name          = "${var.project_name}-${var.environment}-frontend-build"
  description   = "CodeBuild project for ${var.project_name} Frontend React build & S3 deploy"
  service_role  = aws_iam_role.codebuild_role.arn
  build_timeout = "30"

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type                = "BUILD_GENERAL1_SMALL"
    image                       = "aws/codebuild/amazonlinux2-x86_64-standard:5.0"
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "CODEBUILD"
    privileged_mode             = false

    environment_variable {
      name  = "AWS_DEFAULT_REGION"
      value = "us-west-2"
    }

    environment_variable {
      name  = "FRONTEND_BUCKET"
      value = aws_s3_bucket.frontend_hosting.bucket
    }
  }

  source {
    type      = "CODEPIPELINE"
    buildspec = "frontend/buildspec.yml"
  }

  logs_config {
    cloudwatch_logs {
      group_name  = aws_cloudwatch_log_group.codebuild.name
      stream_name = "frontend-build-log"
    }
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-frontend-build"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# ==============================================================================
# 4. CODEPIPELINE (UNIFIED 7-STAGE SELF-MUTATING PIPELINE)
# ==============================================================================

resource "aws_codepipeline" "pipeline" {
  name     = "${var.project_name}-${var.environment}-pipeline"
  role_arn = aws_iam_role.codepipeline_role.arn

  artifact_store {
    location = aws_s3_bucket.codepipeline_artifacts.bucket
    type     = "S3"
  }

  # Stage 1: Source
  stage {
    name = "Source"

    action {
      name             = "GitHub_Source"
      category         = "Source"
      owner            = "AWS"
      provider         = "CodeStarSourceConnection"
      version          = "1"
      output_artifacts = ["source_output"]

      configuration = {
        ConnectionArn        = var.codestar_connection_arn
        FullRepositoryId     = var.github_repository
        BranchName           = var.github_branch
        DetectChanges        = "true"
        OutputArtifactFormat = "CODE_ZIP"
      }
    }
  }

  # Stage 2: Terraform Plan
  stage {
    name = "Terraform_Plan"

    action {
      name             = "Terraform_Plan"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      version          = "1"
      input_artifacts  = ["source_output"]
      output_artifacts = ["plan_output"]

      configuration = {
        ProjectName          = aws_codebuild_project.terraform_build.name
        EnvironmentVariables = jsonencode([
          {
            name  = "ACTION"
            value = "plan"
            type  = "PLAINTEXT"
          },
          {
            name  = "TF_DIR"
            value = var.target_tf_dir
            type  = "PLAINTEXT"
          }
        ])
      }
    }
  }

  # Stage 3: Manual Approval Gate
  stage {
    name = "Manual_Approval"

    action {
      name     = "Approve_Plan"
      category = "Approval"
      owner    = "AWS"
      provider = "Manual"
      version  = "1"

      configuration = {
        CustomData = "Please review the terraform plan output in CodeBuild logs before approving infrastructure execution."
      }
    }
  }

  # Stage 4: Terraform Apply (Self-Mutation)
  stage {
    name = "Terraform_Apply"

    action {
      name             = "Terraform_Apply"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      version          = "1"
      input_artifacts  = ["plan_output"]
      output_artifacts = ["infra_output"]

      configuration = {
        ProjectName          = aws_codebuild_project.terraform_build.name
        EnvironmentVariables = jsonencode([
          {
            name  = "ACTION"
            value = "apply"
            type  = "PLAINTEXT"
          },
          {
            name  = "TF_DIR"
            value = var.target_tf_dir
            type  = "PLAINTEXT"
          }
        ])
      }
    }
  }

  # Stage 5: Backend Build (Docker & ECR)
  stage {
    name = "Backend_Build"

    action {
      name             = "Backend_Build"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      version          = "1"
      input_artifacts  = ["source_output"]
      output_artifacts = ["backend_build_output"]

      configuration = {
        ProjectName = aws_codebuild_project.backend_build.name
      }
    }
  }

  # Stage 6: Backend Deploy (AWS CodeDeploy Blue/Green)
  stage {
    name = "Backend_Deploy"

    action {
      name            = "Backend_Deploy"
      category        = "Deploy"
      owner           = "AWS"
      provider        = "CodeDeploy"
      version         = "1"
      input_artifacts = ["backend_build_output"]

      configuration = {
        ApplicationName     = "${var.project_name}-${var.environment}-backend-app"
        DeploymentGroupName = "${var.project_name}-${var.environment}-backend-dg"
      }
    }
  }

  # Stage 7: Frontend Build and Deploy (Vite & S3 Sync)
  stage {
    name = "Frontend_Build_And_Deploy"

    action {
      name             = "Frontend_Build"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      version          = "1"
      input_artifacts  = ["source_output"]
      output_artifacts = ["frontend_build_output"]

      configuration = {
        ProjectName = aws_codebuild_project.frontend_build.name
      }
    }
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-pipeline"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}
