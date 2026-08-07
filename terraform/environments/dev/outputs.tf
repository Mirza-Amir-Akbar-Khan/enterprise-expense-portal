output "environment" {
  description = "The deployed environment name."
  value       = var.environment
}

output "aws_region" {
  description = "The AWS region where dev resources are deployed."
  value       = var.aws_region
}

output "aws_account_id" {
  description = "AWS Account ID where dev resources are provisioned."
  value       = data.aws_caller_identity.current.account_id
}
