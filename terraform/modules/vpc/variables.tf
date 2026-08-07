variable "project_name" {
  description = "The name of the project used for resource naming and tagging."
  type        = string
  default     = "enterprise-expense-app"
}

variable "environment" {
  description = "The deployment environment name (e.g. dev, prod)."
  type        = string
}

variable "vpc_cidr" {
  description = "The IPv4 CIDR block for the VPC."
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of Availability Zones to distribute subnets across (must contain at least 2 AZs)."
  type        = list(string)
  default     = ["us-west-2a", "us-west-2b"]
}

variable "public_subnet_cidrs" {
  description = "List of CIDR blocks for the Public Subnets (1 per AZ)."
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_app_subnet_cidrs" {
  description = "List of CIDR blocks for the Private Application Subnets (1 per AZ)."
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24"]
}

variable "private_db_subnet_cidrs" {
  description = "List of CIDR blocks for the Private Database Subnets (1 per AZ)."
  type        = list(string)
  default     = ["10.0.21.0/24", "10.0.22.0/24"]
}
