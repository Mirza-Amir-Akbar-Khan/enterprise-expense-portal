output "alb_arn" {
  description = "The ARN of the Application Load Balancer."
  value       = aws_lb.this.arn
}

output "alb_dns_name" {
  description = "The public DNS URL of the Application Load Balancer."
  value       = aws_lb.this.dns_name
}

output "target_group_arn" {
  description = "The ARN of the Primary (Blue) ALB Target Group."
  value       = aws_lb_target_group.app.arn
}

output "target_group_name" {
  description = "The Name of the Primary (Blue) ALB Target Group."
  value       = aws_lb_target_group.app.name
}

output "target_group_green_arn" {
  description = "The ARN of the Secondary (Green) ALB Target Group."
  value       = aws_lb_target_group.app_green.arn
}

output "target_group_green_name" {
  description = "The Name of the Secondary (Green) ALB Target Group."
  value       = aws_lb_target_group.app_green.name
}

output "listener_arn" {
  description = "The ARN of the ALB HTTP Listener."
  value       = aws_lb_listener.http.arn
}
