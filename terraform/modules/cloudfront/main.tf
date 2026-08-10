# AWS Managed Cache Policy IDs
locals {
  s3_origin_id  = "S3-${var.project_name}-${var.environment}-frontend"
  alb_origin_id = "ALB-${var.project_name}-${var.environment}-backend"

  # AWS Managed Policy IDs
  caching_disabled_policy_id = "41355a44-05b4-4790-822d-5812e1a3c657"
  caching_optimized_policy_id = "65832706-50d4-45d8-a701-4fac8035a17a"
  all_viewer_origin_request_policy_id = "216fd400-6690-4053-be57-af10ca0d70bb"
}

# ==============================================================================
# 1. ORIGIN ACCESS CONTROL (OAC) FOR S3
# ==============================================================================
resource "aws_cloudfront_origin_access_control" "s3_oac" {
  name                              = "${var.project_name}-${var.environment}-s3-oac"
  description                       = "Origin Access Control for Frontend S3 Bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# S3 Bucket Policy granting CloudFront OAC read access
resource "aws_s3_bucket_policy" "s3_oac_policy" {
  bucket = var.frontend_s3_bucket_id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowCloudFrontServicePrincipal"
        Effect    = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${var.frontend_s3_bucket_arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.this.arn
          }
        }
      }
    ]
  })
}

# ==============================================================================
# 2. CLOUDFRONT DISTRIBUTION (S3 FRONTEND + ALB BACKEND API)
# ==============================================================================
resource "aws_cloudfront_distribution" "this" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${var.project_name} ${var.environment} CloudFront CDN"
  default_root_object = "index.html"
  aliases             = var.custom_domain_name != "" ? [var.custom_domain_name] : []

  # Origin 1: Frontend S3 Bucket
  origin {
    domain_name              = var.frontend_s3_bucket_domain_name
    origin_id                = local.s3_origin_id
    origin_access_control_id = aws_cloudfront_origin_access_control.s3_oac.id
  }

  # Origin 2: Backend Application Load Balancer
  origin {
    domain_name = var.alb_dns_name
    origin_id   = local.alb_origin_id

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # Default Cache Behavior (Frontend React SPA from S3)
  default_cache_behavior {
    target_origin_id       = local.s3_origin_id
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    viewer_protocol_policy = "redirect-to-https"
    compress               = true
    cache_policy_id        = local.caching_optimized_policy_id
  }

  # Ordered Cache Behavior 1: Backend API Requests (/api/* -> ALB)
  ordered_cache_behavior {
    path_pattern             = "/api/*"
    target_origin_id         = local.alb_origin_id
    allowed_methods          = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods           = ["GET", "HEAD"]
    viewer_protocol_policy   = "redirect-to-https"
    compress                 = true
    cache_policy_id          = local.caching_disabled_policy_id
    origin_request_policy_id = local.all_viewer_origin_request_policy_id
  }

  # SPA Routing Fix: Redirect 403 & 404 to /index.html with HTTP 200
  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = var.acm_certificate_arn == "" ? true : false
    acm_certificate_arn            = var.acm_certificate_arn != "" ? var.acm_certificate_arn : null
    ssl_support_method             = var.acm_certificate_arn != "" ? "sni-only" : null
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-cloudfront"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}
