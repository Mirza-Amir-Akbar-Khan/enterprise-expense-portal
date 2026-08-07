# 🌐 AWS Multi-AZ VPC Terraform Module

This module provisions a production-grade, highly available Amazon Virtual Private Cloud (VPC) across 2 Availability Zones (AZs).

---

## 🏗️ Resources Provisioned

- **1x AWS VPC**: Enables DNS resolution and hostnames.
- **1x Internet Gateway (IGW)**: Direct internet connectivity for Public Subnets.
- **2x Public Subnets**: For Application Load Balancer (ALB) and NAT Gateway.
- **2x Private Application Subnets**: For EC2 Auto Scaling Group.
- **2x Private Database Subnets**: For RDS MySQL.
- **1x NAT Gateway + EIP**: Allows private subnets outbound internet access.
- **2x Route Tables & Associations**: Configures IGW for public routes & NAT Gateway for private routes.

---

## 📦 Usage Example

```hcl
module "vpc" {
  source = "../../modules/vpc"

  project_name        = "enterprise-expense-app"
  environment         = "dev"
  vpc_cidr            = "10.0.0.0/16"
  availability_zones  = ["us-west-2a", "us-west-2b"]
  public_subnet_cidrs = ["10.0.1.0/24", "10.0.2.0/24"]
  private_app_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24"]
  private_db_subnet_cidrs  = ["10.0.21.0/24", "10.0.22.0/24"]
}
```
