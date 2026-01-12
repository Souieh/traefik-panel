import os
import shutil
from typing import List, Dict
from pydantic import BaseModel, Field
from core.config import settings
import yaml


class ManualCertificate(BaseModel):
    domain: str
    cert_path: str
    key_path: str


class ManualCertificatesManager:
    """
    Manages manually-provided TLS certificates for Traefik.

    Scope:
    - File-based certificates only
    - Dynamic configuration only
    - Hot-reload safe

    Non-goals:
    - ACME
    - Resolvers
    - Traefik restarts
    """

    def __init__(self) -> None:
        self.config_certs_path = os.path.join(
            settings.traefik_config_path,
            "certs",
        )
        self.dynamic_tls_file = os.path.join(
            settings.traefik_config_path,
            "dynamic",
            "tls-manual.yml",
        )

        os.makedirs(self.config_certs_path, exist_ok=True)
        os.makedirs(os.path.dirname(self.dynamic_tls_file), exist_ok=True)

    # -------------------------
    # Public API
    # -------------------------

    def add_certificate(
        self,
        domain: str,
        cert_pem: bytes,
        key_pem: bytes,
    ) -> None:
        cert_dir = self._perspective_domain_dir(domain)
        os.makedirs(cert_dir, exist_ok=True)


        cert_path = os.path.join(cert_dir, "fullchain.pem")
        key_path = os.path.join(cert_dir, "privkey.pem")

        self._write_file(cert_path, cert_pem)
        self._write_file(key_path, key_pem)

        self._sync_dynamic_tls()

    def remove_certificate(self, domain: str) -> None:
        cert_dir = self._perspective_domain_dir(domain)

        if not os.path.isdir(cert_dir):
            return

        shutil.rmtree(cert_dir)
        self._sync_dynamic_tls()

    def list_certificates(self) -> List[ManualCertificate]:
        certs: List[ManualCertificate] = []

        for domain in os.listdir(self.config_certs_path):
            cert_dir = self._perspective_domain_dir(domain)
            cert_traefik_dir = self._domain_dir(domain)


            if not os.path.isdir(cert_dir):
                continue

            cert_path = os.path.join(cert_dir, "fullchain.pem")
            key_path = os.path.join(cert_dir, "privkey.pem")


            if os.path.isfile(cert_path) and os.path.isfile(key_path):
                certs.append(
                    ManualCertificate(
                        domain=domain,
                        cert_path=os.path.join(cert_traefik_dir, "fullchain.pem"),
                        key_path=os.path.join(cert_traefik_dir, "privkey.pem"),
                    )
                )

        return certs

    # -------------------------
    # Internal mechanics
    # -------------------------

    def _sync_dynamic_tls(self) -> None:
        """
        Regenerates tls-manual.yml based on filesystem state.
        This is idempotent and safe.
        """
        certificates = []

        for cert in self.list_certificates():
            certificates.append(
                {
                    "certFile": cert.cert_path,
                    "keyFile": cert.key_path,
                }
            )

        data: Dict = {
            "tls": {
                "certificates": certificates
            }
        }

        with open(self.dynamic_tls_file, "w") as f:
            yaml.safe_dump(data, f, sort_keys=False)

    def _domain_dir(self, domain: str) -> str:
        return os.path.join("/certs", domain)
    def _perspective_domain_dir(self, domain: str) -> str:
        return os.path.join(self.config_certs_path, domain)

    @staticmethod
    def _write_file(path: str, content: bytes) -> None:
        with open(path, "wb") as f:
            f.write(content)
