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
  description = "The name of the primary (Blue) ALB Target Group."
  type        = string
}

variable "target_group_green_name" {
  description = "The name of the secondary (Green) ALB Target Group for Blue/Green deployment."
  type        = string
}

variable "listener_arn" {
  description = "The ARN of the ALB Listener routing live traffic."
  type        = string
}
