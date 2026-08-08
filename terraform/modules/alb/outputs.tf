output "alb_arn" {
  description = "The Amazon Resource Name (ARN) of the Application Load Balancer."
  value       = aws_lb.this.arn
}

output "alb_dns_name" {
  description = "The public DNS name of the Application Load Balancer."
  value       = aws_lb.this.dns_name
}

output "alb_zone_id" {
  description = "The canonical hosted zone ID of the Application Load Balancer (for Route 53)."
  value       = aws_lb.this.zone_id
}

output "target_group_arn" {
  description = "The ARN of the ALB Target Group (for ASG and CodeDeploy)."
  value       = aws_lb_target_group.app.arn
}

output "target_group_name" {
  description = "The name of the ALB Target Group."
  value       = aws_lb_target_group.app.name
}
