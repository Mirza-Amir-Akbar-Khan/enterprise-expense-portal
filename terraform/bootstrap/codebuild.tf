# CloudWatch Log Group for CodeBuild logs
resource "aws_cloudwatch_log_group" "codebuild" {
  name              = "/aws/codebuild/${var.project_name}-build"
  retention_in_days = 30

  tags = {
    Name = "${var.project_name}-codebuild-logs"
  }
}

# AWS CodeBuild project to execute Terraform infrastructure updates and app builds
resource "aws_codebuild_project" "terraform_build" {
  name          = "${var.project_name}-build"
  description   = "CodeBuild project for enterprise expense application Terraform & CI/CD pipeline"
  build_timeout = 60
  service_role  = aws_iam_role.codebuild_role.arn

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
      value = var.aws_region
    }

    environment_variable {
      name  = "PROJECT_NAME"
      value = var.project_name
    }

    environment_variable {
      name  = "STATE_BUCKET"
      value = aws_s3_bucket.tf_state.id
    }
  }

  source {
    type      = "CODEPIPELINE"
    buildspec = "terraform/bootstrap/buildspec-infra.yml"
  }

  logs_config {
    cloudwatch_logs {
      group_name  = aws_cloudwatch_log_group.codebuild.name
      stream_name = "build-log"
    }
  }

  tags = {
    Name = "${var.project_name}-codebuild-project"
  }
}
