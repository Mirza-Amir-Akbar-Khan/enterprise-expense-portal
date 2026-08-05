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

# 5. Fetch environment variables from SSM Parameter Store & AWS Secrets Manager
SSM_PARAM_NAME="/enterprise-expense/dev/backend/config"
SECRET_NAME="enterprise-expense/dev/backend/secrets"

echo "Fetching configuration from AWS SSM Parameter Store ($SSM_PARAM_NAME)..."
if aws ssm get-parameter --name "$SSM_PARAM_NAME" --region $AWS_REGION > /tmp/ssm_config_raw.json 2>/dev/null; then
  aws ssm get-parameter --name "$SSM_PARAM_NAME" --query "Parameter.Value" --output text --region $AWS_REGION > /home/ec2-user/backend.env
  echo "Successfully loaded SSM parameters into /home/ec2-user/backend.env"

  echo "Fetching secrets from AWS Secrets Manager ($SECRET_NAME)..."
  SECRET_VAL=$(aws secretsmanager get-secret-value --secret-id "$SECRET_NAME" --query "SecretString" --output text --region $AWS_REGION 2>/dev/null || true)

  if [ -n "$SECRET_VAL" ]; then
    DB_PASS=$(SECRET_VAL="$SECRET_VAL" python3 -c 'import json, os; print(json.loads(os.environ["SECRET_VAL"]).get("DB_PASSWORD", ""))' 2>/dev/null || echo "$SECRET_VAL" | grep -o '"DB_PASSWORD":"[^"]*' | grep -o '[^"]*$')
    if [ -n "$DB_PASS" ]; then
      echo "DB_PASSWORD=$DB_PASS" >> /home/ec2-user/backend.env
      echo "Successfully appended DB_PASSWORD from Secrets Manager"
    fi
  else
    echo "Warning: Could not fetch secret $SECRET_NAME from Secrets Manager"
  fi
elif [ -f "/home/ec2-user/backend.env" ]; then
  echo "Using existing /home/ec2-user/backend.env file on host..."
elif [ -f "/home/ec2-user/app/backend/.env" ]; then
  echo "Using /home/ec2-user/app/backend/.env file..."
  cp /home/ec2-user/app/backend/.env /home/ec2-user/backend.env
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
