output "cloudfront_distribution_id" {
  description = "The ID of the AWS CloudFront Distribution."
  value       = aws_cloudfront_distribution.this.id
}

output "cloudfront_domain_name" {
  description = "The domain name of the CloudFront distribution (e.g. d111111abcdef8.cloudfront.net)."
  value       = aws_cloudfront_distribution.this.domain_name
}

output "cloudfront_url" {
  description = "The full HTTPS URL of the CloudFront distribution."
  value       = "https://${aws_cloudfront_distribution.this.domain_name}"
}

output "cloudfront_hosted_zone_id" {
  description = "The Route 53 Hosted Zone ID of the CloudFront distribution (for Alias A-records)."
  value       = aws_cloudfront_distribution.this.hosted_zone_id
}
