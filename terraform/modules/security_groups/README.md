# 🛡️ AWS Security Groups Terraform Module

This module provisions strict, source-referenced firewall rules for the application tier:

- **ALB Security Group**: Accepts HTTP (80) & HTTPS (443) from anywhere (`0.0.0.0/0`).
- **EC2 App Security Group**: Accepts HTTP (5000) **ONLY** from the ALB Security Group ID.
- **RDS DB Security Group**: Accepts MySQL (3306) **ONLY** from the EC2 App Security Group ID.
