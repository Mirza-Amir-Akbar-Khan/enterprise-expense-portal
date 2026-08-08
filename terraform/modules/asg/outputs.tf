output "asg_id" {
  description = "The ID of the Auto Scaling Group."
  value       = aws_autoscaling_group.app.id
}

output "asg_name" {
  description = "The name of the Auto Scaling Group (needed by CodeDeploy)."
  value       = aws_autoscaling_group.app.name
}

output "asg_arn" {
  description = "The ARN of the Auto Scaling Group."
  value       = aws_autoscaling_group.app.arn
}

output "launch_template_id" {
  description = "The ID of the EC2 Launch Template."
  value       = aws_launch_template.app.id
}

output "ec2_iam_role_arn" {
  description = "The ARN of the EC2 IAM Role."
  value       = aws_iam_role.ec2_role.arn
}

output "ec2_instance_profile_name" {
  description = "The name of the EC2 IAM Instance Profile."
  value       = aws_iam_instance_profile.ec2_profile.name
}
