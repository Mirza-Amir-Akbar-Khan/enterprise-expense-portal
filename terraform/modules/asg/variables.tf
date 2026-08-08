variable "project_name" {
  description = "The name of the project used for tagging and resource naming."
  type        = string
  default     = "enterprise-expense-app"
}

variable "environment" {
  description = "The deployment environment name (e.g. dev, prod)."
  type        = string
}

variable "vpc_id" {
  description = "The ID of the VPC where the Auto Scaling Group will be created."
  type        = string
}

variable "private_app_subnet_ids" {
  description = "List of Private Application Subnet IDs for EC2 instance placement."
  type        = list(string)
}

variable "app_security_group_id" {
  description = "The Security Group ID for EC2 application instances."
  type        = string
}

variable "target_group_arn" {
  description = "The ARN of the ALB Target Group to attach the Auto Scaling Group to."
  type        = string
}

variable "instance_type" {
  description = "The EC2 instance type for Auto Scaling instances."
  type        = string
  default     = "t3.micro"
}

variable "min_size" {
  description = "Minimum number of instances in the Auto Scaling Group."
  type        = number
  default     = 1
}

variable "max_size" {
  description = "Maximum number of instances in the Auto Scaling Group."
  type        = number
  default     = 3
}

variable "desired_capacity" {
  description = "Desired number of instances in the Auto Scaling Group."
  type        = number
  default     = 2
}
