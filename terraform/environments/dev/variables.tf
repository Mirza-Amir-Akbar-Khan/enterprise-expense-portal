variable "aws_region" {
  description = "The AWS region to deploy dev infrastructure into."
  type        = string
  default     = "us-west-2"
}

variable "project_name" {
  description = "The name of the project used for tagging and resource naming."
  type        = string
  default     = "enterprise-expense-app"
}

variable "environment" {
  description = "Environment name."
  type        = string
  default     = "dev"
}
