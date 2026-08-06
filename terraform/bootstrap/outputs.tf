output "aws_region" {
  description = "The AWS region where bootstrap resources reside."
  value       = var.aws_region
}

output "terraform_state_bucket_name" {
  description = "Name of the S3 bucket created for storing Terraform remote state files."
  value       = aws_s3_bucket.tf_state.id
}

output "terraform_state_bucket_arn" {
  description = "ARN of the S3 bucket created for storing Terraform remote state files."
  value       = aws_s3_bucket.tf_state.arn
}

output "codepipeline_artifacts_bucket_name" {
  description = "Name of the S3 bucket created for storing AWS CodePipeline artifacts."
  value       = aws_s3_bucket.codepipeline_artifacts.id
}

output "codepipeline_artifacts_bucket_arn" {
  description = "ARN of the S3 bucket created for storing AWS CodePipeline artifacts."
  value       = aws_s3_bucket.codepipeline_artifacts.arn
}

output "codepipeline_role_arn" {
  description = "ARN of the IAM Role created for AWS CodePipeline."
  value       = aws_iam_role.codepipeline_role.arn
}

output "codebuild_role_arn" {
  description = "ARN of the IAM Role created for AWS CodeBuild."
  value       = aws_iam_role.codebuild_role.arn
}

output "codebuild_project_name" {
  description = "Name of the AWS CodeBuild project created for Terraform infrastructure execution."
  value       = aws_codebuild_project.terraform_build.name
}

output "codebuild_project_arn" {
  description = "ARN of the AWS CodeBuild project created for Terraform infrastructure execution."
  value       = aws_codebuild_project.terraform_build.arn
}

output "codestar_connection_arn" {
  description = "ARN of the existing AWS CodeStar GitHub Connection."
  value       = var.codestar_connection_arn
}

output "codepipeline_name" {
  description = "Name of the created AWS CodePipeline."
  value       = aws_codepipeline.pipeline.name
}

output "codepipeline_arn" {
  description = "ARN of the created AWS CodePipeline."
  value       = aws_codepipeline.pipeline.arn
}
