output "codepipeline_arn" {
  description = "The ARN of the CodePipeline."
  value       = aws_codepipeline.pipeline.arn
}

output "codepipeline_name" {
  description = "The name of the CodePipeline."
  value       = aws_codepipeline.pipeline.name
}

output "codebuild_project_name" {
  description = "The name of the CodeBuild project."
  value       = aws_codebuild_project.terraform_build.name
}

output "artifacts_bucket_name" {
  description = "The name of the S3 bucket used for CodePipeline build artifacts."
  value       = aws_s3_bucket.codepipeline_artifacts.bucket
}
