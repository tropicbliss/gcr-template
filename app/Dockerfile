# Use official Node.js image as the base
FROM node:18-slim

# Create and set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
# Use ci instead of install for more reliable builds
RUN npm ci

# Copy the rest of the application
COPY . .

# Build the application if needed (uncomment if you have a build step)
RUN npm run build

# Remove development dependencies to reduce image size
RUN npm prune --production

# Remove source code and TypeScript files as they're no longer needed
RUN rm -rf src/ tsconfig.json Dockerfile

# Start the compiled application
CMD [ "node", "dist/index.js" ]