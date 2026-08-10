variable "project_name" {
  description = "The name of the project used for tagging and resource naming."
  type        = string
  default     = "enterprise-expense-app"
}

variable "environment" {
  description = "The deployment environment name (e.g. dev, prod)."
  type        = string
}

variable "frontend_s3_bucket_domain_name" {
  description = "The regional domain name of the Frontend S3 Bucket."
  type        = string
}

variable "frontend_s3_bucket_id" {
  description = "The ID/Name of the Frontend S3 Bucket."
  type        = string
}

variable "frontend_s3_bucket_arn" {
  description = "The ARN of the Frontend S3 Bucket."
  type        = string
}

variable "alb_dns_name" {
  description = "The public DNS URL of the Application Load Balancer."
  type        = string
}

variable "custom_domain_name" {
  description = "Optional custom domain name for Route 53 (e.g., app.example.com)."
  type        = string
  default     = ""
}

variable "acm_certificate_arn" {
  description = "Optional ACM SSL Certificate ARN for custom domain."
  type        = string
  default     = ""
}
