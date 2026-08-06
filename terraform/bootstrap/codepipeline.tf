# ==============================================================================
# AWS CODEPIPELINE
# ==============================================================================
resource "aws_codepipeline" "pipeline" {
  name     = "${var.project_name}-pipeline"
  role_arn = aws_iam_role.codepipeline_role.arn

  artifact_store {
    location = aws_s3_bucket.codepipeline_artifacts.bucket
    type     = "S3"
  }

  # ----------------------------------------------------------------------------
  # STAGE 1: SOURCE (GitHub Webhook / CodeStar Connection)
  # ----------------------------------------------------------------------------
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

  # ----------------------------------------------------------------------------
  # STAGE 2: PIPELINE SELF-MUTATION (Bootstrap terraform apply)
  # ----------------------------------------------------------------------------
  stage {
    name = "Pipeline_Self_Mutation"

    action {
      name             = "Terraform_Self_Mutate"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      version          = "1"
      input_artifacts  = ["source_output"]
      output_artifacts = ["self_mutate_output"]

      configuration = {
        ProjectName          = aws_codebuild_project.terraform_build.name
        EnvironmentVariables = jsonencode([
          {
            name  = "TF_DIR"
            value = "terraform/bootstrap"
            type  = "PLAINTEXT"
          }
        ])
      }
    }
  }

  # ----------------------------------------------------------------------------
  # STAGE 3: DEV APPLICATION INFRASTRUCTURE (Environments/Dev terraform apply)
  # ----------------------------------------------------------------------------
  stage {
    name = "Dev_Infra_Deploy"

    action {
      name             = "Terraform_Dev_Apply"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      version          = "1"
      input_artifacts  = ["source_output"]
      output_artifacts = ["dev_infra_output"]

      configuration = {
        ProjectName          = aws_codebuild_project.terraform_build.name
        EnvironmentVariables = jsonencode([
          {
            name  = "TF_DIR"
            value = "terraform/environments/dev"
            type  = "PLAINTEXT"
          }
        ])
      }
    }
  }

  tags = {
    Name = "${var.project_name}-pipeline"
  }
}
