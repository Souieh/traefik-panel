# Traefik Proxy Manager (TPM)

**Traefik Proxy Manager (TPM)** is a comprehensive dashboard and management tool for Traefik. It combines a modern web interface with a powerful backend to simplify the management of Traefik configurations, routes, and services.

## 🚀 Features

- **Unified Dashboard**: Manage your Traefik proxy settings from a single, user-friendly web interface.
- **Dynamic Configuration**: Real-time updates to Traefik configurations.
- **Visual Management**: Easily visualize entrypoints, routers, and services.
- **Docker Integrated**: Built to run seamlessly alongside your existing Docker infrastructure.

## 🛠️ Architecture

The project consists of two main components bundled into a single container:

1. **Frontend**: A Vite-based web application (located in `/web`).
2. **Backend**: A FastAPI Python application (located in `/api`) that serves the API and the static frontend files.

## 📦 Getting Started

### Prerequisites

- Docker
- Docker Compose (optional, but recommended)

### Installation

**Build and run all at once (Panel + Traefik containers)**

1. Setup envirments :

```bash
        cp .env.example .env
```

2. Build and run

```bash
     docker compose up -d
```

3. The dashboard will be available at `http://localhost:5000`.

## 🔧 Development

### Backend (FastAPI)

1. Install dependencies

```bash
    cd api && make setup
```

2. Setup envirment variables:

```bash
    cp .env.example .env
```

3.  Run the api

```bash
    make run
```

### Frontend (Vite)

```bash
cd web
npm install
npm run dev
```

## 📄 License

This project is licensed under the MIT License.
