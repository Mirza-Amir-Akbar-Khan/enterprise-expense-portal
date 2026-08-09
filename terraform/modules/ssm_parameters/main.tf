# ==============================================================================
# AWS SSM PARAMETER STORE CONFIGURATION PARAMETERS
# ==============================================================================

# Cognito User Pool ID
resource "aws_ssm_parameter" "cognito_user_pool_id" {
  name        = "/${var.project_name}/${var.environment}/cognito_user_pool_id"
  description = "AWS Cognito User Pool ID"
  type        = "String"
  value       = var.cognito_user_pool_id

  tags = {
    Name        = "${var.project_name}-${var.environment}-cognito-user-pool-id"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# Cognito Client ID
resource "aws_ssm_parameter" "cognito_client_id" {
  name        = "/${var.project_name}/${var.environment}/cognito_client_id"
  description = "AWS Cognito App Client ID"
  type        = "String"
  value       = var.cognito_client_id

  tags = {
    Name        = "${var.project_name}-${var.environment}-cognito-client-id"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# ALB API URL
resource "aws_ssm_parameter" "api_url" {
  name        = "/${var.project_name}/${var.environment}/api_url"
  description = "Application Load Balancer API DNS URL"
  type        = "String"
  value       = var.alb_dns_name

  tags = {
    Name        = "${var.project_name}-${var.environment}-api-url"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# ECR Repository URL
resource "aws_ssm_parameter" "ecr_repository_url" {
  name        = "/${var.project_name}/${var.environment}/ecr_repository_url"
  description = "ECR Repository URL for Backend Docker images"
  type        = "String"
  value       = var.ecr_repository_url

  tags = {
    Name        = "${var.project_name}-${var.environment}-ecr-repo-url"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}
