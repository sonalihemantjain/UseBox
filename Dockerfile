# =========================
# Build Stage
# =========================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# -------------------------
# VITE BUILD ARGS
# -------------------------
ARG VITE_API_URL
ARG VITE_GOOGLE_CLIENT_ID

# Make them available during build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

# Build frontend
RUN npm run build


# =========================
# Production Stage
# =========================
FROM node:20-alpine AS production

WORKDIR /app

# Copy build output
COPY --from=builder /app/dist ./dist

# Install static server
RUN npm install -g http-server

EXPOSE 80

CMD ["http-server", "dist", "-p", "80"]
