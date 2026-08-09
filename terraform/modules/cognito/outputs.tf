output "user_pool_id" {
  description = "The ID of the AWS Cognito User Pool."
  value       = aws_cognito_user_pool.this.id
}

output "user_pool_arn" {
  description = "The ARN of the AWS Cognito User Pool."
  value       = aws_cognito_user_pool.this.arn
}

output "user_pool_client_id" {
  description = "The Web App Client ID for React frontend authentication."
  value       = aws_cognito_user_pool_client.this.id
}
