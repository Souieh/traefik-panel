# Traefik Proxy Manager (TPM)

**Traefik Proxy Manager (TPM)** is a comprehensive dashboard and management tool for Traefik. It combines a modern web interface with a powerful backend to simplify the management of Traefik configurations, routes, and services.

## 🚀 Features

- **Unified Dashboard**: Manage your Traefik proxy settings from a single, user-friendly web interface.
- **Dynamic Configuration**: Real-time updates to Traefik configurations.
- **Visual Management**: Easily visualize entrypoints, routers, and services.
- **Docker Integrated**: Built to run seamlessly alongside your existing Docker infrastructure.

## 🛠️ Architecture

The project consists of three main components bundled into a single container:

1.  **Frontend**: A Vite-based web application (located in `/web`).
2.  **Backend**: A FastAPI Python application (located in `/api`).
3.  **Proxy**: Nginx serves the frontend static files and reverse-proxies API requests to the backend.

## 📦 Getting Started

### Prerequisites

- Docker
- Docker Compose (optional, but recommended)

### Installation

1.  **Build the Image**

    ```bash
    docker build -t traefik-panel .
    ```

2.  **Run the Container**

    ```bash
    docker run -d -p 80:80 --name tpm traefik-panel
    ```

    The dashboard will be available at `http://localhost`.

## 🔧 Development

To contribute or modify the project, you can run the services locally.

### Backend (FastAPI)

```bash
cd api
pip install -r requirements.txt
uvicorn api.main:app --reload --port 8000
```

### Frontend (Vite)

```bash
cd web
npm install
npm run dev
```

## 📄 License

This project is licensed under the MIT License.
