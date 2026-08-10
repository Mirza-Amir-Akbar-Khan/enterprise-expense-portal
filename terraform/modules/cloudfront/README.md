# 🌐 AWS CloudFront CDN Terraform Module

This module provisions an AWS CloudFront Content Delivery Network (CDN) with dual origins:

- **Origin 1 (S3 Frontend Bucket)**: Delivers static React SPA assets with Origin Access Control (OAC) and SPA 403/404 routing redirects to `/index.html`.
- **Origin 2 (ALB Backend)**: Forwards `/api/*` REST API traffic directly to the Application Load Balancer with zero caching and CORS elimination.
- **Route 53 Ready**: Exports `cloudfront_hosted_zone_id` and accepts optional `custom_domain_name` and `acm_certificate_arn` for future Route 53 domain attachment.
