# ==============================================================================
# 1. ELASTICACHE SUBNET GROUP (Private DB Subnets across Multi-AZs)
# ==============================================================================
resource "aws_elasticache_subnet_group" "this" {
  name       = "${var.project_name}-${var.environment}-redis-subnet-group"
  subnet_ids = var.private_db_subnet_ids

  tags = {
    Name        = "${var.project_name}-${var.environment}-redis-subnet-group"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# ==============================================================================
# 2. ELASTICACHE REDIS CLUSTER
# ==============================================================================
resource "aws_elasticache_cluster" "this" {
  cluster_id           = "${var.project_name}-${var.environment}-redis"
  engine               = "redis"
  node_type            = var.node_type
  num_cache_nodes      = var.num_cache_nodes
  parameter_group_name = "default.redis7"
  engine_version       = "7.1"
  port                 = var.port
  subnet_group_name    = aws_elasticache_subnet_group.this.name
  security_group_ids   = [var.redis_security_group_id]

  tags = {
    Name        = "${var.project_name}-${var.environment}-redis"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# ==============================================================================
# 3. SSM PARAMETER STORE REDIS ENDPOINT & PORT
# ==============================================================================
resource "aws_ssm_parameter" "redis_host" {
  name        = "/${var.project_name}/${var.environment}/redis_host"
  description = "AWS ElastiCache Redis Cluster Endpoint DNS"
  type        = "String"
  value       = aws_elasticache_cluster.this.cache_nodes[0].address

  tags = {
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

resource "aws_ssm_parameter" "redis_port" {
  name        = "/${var.project_name}/${var.environment}/redis_port"
  description = "AWS ElastiCache Redis Cluster Port Number"
  type        = "String"
  value       = tostring(var.port)

  tags = {
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}
