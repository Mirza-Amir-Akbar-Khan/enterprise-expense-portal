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

output "codepipeline_name" {
  description = "The name of the self-mutating CodePipeline."
  value       = module.cicd.codepipeline_name
}

output "codebuild_project_name" {
  description = "The name of the CodeBuild build runner project."
  value       = module.cicd.codebuild_project_name
}

output "vpc_id" {
  description = "The ID of the provisioned dev VPC."
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  description = "List of public subnet IDs."
  value       = module.vpc.public_subnet_ids
}

output "private_app_subnet_ids" {
  description = "List of private app subnet IDs."
  value       = module.vpc.private_app_subnet_ids
}

output "private_db_subnet_ids" {
  description = "List of private db subnet IDs."
  value       = module.vpc.private_db_subnet_ids
}

output "nat_gateway_ips" {
  description = "List of public IPs for the NAT Gateways."
  value       = module.vpc.nat_gateway_ips
}
