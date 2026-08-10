# ==============================================================================
# 1. DB SUBNET GROUP (Private DB Subnets across Multi-AZs)
# ==============================================================================
resource "aws_db_subnet_group" "this" {
  name       = "${var.project_name}-${var.environment}-db-subnet-group"
  subnet_ids = var.private_db_subnet_ids

  tags = {
    Name        = "${var.project_name}-${var.environment}-db-subnet-group"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# ==============================================================================
# 2. AURORA MYSQL DATABASE CLUSTER
# ==============================================================================
resource "aws_rds_cluster" "this" {
  cluster_identifier      = "${var.project_name}-${var.environment}-aurora-cluster"
  engine                  = "aurora-mysql"
  database_name           = var.db_name
  master_username         = var.master_username
  master_password         = var.master_password
  db_subnet_group_name    = aws_db_subnet_group.this.name
  vpc_security_group_ids  = [var.db_security_group_id]
  skip_final_snapshot     = true
  storage_encrypted       = true
  deletion_protection     = false

  tags = {
    Name        = "${var.project_name}-${var.environment}-aurora-cluster"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# ==============================================================================
# 3. AURORA CLUSTER INSTANCES (1 Writer + 1 Reader across 2 AZs)
# ==============================================================================
resource "aws_rds_cluster_instance" "this" {
  count               = var.instance_count
  identifier          = "${var.project_name}-${var.environment}-aurora-node-${count.index + 1}"
  cluster_identifier = aws_rds_cluster.this.id
  instance_class      = var.instance_class
  engine              = aws_rds_cluster.this.engine
  engine_version      = aws_rds_cluster.this.engine_version
  publicly_accessible = false

  tags = {
    Name        = "${var.project_name}-${var.environment}-aurora-node-${count.index + 1}"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# ==============================================================================
# 4. SSM PARAMETER STORE DATABASE CREDENTIALS & ENDPOINTS
# ==============================================================================
resource "aws_ssm_parameter" "db_host" {
  name        = "/${var.project_name}/${var.environment}/db_host"
  description = "RDS Aurora MySQL Cluster Writer Endpoint DNS"
  type        = "String"
  value       = aws_rds_cluster.this.endpoint

  tags = {
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

resource "aws_ssm_parameter" "db_reader_host" {
  name        = "/${var.project_name}/${var.environment}/db_reader_host"
  description = "RDS Aurora MySQL Cluster Reader Endpoint DNS"
  type        = "String"
  value       = aws_rds_cluster.this.reader_endpoint

  tags = {
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

resource "aws_ssm_parameter" "db_name" {
  name        = "/${var.project_name}/${var.environment}/db_name"
  description = "RDS Aurora MySQL Database Name"
  type        = "String"
  value       = var.db_name

  tags = {
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

resource "aws_ssm_parameter" "db_user" {
  name        = "/${var.project_name}/${var.environment}/db_user"
  description = "RDS Aurora MySQL Database Master Username"
  type        = "String"
  value       = var.master_username

  tags = {
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

resource "aws_ssm_parameter" "db_password" {
  name        = "/${var.project_name}/${var.environment}/db_password"
  description = "RDS Aurora MySQL Database Master Password"
  type        = "SecureString"
  value       = var.master_password

  tags = {
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}
