from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, status

from core.models import (
    ManualCertificateCreate,
    TraefikCertResolver,
    TraefikMiddleware,
    TraefikRouter,
    TraefikService,
)
from lib.dependencies import get_current_active_user
from lib.traefik.certificate_resolver_manager import CertificatesResolversManager
from lib.traefik.http_manager import HttpManager
from lib.traefik.manual_certificates_manager import ManualCertificatesManager
from lib.traefik.tcp_udp_manager import TcpUdpManager
from lib.traefik.traefik_api import TraefikApiService

router = APIRouter(
    prefix="/traefik",
    tags=["traefik"],
    dependencies=[Depends(get_current_active_user)],
)

# Initialize managers
manager = HttpManager()
tcp_udp_manager = TcpUdpManager()
certificates_manager = CertificatesResolversManager()
manual_certs_manager = ManualCertificatesManager()
api_service = TraefikApiService()


# ---------------- HTTP Configuration ----------------
@router.get("/config", response_model=Dict[str, Any])
async def get_config():
    try:
        return manager._read_config()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/routers", response_model=Dict[str, TraefikRouter])
async def get_routers():
    try:
        return manager.get_routers()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/routers/{name}", response_model=Dict[str, str])
async def update_router(name: str, router_data: TraefikRouter):
    try:
        manager.update_router(name, router_data)
        return {"msg": "Router updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/routers/{name}", response_model=Dict[str, str])
async def delete_router(name: str):
    if not manager.delete_router(name):
        raise HTTPException(status_code=404, detail="Router not found")
    return {"msg": "Router deleted"}


# ---------------- HTTP Services ----------------
@router.get("/services", response_model=Dict[str, TraefikService])
async def get_services():
    try:
        return manager.get_services()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/services/{name}", response_model=Dict[str, str])
async def update_service(name: str, service_data: TraefikService):
    try:
        manager.update_service(name, service_data)
        return {"msg": "Service updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/services/{name}", response_model=Dict[str, str])
async def delete_service(name: str):
    if not manager.delete_service(name):
        raise HTTPException(status_code=404, detail="Service not found")
    return {"msg": "Service deleted"}


# ---------------- Middlewares ----------------
@router.get("/middlewares", response_model=Dict[str, TraefikMiddleware])
async def get_middlewares():
    try:
        return manager.get_middlewares()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/middlewares/{name}", response_model=Dict[str, str])
async def update_middleware(name: str, middleware_data: TraefikMiddleware):
    try:
        manager.update_middleware(name, middleware_data)
        return {"msg": "Middleware updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/middlewares/{name}", response_model=Dict[str, str])
async def delete_middleware(name: str):
    if not manager.delete_middleware(name):
        raise HTTPException(status_code=404, detail="Middleware not found")
    return {"msg": "Middleware deleted"}


# ---------------- Certificate Resolvers ----------------
@router.get("/certificates-resolvers", response_model=Dict[str, Any])
async def get_certificate_resolvers():
    try:
        return certificates_manager.get_certificate_resolvers()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/certificates-resolvers/{name}", response_model=Dict[str, str])
async def update_certificate_resolver(name: str, resolver_data: TraefikCertResolver):
    try:
        certificates_manager.update_certificate_resolver(
            name, resolver_data.model_dump(exclude_none=True)
        )
        return {"msg": "Certificate Resolver updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/certificates-resolvers/{name}", response_model=Dict[str, str])
async def delete_certificate_resolver(name: str):
    if not certificates_manager.delete_certificate_resolver(name):
        raise HTTPException(status_code=404, detail="Certificate Resolver not found")
    return {"msg": "Certificate Resolver deleted"}


# ---------------- Manual Certificates ----------------
@router.get("/certificates/manual", response_model=List[Dict[str, Any]])
async def list_manual_certificates():
    try:
        return manual_certs_manager.special_list_certificates()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/certificates/manual/{name}",
    status_code=status.HTTP_201_CREATED,
    response_model=Dict[str, str],
)
async def create_or_update_manual_certificate(
    name: str, payload: ManualCertificateCreate
):
    try:
        manual_certs_manager.add_certificate(
            domain=name,
            cert_pem=payload.certificate_pem.encode(),
            key_pem=payload.private_key_pem.encode(),
        )
        return {"msg": "Manual certificate stored", "name": name}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/certificates/manual/{name}", response_model=Dict[str, str])
async def delete_manual_certificate(name: str):
    try:
        manual_certs_manager.remove_certificate(name)
        return {"msg": "Manual certificate deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/certificates/manual/{name}/exists", response_model=Dict[str, Any])
