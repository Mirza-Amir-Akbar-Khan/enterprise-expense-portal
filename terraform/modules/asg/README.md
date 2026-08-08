# 🚀 AWS EC2 Auto Scaling Group (ASG) Terraform Module

This module provisions an EC2 Auto Scaling Group and Launch Template across Multi-AZ Private Application Subnets:

- **EC2 Launch Template**: Configures Amazon Linux 2023, instance profile, security groups, and user data startup script.
- **IAM Instance Profile**: Grants SSM Session Manager access, ECR image pull permissions, and CodeDeploy Agent access.
- **Auto Scaling Group**: Spans private subnets across 2 AZs, attached to the ALB Target Group with ELB health checks.
- **User Data Script**: Installs Docker and AWS CodeDeploy Agent automatically on instance launch.
