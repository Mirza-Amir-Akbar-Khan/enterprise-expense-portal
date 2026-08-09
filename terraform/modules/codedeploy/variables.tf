variable "project_name" {
  description = "The name of the project used for tagging and resource naming."
  type        = string
  default     = "enterprise-expense-app"
}

variable "environment" {
  description = "The deployment environment name (e.g. dev, prod)."
  type        = string
}

variable "asg_name" {
  description = "The name of the EC2 Auto Scaling Group."
  type        = string
}

variable "target_group_name" {
  description = "The name of the ALB Target Group."
  type        = string
}
