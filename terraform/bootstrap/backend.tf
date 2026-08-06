# S3 Remote State Backend with Native S3 Locking (Terraform 1.10+)
terraform {
  backend "s3" {
    bucket       = "enterprise-expense-app-tf-state-21ac1bae"
    key          = "bootstrap/terraform.tfstate"
    region       = "us-west-2"
    use_lockfile = true
  }
}
