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
  description = "The ID of the VPC where the Target Group will be created."
  type        = string
}

variable "public_subnet_ids" {
  description = "List of Public Subnet IDs to attach the Application Load Balancer across."
  type        = list(string)
}

variable "alb_security_group_id" {
  description = "The ID of the ALB Security Group allowing inbound HTTP/HTTPS traffic."
  type        = string
}

variable "app_port" {
  description = "The port on which the backend application instances listen."
  type        = number
  default     = 5000
}

variable "health_check_path" {
  description = "The HTTP health check endpoint path for the Target Group."
  type        = string
  default     = "/api/health"
}
