output "codedeploy_app_name" {
  description = "The name of the AWS CodeDeploy Application."
  value       = aws_codedeploy_app.this.name
}

output "deployment_group_name" {
  description = "The name of the AWS CodeDeploy Deployment Group."
  value       = aws_codedeploy_deployment_group.this.deployment_group_name
}

output "codedeploy_role_arn" {
  description = "The ARN of the CodeDeploy IAM Service Role."
  value       = aws_iam_role.codedeploy_role.arn
}
