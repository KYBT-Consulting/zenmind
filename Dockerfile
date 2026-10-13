# ZenMind - Multi-Stage Production Web Container
# Stage 1: Build static web application
FROM node:26-alpine AS builder

WORKDIR /app

# Cache package dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy full application source and compile production assets
COPY . .
RUN npm run build

# Stage 2: Production lightweight static web server
FROM nginx:alpine AS runner

LABEL maintainer="KYBT Consulting <support@kybtconsulting.com>"
LABEL org.opencontainers.image.title="ZenMind"
LABEL org.opencontainers.image.description="Open-source EdrawMind alternative for cross-platform mind mapping"
LABEL org.opencontainers.image.url="https://github.com/KYBT-Consulting/zenmind"
LABEL org.opencontainers.image.vendor="KYBT Consulting"
LABEL org.opencontainers.image.licenses="MIT"

# Copy custom Nginx configuration with SPA routing and compression
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
