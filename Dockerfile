# Stage 1: Build the app with Bun
FROM oven/bun:1.1.20 AS build
WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source and build
COPY . .
# Ensure production builds use production mode
ENV NODE_ENV=production
RUN bun run build

# Stage 2: Serve with Nginx
FROM nginx:alpine AS runner

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Nginx config for SPA routing
RUN printf "server {\n  listen 80;\n  server_name _;\n  root /usr/share/nginx/html;\n  index index.html;\n  location / {\n    try_files $uri $uri/ /index.html;\n  }\n}\n" > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD [\"nginx\", \"-g\", \"daemon off;\"]