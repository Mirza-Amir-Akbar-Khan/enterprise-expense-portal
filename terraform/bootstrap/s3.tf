# Random suffix to guarantee globally unique S3 bucket names
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# ==============================================================================
# 1. TERRAFORM REMOTE STATE S3 BUCKET
# ==============================================================================
resource "aws_s3_bucket" "tf_state" {
  bucket        = "${var.project_name}-tf-state-${random_id.bucket_suffix.hex}"
  force_destroy = false

  tags = {
    Name        = "${var.project_name}-tf-state"
    Description = "Terraform remote state storage for bootstrap and environments"
  }
}

# Enable bucket versioning for state recovery and version tracking
resource "aws_s3_bucket_versioning" "tf_state" {
  bucket = aws_s3_bucket.tf_state.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Enable default server-side encryption (AES256)
resource "aws_s3_bucket_server_side_encryption_configuration" "tf_state" {
  bucket = aws_s3_bucket.tf_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Block all public access to the state bucket
resource "aws_s3_bucket_public_access_block" "tf_state" {
  bucket = aws_s3_bucket.tf_state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}


# ==============================================================================
# 2. AWS CODEPIPELINE ARTIFACTS S3 BUCKET
# ==============================================================================
resource "aws_s3_bucket" "codepipeline_artifacts" {
  bucket        = "${var.project_name}-pipeline-artifacts-${random_id.bucket_suffix.hex}"
  force_destroy = true

  tags = {
    Name        = "${var.project_name}-pipeline-artifacts"
    Description = "Artifact store for AWS CodePipeline stages and build outputs"
  }
}

# Enable default server-side encryption (AES256)
resource "aws_s3_bucket_server_side_encryption_configuration" "codepipeline_artifacts" {
  bucket = aws_s3_bucket.codepipeline_artifacts.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Block all public access to the artifacts bucket
resource "aws_s3_bucket_public_access_block" "codepipeline_artifacts" {
  bucket = aws_s3_bucket.codepipeline_artifacts.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Lifecycle policy: expire old build artifacts after 30 days to optimize storage cost
resource "aws_s3_bucket_lifecycle_configuration" "codepipeline_artifacts" {
  bucket = aws_s3_bucket.codepipeline_artifacts.id

  rule {
    id     = "expire-old-pipeline-artifacts"
    status = "Enabled"

    filter {}

    expiration {
      days = 30
    }
  }
}
