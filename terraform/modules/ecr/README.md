# 📦 AWS Elastic Container Registry (ECR) Terraform Module

This module provisions an AWS ECR repository for storing Backend Docker container images:

- **Image Vulnerability Scanning**: `scan_on_push = true` automatically scans images for security CVEs.
- **Lifecycle Policy**: Auto-expires older images to retain only the latest 10 builds.
