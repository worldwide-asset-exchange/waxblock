# Stage 1: Build the application
FROM node:22.22.0-alpine AS builder

# Set working directory
WORKDIR /app

# Install from the shared workspace lockfile.
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY apps/api/package.json ./apps/api/package.json

# Install dependencies
RUN npm ci --workspace=apps/web --include-workspace-root

# Copy source code
COPY apps/web ./apps/web

# Build the application
RUN npm run build --workspace=apps/web

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy built files from builder stage
COPY --from=builder /app/apps/web/build /usr/share/nginx/html

# Copy Nginx configuration
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
