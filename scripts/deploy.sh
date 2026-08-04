#!/bin/bash
set -e

# Change to deployment archive directory where CodeBuild artifacts are unpacked
DEPLOY_DIR=$(pwd)
echo "Current directory: $DEPLOY_DIR"

# 1. Read ImageURI from imageDetail.json
if [ -f "$DEPLOY_DIR/imageDetail.json" ]; then
  IMAGE_URI=$(grep -o '"ImageURI":"[^"]*' "$DEPLOY_DIR/imageDetail.json" | grep -o '[^"]*$')
else
  echo "Error: imageDetail.json not found in $DEPLOY_DIR"
  exit 1
fi

echo "Target deployment image: $IMAGE_URI"

# 2. Extract AWS Region & Account ID from IMAGE_URI
AWS_ACCOUNT_ID=$(echo $IMAGE_URI | cut -d'.' -f1)
AWS_REGION=$(echo $IMAGE_URI | cut -d'.' -f4)

# Default to us-west-2 if region extraction fails
AWS_REGION=${AWS_REGION:-us-west-2}

# 3. Log in to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# 4. Pull the new Docker Image
echo "Pulling latest Docker image from ECR..."
docker pull $IMAGE_URI

# 5. Fetch environment variables from SSM Parameter Store (if configured)
if aws ssm get-parameter --name "/prod/backend/env" --with-decryption --region $AWS_REGION > /tmp/ssm_env_raw.json 2>/dev/null; then
  echo "Fetching environment variables from AWS SSM Parameter Store..."
  aws ssm get-parameter --name "/prod/backend/env" --with-decryption --query "Parameter.Value" --output text --region $AWS_REGION > /home/ec2-user/backend.env
elif [ -f "/home/ec2-user/backend.env" ]; then
  echo "Using existing /home/ec2-user/backend.env file on host..."
else
  echo "Warning: No SSM parameter or /home/ec2-user/backend.env found. Creating placeholder..."
  touch /home/ec2-user/backend.env
fi

# 6. Stop & Remove existing container
echo "Stopping existing backend container..."
docker stop backend-app 2>/dev/null || true
docker rm backend-app 2>/dev/null || true

# 7. Launch new container
echo "Starting new backend container on port 5000..."
docker run -d \
  --name backend-app \
  --restart always \
  -p 5000:5000 \
  --env-file /home/ec2-user/backend.env \
  $IMAGE_URI

echo "Deployment completed successfully!"
