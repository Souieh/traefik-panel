from core.traefik.certificate_resolver_manager import CertificatesResolversManager
from core.traefik.http_manager import HttpManager
from core.traefik.manual_certificates_manager import ManualCertificatesManager
from core.traefik.tcp_udp_manager import TcpUdpManager
from core.traefik.traefik_api import TraefikApiService

http_manager = HttpManager()
tcp_udp_manager = TcpUdpManager()
certificates_manager = CertificatesResolversManager()
manual_certs_manager = ManualCertificatesManager()
api_service = TraefikApiService()
