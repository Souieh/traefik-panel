# =============================
# Stage 1: Build Vite frontend
# =============================
FROM node:20-alpine AS vite-builder

WORKDIR /app/web

# Copy root package files if using workspace
COPY web/package*.json ./
COPY web/pnpm-*.yaml ./

RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile


COPY web/ .
RUN pnpm run build

# =============================
# Stage 2: Final FastAPI image
# =============================
FROM python:3.11-slim AS fastapi-prod

WORKDIR /app

# Install FastAPI dependencies
COPY api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy FastAPI source code
COPY api/ .

# Copy built Vite frontend
COPY --from=vite-builder /app/web/dist ./web

# Copy .env file
COPY .env .env


# Expose the port FastAPI will run on
EXPOSE 8080

# Start FastAPI
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
