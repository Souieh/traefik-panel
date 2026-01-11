from typing import Annotated, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from core.models import User, TraefikRouter, TraefikService , TraefikMiddleware, TraefikCertResolver
from lib.dependencies import get_current_active_user
from lib.traefik.certificate_resolver_manager import CertificatesResolversManager
from lib.traefik.http_manager import HttpManager
from lib.traefik.tcp_udp_manager import TcpUdpManager
from lib.traefik.traefik_api import TraefikApiService

router = APIRouter(
    prefix="/traefik",
    tags=["traefik"],
    dependencies=[Depends(get_current_active_user)],
)

manager = HttpManager()
tcp_udp_manager = TcpUdpManager()
certificates_manager = CertificatesResolversManager()
api_service = TraefikApiService()

@router.get("/config")
async def get_config():
    return manager._read_config()

@router.get("/routers")
async def get_routers():
    return manager.get_routers()

@router.post("/routers/{name}")
async def update_router(name: str, router_data: TraefikRouter):
    manager.update_router(name, router_data.model_dump(exclude_none=True))
    return {"msg": "Router updated"}

@router.delete("/routers/{name}")
async def delete_router(name: str):
    if not manager.delete_router(name):
        raise HTTPException(status_code=404, detail="Router not found")
    return {"msg": "Router deleted"}

@router.get("/services")
async def get_services():
    return manager.get_services()

@router.post("/services/{name}")
async def update_service(name: str, service_data: TraefikService):
    manager.update_service(name, service_data.model_dump(exclude_none=True))
    return {"msg": "Service updated"}

@router.delete("/services/{name}")
async def delete_service(name: str):
    if not manager.delete_service(name):
        raise HTTPException(status_code=404, detail="Service not found")
    return {"msg": "Service deleted"}

@router.get("/middlewares")
async def get_middlewares():
    return manager.get_middlewares()

@router.post("/middlewares/{name}")
async def update_middleware(name: str, middleware_data: TraefikMiddleware):
    manager.update_middleware(name, middleware_data.model_dump(exclude_none=True))
    return {"msg": "Middleware updated"}

@router.delete("/middlewares/{name}")
async def delete_middleware(name: str):
    if not manager.delete_middleware(name):
        raise HTTPException(status_code=404, detail="Middleware not found")
    return {"msg": "Middleware deleted"}

@router.get("/certificates-resolvers")
async def get_certificate_resolvers():
    return certificates_manager.get_certificate_resolvers()

@router.post("/certificates-resolvers/{name}")
async def update_certificate_resolver(name: str, resolver_data: TraefikCertResolver):
    certificates_manager.update_certificate_resolver(name, resolver_data.model_dump(exclude_none=True))
    return {"msg": "Certificate Resolver updated"}

@router.delete("/certificates-resolvers/{name}")
async def delete_certificate_resolver(name: str):
    if not certificates_manager.delete_certificate_resolver(name):
        raise HTTPException(status_code=404, detail="Certificate Resolver not found")
    return {"msg": "Certificate Resolver deleted"}

# TCP/UDP Management

@router.get("/tcp/routers")
async def get_tcp_routers():
    return tcp_udp_manager.get_tcp_routers()

@router.post("/tcp/routers/{name}")
async def update_tcp_router(name: str, router_data: Dict[str, Any]):
    tcp_udp_manager.update_tcp_router(name, router_data)
    return {"msg": "TCP Router updated"}

@router.delete("/tcp/routers/{name}")
async def delete_tcp_router(name: str):
    if not tcp_udp_manager.delete_tcp_router(name):
        raise HTTPException(status_code=404, detail="TCP Router not found")
    return {"msg": "TCP Router deleted"}

@router.get("/tcp/services")
async def get_tcp_services():
    return tcp_udp_manager.get_tcp_services()

@router.post("/tcp/services/{name}")
async def update_tcp_service(name: str, service_data: Dict[str, Any]):
    tcp_udp_manager.update_tcp_service(name, service_data)
    return {"msg": "TCP Service updated"}

@router.delete("/tcp/services/{name}")
async def delete_tcp_service(name: str):
    if not tcp_udp_manager.delete_tcp_service(name):
        raise HTTPException(status_code=404, detail="TCP Service not found")
    return {"msg": "TCP Service deleted"}

@router.get("/udp/routers")
async def get_udp_routers():
    return tcp_udp_manager.get_udp_routers()

@router.post("/udp/routers/{name}")
async def update_udp_router(name: str, router_data: Dict[str, Any]):
    tcp_udp_manager.update_udp_router(name, router_data)
    return {"msg": "UDP Router updated"}

@router.delete("/udp/routers/{name}")
async def delete_udp_router(name: str):
    if not tcp_udp_manager.delete_udp_router(name):
        raise HTTPException(status_code=404, detail="UDP Router not found")
    return {"msg": "UDP Router deleted"}

@router.get("/udp/services")
async def get_udp_services():
    return tcp_udp_manager.get_udp_services()

@router.post("/udp/services/{name}")
async def update_udp_service(name: str, service_data: Dict[str, Any]):
    tcp_udp_manager.update_udp_service(name, service_data)
    return {"msg": "UDP Service updated"}

@router.delete("/udp/services/{name}")
async def delete_udp_service(name: str):
    if not tcp_udp_manager.delete_udp_service(name):
        raise HTTPException(status_code=404, detail="UDP Service not found")
    return {"msg": "UDP Service deleted"}

@router.get("/status/healthy")
async def get_status():
    return await api_service.get_status()

@router.get("/status/routers")
async def get_routers_status():
    return await api_service.get_routers()

@router.get("/status/services")
async def get_services_status():
    return await api_service.get_services()

@router.get("/status/middlewares")
async def get_middlewares_status():
    return await api_service.get_middlewares()

@router.get("/status/tcp/routers")
async def get_tcp_routers_status():
    return await api_service.get_tcp_routers()

@router.get("/status/tcp/services")
async def get_tcp_services_status():
    return await api_service.get_tcp_services()

@router.get("/status/udp/routers")
async def get_udp_routers_status():
    return await api_service.get_udp_routers()

@router.get("/status/udp/services")
async def get_udp_services_status():
    return await api_service.get_udp_services()