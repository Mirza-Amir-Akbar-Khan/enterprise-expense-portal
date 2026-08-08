output "alb_security_group_id" {
  description = "The ID of the Application Load Balancer Security Group."
  value       = aws_security_group.alb.id
}

output "app_security_group_id" {
  description = "The ID of the EC2 Application Auto Scaling Group Security Group."
  value       = aws_security_group.app.id
}

output "db_security_group_id" {
  description = "The ID of the RDS MySQL Database Security Group."
  value       = aws_security_group.db.id
}
