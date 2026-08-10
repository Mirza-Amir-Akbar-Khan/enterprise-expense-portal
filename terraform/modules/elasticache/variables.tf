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

variable "redis_security_group_id" {
  description = "Security Group ID for the ElastiCache Redis cluster."
  type        = string
}

variable "node_type" {
  description = "The compute node type for ElastiCache Redis."
  type        = string
  default     = "cache.t4g.micro"
}

variable "num_cache_nodes" {
  description = "The number of cache nodes in the Redis cluster."
  type        = number
  default     = 1
}

variable "port" {
  description = "The port number on which the Redis cache cluster accepts connections."
  type        = number
  default     = 6379
}
