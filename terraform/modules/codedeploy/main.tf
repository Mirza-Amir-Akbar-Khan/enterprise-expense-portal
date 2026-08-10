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

# Grant CodeDeploy IAM permissions to clone Auto Scaling Groups and manage EC2/ALB
resource "aws_iam_role_policy" "codedeploy_asg_policy" {
  name = "${var.project_name}-${var.environment}-codedeploy-asg-policy"
  role = aws_iam_role.codedeploy_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:Describe*",
          "autoscaling:Describe*",
          "autoscaling:CreateAutoScalingGroup",
          "autoscaling:UpdateAutoScalingGroup",
          "autoscaling:DeleteAutoScalingGroup",
          "autoscaling:PutScalingPolicy",
          "autoscaling:DeletePolicy",
          "autoscaling:BatchPutScheduledUpdateGroupAction",
          "autoscaling:BatchDeleteScheduledAction",
          "elasticloadbalancing:Describe*",
          "elasticloadbalancing:RegisterTargets",
          "elasticloadbalancing:DeregisterTargets",
          "elasticloadbalancing:ModifyListener",
          "elasticloadbalancing:ModifyRule"
        ]
        Resource = "*"
      }
    ]
  })
}

# ==============================================================================
# 3. CODEDEPLOY BLUE/GREEN DEPLOYMENT GROUP
# ==============================================================================
resource "aws_codedeploy_deployment_group" "this" {
  app_name              = aws_codedeploy_app.this.name
  deployment_group_name = "${var.project_name}-${var.environment}-backend-dg"
  service_role_arn      = aws_iam_role.codedeploy_role.arn

  autoscaling_groups = [var.asg_name]

  deployment_config_name = "CodeDeployDefault.AllAtOnce"

  deployment_style {
    deployment_option = "WITH_TRAFFIC_CONTROL"
    deployment_type   = "BLUE_GREEN"
  }

  blue_green_deployment_config {
    deployment_ready_option {
      action_on_timeout = "CONTINUE_DEPLOYMENT"
    }

    green_fleet_provisioning_option {
      action = "COPY_AUTO_SCALING_GROUP"
    }

    terminate_blue_instances_on_deployment_success {
      action                         = "TERMINATE"
      termination_wait_time_in_minutes = 5
    }
  }

  load_balancer_info {
    target_group_pair_info {
      prod_traffic_route {
        listener_arns = [var.listener_arn]
      }

      target_group {
        name = var.target_group_name
      }

      target_group {
        name = var.target_group_green_name
      }
    }
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-backend-dg"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}
