output "cognito_user_pool_id_arn" {
  description = "SSM Parameter ARN for Cognito User Pool ID."
  value       = aws_ssm_parameter.cognito_user_pool_id.arn
}

output "cognito_client_id_arn" {
  description = "SSM Parameter ARN for Cognito Client ID."
  value       = aws_ssm_parameter.cognito_client_id.arn
}

output "api_url_arn" {
  description = "SSM Parameter ARN for API URL."
  value       = aws_ssm_parameter.api_url.arn
}

output "ecr_repository_url_arn" {
  description = "SSM Parameter ARN for ECR Repository URL."
  value       = aws_ssm_parameter.ecr_repository_url.arn
}
