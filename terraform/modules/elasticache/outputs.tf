output "cluster_id" {
  description = "The ID of the ElastiCache Redis Cluster."
  value       = aws_elasticache_cluster.this.id
}

output "redis_endpoint" {
  description = "The DNS endpoint address of the Redis cluster primary node."
  value       = aws_elasticache_cluster.this.cache_nodes[0].address
}

output "redis_port" {
  description = "The port number of the Redis cluster."
  value       = var.port
}
