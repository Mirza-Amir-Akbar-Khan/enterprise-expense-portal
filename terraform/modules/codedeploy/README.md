# 🚀 AWS CodeDeploy Terraform Module

This module provisions an AWS CodeDeploy Application and Blue/Green Deployment Group:

- **CodeDeploy Application**: Configured for `Server` compute platform.
- **Blue/Green Deployment Group**: Integrates with ALB Target Group and Auto Scaling Group to execute zero-downtime Blue/Green rolling deployments.
- **IAM Service Role**: `AWSCodeDeployRole` permission attachment.
