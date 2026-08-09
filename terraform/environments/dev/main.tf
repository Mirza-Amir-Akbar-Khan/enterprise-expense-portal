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

  project_name            = var.project_name
  environment             = var.environment
  codestar_connection_arn = "arn:aws:codeconnections:us-west-2:395063533284:connection/a69b0212-a1c5-4916-bf71-0df4812ccc96"
  github_repository       = "awabamjad1/internship-program-2026"
  github_branch           = "feature/enterprise-expense-terraform-amir"
  target_tf_dir           = "terraform/environments/dev"
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
# 5. EC2 AUTO SCALING GROUP MODULE
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
# 6. ECR REPOSITORY MODULE FOR BACKEND DOCKER IMAGES
# ==============================================================================
module "ecr" {
  source = "../../modules/ecr"

  project_name = var.project_name
  environment  = var.environment
}

# ==============================================================================
# 7. AWS COGNITO AUTHENTICATION MODULE
# ==============================================================================
module "cognito" {
  source = "../../modules/cognito"

  project_name = var.project_name
  environment  = var.environment
}

# ==============================================================================
# 8. AWS SSM PARAMETER STORE CONFIGURATION MODULE
# ==============================================================================
module "ssm_parameters" {
  source = "../../modules/ssm_parameters"

  project_name         = var.project_name
  environment          = var.environment
  cognito_user_pool_id = module.cognito.user_pool_id
  cognito_client_id    = module.cognito.user_pool_client_id
  alb_dns_name         = module.alb.alb_dns_name
  ecr_repository_url   = module.ecr.repository_url
}








