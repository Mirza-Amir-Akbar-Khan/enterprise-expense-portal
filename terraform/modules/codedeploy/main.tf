# ==============================================================================
# 1. AWS CODEDEPLOY APPLICATION
# ==============================================================================
resource "aws_codedeploy_app" "this" {
  name             = "${var.project_name}-${var.environment}-backend-app"
  compute_platform = "Server"

  tags = {
    Name        = "${var.project_name}-${var.environment}-codedeploy-app"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# ==============================================================================
# 2. IAM SERVICE ROLE FOR CODEDEPLOY
# ==============================================================================
resource "aws_iam_role" "codedeploy_role" {
  name = "${var.project_name}-${var.environment}-codedeploy-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "codedeploy.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-${var.environment}-codedeploy-role"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

resource "aws_iam_role_policy_attachment" "codedeploy_service" {
  role       = aws_iam_role.codedeploy_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSCodeDeployRole"
}

# ==============================================================================
# 3. CODEDEPLOY DEPLOYMENT GROUP (WITH ALB TRAFFIC CONTROL)
# ==============================================================================
resource "aws_codedeploy_deployment_group" "this" {
  app_name              = aws_codedeploy_app.this.name
  deployment_group_name = "${var.project_name}-${var.environment}-backend-dg"
  service_role_arn      = aws_iam_role.codedeploy_role.arn

  autoscaling_groups = [var.asg_name]

  deployment_config_name = "CodeDeployDefault.AllAtOnce"

  deployment_style {
    deployment_option = "WITH_TRAFFIC_CONTROL"
    deployment_type   = "IN_PLACE"
  }

  load_balancer_info {
    target_group_info {
      name = var.target_group_name
    }
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-backend-dg"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}
