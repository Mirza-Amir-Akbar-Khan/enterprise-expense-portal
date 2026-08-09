# ==============================================================================
# 1. AWS COGNITO USER POOL
# ==============================================================================
resource "aws_cognito_user_pool" "this" {
  name                     = "${var.project_name}-${var.environment}-user-pool"
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length                   = 8
    require_lowercase                = true
    require_uppercase                = true
    require_numbers                  = true
    require_symbols                  = false
    temporary_password_validity_days = 7
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  # Custom Schema Attribute for User Role (Employee, Manager, Admin)
  schema {
    attribute_data_type      = "String"
    developer_only_attribute = false
    mutable                  = true
    name                     = "role"
    required                 = false

    string_attribute_constraints {
      min_length = 1
      max_length = 50
    }
  }

  schema {
    attribute_data_type      = "String"
    developer_only_attribute = false
    mutable                  = true
    name                     = "name"
    required                 = false

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-user-pool"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# ==============================================================================
# 2. AWS COGNITO USER POOL WEB APP CLIENT (SPA React Client)
# ==============================================================================
resource "aws_cognito_user_pool_client" "this" {
  name            = "${var.project_name}-${var.environment}-web-client"
  user_pool_id    = aws_cognito_user_pool.this.id
  generate_secret = false

  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_ADMIN_USER_PASSWORD_AUTH"
  ]

  prevent_user_existence_errors = "ENABLED"
}
