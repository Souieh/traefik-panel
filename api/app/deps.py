# app/api/deps.py
from app.state import (
    api_service,
    certificates_manager,
    http_manager,
    manual_certs_manager,
    tcp_udp_manager,
)
from core.traefik.certificate_resolver_manager import CertificatesResolversManager
from core.traefik.http_manager import HttpManager
from core.traefik.manual_certificates_manager import ManualCertificatesManager
from core.traefik.tcp_udp_manager import TcpUdpManager
from core.traefik.traefik_api import TraefikApiService


def get_http_manager() -> HttpManager:
    return http_manager


def get_tcp_udp_manager() -> TcpUdpManager:
    return tcp_udp_manager


def get_certificates_manager() -> CertificatesResolversManager:
    return certificates_manager


def get_manual_certs_manager() -> ManualCertificatesManager:
    return manual_certs_manager


def get_traefik_api_service() -> TraefikApiService:
    return api_service
