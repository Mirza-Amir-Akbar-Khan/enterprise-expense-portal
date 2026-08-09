# ==============================================================================
# ECR REPOSITORY FOR BACKEND DOCKER IMAGES
# ==============================================================================
resource "aws_ecr_repository" "backend" {
  name                 = "${var.project_name}-backend-${var.environment}"
  image_tag_mutability = "MUTABLE"
  force_destroy        = true

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name        = "${var.project_name}-backend-${var.environment}-ecr"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# Lifecycle Policy: Keep only the latest 10 image builds to prevent storage bloat
resource "aws_ecr_lifecycle_policy" "backend_lifecycle" {
  repository = aws_ecr_repository.backend.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 10
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}
