# =============================
# Stage 1: Build Vite frontend
# =============================
FROM node:20-alpine AS vite-builder

WORKDIR /app/web

# Install dependencies
COPY web/ .
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile
RUN npm run build

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

# Seed initial data
RUN python  -m scripts.seed


# Expose the port FastAPI will run on
EXPOSE 8080

# Start FastAPI
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
