terraform {
  required_version = ">= 1.10.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

data "aws_caller_identity" "current" {}

# ==============================================================================
# 1. CI/CD SELF-MUTATING PIPELINE MODULE
# ==============================================================================
module "cicd" {
  source = "../../modules/cicd"

  project_name               = var.project_name
  environment                = var.environment
  codestar_connection_arn    = "arn:aws:codeconnections:us-east-1:395063533284:connection/11fa412e-d79a-433b-8801-748f87431279"
  github_repository          = "Mirza-Amir-Akbar-Khan/enterprise-expense-portal"
  github_branch              = "main"
  target_tf_dir              = "terraform/environments/dev"
  cloudfront_distribution_id = module.cloudfront.cloudfront_distribution_id
}


# ==============================================================================
# 2. MULTI-AZ VPC NETWORK MODULE
# ==============================================================================
module "vpc" {
  source = "../../modules/vpc"

  project_name             = var.project_name
  environment              = var.environment
  vpc_cidr                 = "10.0.0.0/16"
  availability_zones       = ["us-west-2a", "us-west-2b"]
  public_subnet_cidrs      = ["10.0.1.0/24", "10.0.2.0/24"]
  private_app_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24"]
  private_db_subnet_cidrs  = ["10.0.21.0/24", "10.0.22.0/24"]
}

# ==============================================================================
# 3. SECURITY GROUPS FIREWALL CHAIN MODULE
# ==============================================================================
module "security_groups" {
  source = "../../modules/security_groups"

  project_name = var.project_name
  environment  = var.environment
  vpc_id       = module.vpc.vpc_id
  app_port     = 5000
}

# ==============================================================================
# 4. APPLICATION LOAD BALANCER MODULE
# ==============================================================================
module "alb" {
  source = "../../modules/alb"

  project_name          = var.project_name
  environment           = var.environment
  vpc_id                = module.vpc.vpc_id
  public_subnet_ids     = module.vpc.public_subnet_ids
  alb_security_group_id = module.security_groups.alb_security_group_id
  app_port              = 5000
  health_check_path     = "/api/health"
}

# ==============================================================================
# 5. AWS CLOUDFRONT CDN MODULE (S3 FRONTEND + ALB API)
# ==============================================================================
module "cloudfront" {
  source = "../../modules/cloudfront"

  project_name                    = var.project_name
  environment                     = var.environment
  frontend_s3_bucket_domain_name = module.cicd.frontend_hosting_bucket_regional_domain_name
  frontend_s3_bucket_id          = module.cicd.frontend_hosting_bucket_id
  frontend_s3_bucket_arn         = module.cicd.frontend_hosting_bucket_arn
  alb_dns_name                    = module.alb.alb_dns_name
}

# ==============================================================================
# 6. EC2 AUTO SCALING GROUP MODULE
# ==============================================================================
module "asg" {
  source = "../../modules/asg"

  project_name           = var.project_name
  environment            = var.environment
  vpc_id                 = module.vpc.vpc_id
  private_app_subnet_ids = module.vpc.private_app_subnet_ids
  app_security_group_id  = module.security_groups.app_security_group_id
  target_group_arn       = module.alb.target_group_arn
  instance_type          = "t3.micro"
  min_size               = 1
  max_size               = 3
  desired_capacity       = 2
}

# ==============================================================================
# 7. ECR REPOSITORY MODULE FOR BACKEND DOCKER IMAGES
# ==============================================================================
module "ecr" {
  source = "../../modules/ecr"

  project_name = var.project_name
  environment  = var.environment
}

# ==============================================================================
# 8. AWS COGNITO AUTHENTICATION MODULE
# ==============================================================================
module "cognito" {
  source = "../../modules/cognito"

  project_name = var.project_name
  environment  = var.environment
}

# ==============================================================================
# 9. AWS SSM PARAMETER STORE CONFIGURATION MODULE
# ==============================================================================
module "ssm_parameters" {
  source = "../../modules/ssm_parameters"

  project_name         = var.project_name
  environment          = var.environment
  cognito_user_pool_id = module.cognito.user_pool_id
  cognito_client_id    = module.cognito.user_pool_client_id
  alb_dns_name         = module.cloudfront.cloudfront_domain_name
  ecr_repository_url   = module.ecr.repository_url
}

# ==============================================================================
# 10. AWS CODEDEPLOY BLUE/GREEN DEPLOYMENT MODULE
# ==============================================================================
module "codedeploy" {
  source = "../../modules/codedeploy"

  project_name            = var.project_name
  environment             = var.environment
  asg_name                = module.asg.asg_name
  target_group_name       = module.alb.target_group_name
  target_group_green_name = module.alb.target_group_green_name
  listener_arn            = module.alb.listener_arn
}

# ==============================================================================
# 11. AWS RDS AURORA MYSQL CLUSTER MODULE
# ==============================================================================
module "rds" {
  source = "../../modules/rds"

  project_name          = var.project_name
  environment           = var.environment
  private_db_subnet_ids = module.vpc.private_db_subnet_ids
  db_security_group_id  = module.security_groups.db_security_group_id
  instance_class        = "db.t4g.medium"
  instance_count        = 2
  db_name               = "enterprise_expense_db"
  master_username       = "admin_user"
}












