variable "aws_region" {
  description = "The AWS region to deploy bootstrap resources into."
  type        = string
  default     = "us-west-2"
}

variable "project_name" {
  description = "The name of the project used for tagging and resource naming."
  type        = string
  default     = "enterprise-expense-app"
}

variable "environment" {
  description = "Environment name for bootstrap infrastructure."
  type        = string
  default     = "bootstrap"
}

variable "github_repository" {
  description = "GitHub repository full path (owner/repo_name)."
  type        = string
  default     = "awabamjad1/internship-program-2026"
}

variable "github_branch" {
  description = "GitHub branch to trigger CI/CD pipeline runs."
  type        = string
  default     = "feature/enterprise-expense-terraform-amir"
}

variable "codestar_connection_arn" {
  description = "ARN of the existing AWS CodeStar / CodeConnections GitHub Connection."
  type        = string
  default     = "arn:aws:codeconnections:us-west-2:395063533284:connection/a69b0212-a1c5-4916-bf71-0df4812ccc96"
}
