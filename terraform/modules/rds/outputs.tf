output "cluster_id" {
  description = "The ID of the Aurora Cluster."
  value       = aws_rds_cluster.this.id
}

output "cluster_arn" {
  description = "The ARN of the Aurora Cluster."
  value       = aws_rds_cluster.this.arn
}

output "cluster_endpoint" {
  description = "The Cluster Writer Endpoint DNS address."
  value       = aws_rds_cluster.this.endpoint
}

output "reader_endpoint" {
  description = "The Cluster Reader Endpoint DNS address."
  value       = aws_rds_cluster.this.reader_endpoint
}

output "database_name" {
  description = "The database name."
  value       = var.db_name
}

output "master_username" {
  description = "The master username."
  value       = var.master_username
}