async def manual_certificate_exists(name: str):
    try:
        certs = manual_certs_manager.list_certificates()
        exists = any(c.domain == name for c in certs)  # use attribute access
        return {"name": name, "exists": exists}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------- TCP/UDP Routers & Services ----------------
def _wrap_tcp_udp_call(func, *args, **kwargs):
    """Helper to wrap tcp/udp manager calls with error handling"""
    try:
        return func(*args, **kwargs)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tcp/routers", response_model=Dict[str, Any])
async def get_tcp_routers():
    return _wrap_tcp_udp_call(tcp_udp_manager.get_tcp_routers)


@router.post("/tcp/routers/{name}", response_model=Dict[str, str])
async def update_tcp_router(name: str, router_data: Dict[str, Any]):
    return _wrap_tcp_udp_call(tcp_udp_manager.update_tcp_router, name, router_data) or {
        "msg": "TCP Router updated"
    }


@router.delete("/tcp/routers/{name}", response_model=Dict[str, str])
async def delete_tcp_router(name: str):
    if not tcp_udp_manager.delete_tcp_router(name):
        raise HTTPException(status_code=404, detail="TCP Router not found")
    return {"msg": "TCP Router deleted"}


@router.get("/tcp/services", response_model=Dict[str, Any])
async def get_tcp_services():
    return _wrap_tcp_udp_call(tcp_udp_manager.get_tcp_services)


@router.post("/tcp/services/{name}", response_model=Dict[str, str])
async def update_tcp_service(name: str, service_data: Dict[str, Any]):
    return _wrap_tcp_udp_call(
        tcp_udp_manager.update_tcp_service, name, service_data
    ) or {"msg": "TCP Service updated"}


@router.delete("/tcp/services/{name}", response_model=Dict[str, str])
async def delete_tcp_service(name: str):
    if not tcp_udp_manager.delete_tcp_service(name):
        raise HTTPException(status_code=404, detail="TCP Service not found")
    return {"msg": "TCP Service deleted"}


@router.get("/udp/routers", response_model=Dict[str, Any])
async def get_udp_routers():
    return _wrap_tcp_udp_call(tcp_udp_manager.get_udp_routers)


@router.post("/udp/routers/{name}", response_model=Dict[str, str])
async def update_udp_router(name: str, router_data: Dict[str, Any]):
    return _wrap_tcp_udp_call(tcp_udp_manager.update_udp_router, name, router_data) or {
        "msg": "UDP Router updated"
    }


@router.delete("/udp/routers/{name}", response_model=Dict[str, str])
async def delete_udp_router(name: str):
    if not tcp_udp_manager.delete_udp_router(name):
        raise HTTPException(status_code=404, detail="UDP Router not found")
    return {"msg": "UDP Router deleted"}


@router.get("/udp/services", response_model=Dict[str, Any])
async def get_udp_services():
    return _wrap_tcp_udp_call(tcp_udp_manager.get_udp_services)


@router.post("/udp/services/{name}", response_model=Dict[str, str])
async def update_udp_service(name: str, service_data: Dict[str, Any]):
    return _wrap_tcp_udp_call(
        tcp_udp_manager.update_udp_service, name, service_data
    ) or {"msg": "UDP Service updated"}


@router.delete("/udp/services/{name}", response_model=Dict[str, str])
async def delete_udp_service(name: str):
    if not tcp_udp_manager.delete_udp_service(name):
        raise HTTPException(status_code=404, detail="UDP Service not found")
    return {"msg": "UDP Service deleted"}


# ---------------- Traefik API Status (Proxy) ----------------
@router.get("/status/healthy", response_model=Dict[str, Any])
async def get_status():
    try:
        return await api_service.get_status()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/routers", response_model=List[Dict[str, Any]])
async def get_routers_status():
    try:
        return await api_service.get_routers()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/services", response_model=List[Dict[str, Any]])
async def get_services_status():
    try:
        return await api_service.get_services()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/middlewares", response_model=List[Dict[str, Any]])
async def get_middlewares_status():
    try:
        return await api_service.get_middlewares()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/tcp/routers", response_model=List[Dict[str, Any]])
async def get_tcp_routers_status():
    try:
        return await api_service.get_tcp_routers()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/tcp/services", response_model=List[Dict[str, Any]])
async def get_tcp_services_status():
    try:
        return await api_service.get_tcp_services()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/udp/routers", response_model=List[Dict[str, Any]])
async def get_udp_routers_status():
    try:
        return await api_service.get_udp_routers()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/udp/services", response_model=List[Dict[str, Any]])
async def get_udp_services_status():
    try:
        return await api_service.get_udp_services()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
