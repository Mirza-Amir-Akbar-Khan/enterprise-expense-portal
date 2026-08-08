# 🌐 AWS Application Load Balancer (ALB) Terraform Module

This module provisions an internet-facing Application Load Balancer (ALB) across Multi-AZ Public Subnets:

- **AWS ALB**: Listens on Port 80 and forwards traffic to the target group.
- **Target Group**: Target type `instance` (Port 5000) with HTTP `/api/health` health checks.
- **ALB Listener**: HTTP Listener forwarding traffic to the backend instances.
