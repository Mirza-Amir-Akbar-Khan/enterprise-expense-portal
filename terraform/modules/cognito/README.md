# 🔐 AWS Cognito Authentication Terraform Module

This module provisions an AWS Cognito User Pool and App Client for user authentication:

- **Cognito User Pool**: Email-based sign-in with custom `custom:role` attribute for `Employee`, `Manager`, and `Admin` roles.
- **Web App Client**: Public client (`generate_secret = false`) optimized for browser JS SDKs (`amazon-cognito-identity-js`).
