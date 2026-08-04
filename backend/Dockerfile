# Use a lightweight Node.js LTS image
FROM public.ecr.aws/docker/library/node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package files first to leverage Docker layer caching
COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev || npm install --omit=dev

# Copy the rest of the backend application code
COPY . .

# Expose port 5000 for the Express server
EXPOSE 5000

# The command to start the Express server (server file is located at src/server.js)
CMD ["node", "src/server.js"]

