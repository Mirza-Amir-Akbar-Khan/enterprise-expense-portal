#!/bin/bash
set -e

echo "Starting deployment script..."

# Search locations for imageDetail.json
JSON_PATH=""

if [ -f "$(pwd)/imageDetail.json" ]; then
  JSON_PATH="$(pwd)/imageDetail.json"
elif [ -f "/home/ec2-user/app/imageDetail.json" ]; then
  JSON_PATH="/home/ec2-user/app/imageDetail.json"
elif [ -f "/home/ec2-user/backend/imageDetail.json" ]; then
  JSON_PATH="/home/ec2-user/backend/imageDetail.json"
elif [ -f "/home/ec2-user/app/backend/imageDetail.json" ]; then
  JSON_PATH="/home/ec2-user/app/backend/imageDetail.json"
else
  # Fallback search if path varies
  JSON_PATH=$(find /opt/codedeploy-agent/deployment-root/ /home/ec2-user/ -name "imageDetail.json" 2>/dev/null | head -n 1 || true)
fi

if [ -z "$JSON_PATH" ] || [ ! -f "$JSON_PATH" ]; then
  echo "Error: imageDetail.json could not be found anywhere on host!"
  exit 1
fi

echo "Found imageDetail.json at: $JSON_PATH"

# 1. Read ImageURI from imageDetail.json
IMAGE_URI=$(grep -o '"ImageURI":"[^"]*' "$JSON_PATH" | grep -o '[^"]*$')

if [ -z "$IMAGE_URI" ]; then
  echo "Error: Failed to parse ImageURI from $JSON_PATH"
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

# 5. Fetch environment variables from AWS SSM Parameter Store
echo "Fetching live infrastructure configuration from AWS SSM Parameter Store..."
DB_HOST=$(aws ssm get-parameter --name "/enterprise-expense-app/dev/db_host" --query "Parameter.Value" --output text --region $AWS_REGION 2>/dev/null || echo "")
DB_NAME=$(aws ssm get-parameter --name "/enterprise-expense-app/dev/db_name" --query "Parameter.Value" --output text --region $AWS_REGION 2>/dev/null || echo "enterprise_expense_db")
DB_USER=$(aws ssm get-parameter --name "/enterprise-expense-app/dev/db_user" --query "Parameter.Value" --output text --region $AWS_REGION 2>/dev/null || echo "admin_user")
DB_PASS=$(aws ssm get-parameter --name "/enterprise-expense-app/dev/db_password" --with-decryption --query "Parameter.Value" --output text --region $AWS_REGION 2>/dev/null || echo "")
USER_POOL_ID=$(aws ssm get-parameter --name "/enterprise-expense-app/dev/cognito_user_pool_id" --query "Parameter.Value" --output text --region $AWS_REGION 2>/dev/null || echo "")
CLIENT_ID=$(aws ssm get-parameter --name "/enterprise-expense-app/dev/cognito_client_id" --query "Parameter.Value" --output text --region $AWS_REGION 2>/dev/null || echo "")

echo "DB Host: $DB_HOST"
echo "DB Name: $DB_NAME"
echo "DB User: $DB_USER"
echo "Cognito Pool ID: $USER_POOL_ID"

cat <<EOF > /home/ec2-user/backend.env
NODE_ENV=production
PORT=5000
AWS_REGION=$AWS_REGION
DB_HOST=$DB_HOST
DB_PORT=3306
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASS
COGNITO_USER_POOL_ID=$USER_POOL_ID
COGNITO_CLIENT_ID=$CLIENT_ID
EOF

echo "Generated /home/ec2-user/backend.env successfully."

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

# 8. Initialize Database Tables & Seed Data (if first run)
echo "Initializing database schema & seed data on Aurora MySQL..."
sleep 5
docker exec backend-app npm run db:init || echo "Notice: Database init non-zero exit, container remaining active."

echo "Deployment completed successfully!"
