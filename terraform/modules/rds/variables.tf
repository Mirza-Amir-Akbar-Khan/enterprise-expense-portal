variable "project_name" {
  description = "The name of the project used for tagging and resource naming."
  type        = string
  default     = "enterprise-expense-app"
}

variable "environment" {
  description = "The deployment environment name (e.g. dev, prod)."
  type        = string
}

variable "private_db_subnet_ids" {
  description = "List of private database subnet IDs across Multi-AZs."
  type        = list(string)
}

variable "db_security_group_id" {
  description = "Security Group ID for the RDS Aurora MySQL Cluster."
  type        = string
}

variable "instance_class" {
  description = "The database instance class for Aurora compute nodes."
  type        = string
  default     = "db.t4g.medium"
}

variable "instance_count" {
  description = "Number of Aurora cluster instances (1 Writer + N Readers)."
  type        = number
  default     = 2
}

variable "db_name" {
  description = "The initial database name created upon initialization."
  type        = string
  default     = "enterprise_expense_db"
}

variable "master_username" {
  description = "Master database administrator username."
  type        = string
  default     = "admin_user"
}

variable "master_password" {
  description = "Master database administrator password."
  type        = string
  sensitive   = true
  default     = "AdminSecurePass123!"
}
