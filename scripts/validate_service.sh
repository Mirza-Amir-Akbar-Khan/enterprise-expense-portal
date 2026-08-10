#!/bin/bash
set -e

echo "Running ValidateService health check on backend container..."

# Poll container health endpoint up to 10 times (30 seconds max)
for i in {1..10}; do
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health || echo "000")
  if [ "$HTTP_STATUS" -eq 200 ]; then
    echo "✅ Backend container is healthy and responding on port 5000!"
    exit 0
  fi
  echo "Waiting for backend container to become ready (Attempt $i/10)..."
  sleep 3
done

echo "❌ Error: Backend container failed health check within 30 seconds."
exit 1
