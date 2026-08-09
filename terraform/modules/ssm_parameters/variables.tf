variable "project_name" {
  description = "The name of the project used for tagging and resource naming."
  type        = string
  default     = "enterprise-expense-app"
}

variable "environment" {
  description = "The deployment environment name (e.g. dev, prod)."
  type        = string
}

variable "cognito_user_pool_id" {
  description = "The AWS Cognito User Pool ID."
  type        = string
}

variable "cognito_client_id" {
  description = "The AWS Cognito Web App Client ID."
  type        = string
}

variable "alb_dns_name" {
  description = "The public DNS URL of the Application Load Balancer."
  type        = string
}

variable "ecr_repository_url" {
  description = "The URL of the ECR Repository for Backend Docker images."
  type        = string
}
