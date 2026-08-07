# ⚙️ AWS CI/CD Pipeline Terraform Module

This module provisions a self-mutating AWS CodePipeline and CodeBuild project connected to GitHub via AWS CodeStar Connections.

- **AWS CodePipeline**: Listens for GitHub pushes and triggers automated infrastructure updates.
- **AWS CodeBuild**: Executes Terraform operations (`init`, `plan`, `apply`) inside an isolated build container.
- **S3 Artifact Storage**: Stores build artifacts securely with 30-day lifecycle auto-expiration.
- **IAM Service Roles**: CodePipeline & CodeBuild execution roles.
