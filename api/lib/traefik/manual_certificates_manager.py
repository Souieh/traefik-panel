import os
import shutil
from typing import Dict, List

import yaml
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from core.config import settings

router = APIRouter()


# ----------------------
# Pydantic Models
# ----------------------
class ManualCertificate(BaseModel):
    domain: str
    cert_path: str
    key_path: str

    class Config:
        orm_mode = True


class ManualCertificateExists(BaseModel):
    name: str
    exists: bool


# ----------------------
# Manager
# ----------------------
class ManualCertificatesManager:
    """
    Manages manually-provided TLS certificates for Traefik.
    """

    def __init__(self) -> None:
        self.config_certs_path = os.path.join(settings.traefik_config_path, "certs")
        self.dynamic_tls_file = os.path.join(
            settings.traefik_config_path, "dynamic", "tls-manual.yml"
        )

        os.makedirs(self.config_certs_path, exist_ok=True)
        os.makedirs(os.path.dirname(self.dynamic_tls_file), exist_ok=True)

    # -------------------------
    # Public API
    # -------------------------

    def add_certificate(self, domain: str, cert_pem: bytes, key_pem: bytes) -> None:
        cert_dir = self._perspective_domain_dir(domain)
        os.makedirs(cert_dir, exist_ok=True)

        cert_path = os.path.join(cert_dir, "fullchain.pem")
        key_path = os.path.join(cert_dir, "privkey.pem")

        self._write_file(cert_path, cert_pem)
        self._write_file(key_path, key_pem)

        self._sync_dynamic_tls()

    def remove_certificate(self, domain: str) -> None:
        cert_dir = self._perspective_domain_dir(domain)
        if os.path.isdir(cert_dir):
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

    def special_list_certificates(self) -> List[dict]:
        certs: List[dict] = []

        for domain in os.listdir(self.config_certs_path):
            cert_dir = self._perspective_domain_dir(domain)
            cert_traefik_dir = self._domain_dir(domain)

            if not os.path.isdir(cert_dir):
                continue

            cert_path = os.path.join(cert_dir, "fullchain.pem")
            key_path = os.path.join(cert_dir, "privkey.pem")

            if os.path.isfile(cert_path) and os.path.isfile(key_path):
                certs.append(
                    {
                        "domain": domain,
                        "cert_path": os.path.join(cert_traefik_dir, "fullchain.pem"),
                        "key_path": os.path.join(cert_traefik_dir, "privkey.pem"),
                    }
                )

        return certs

    def certificate_exists(self, domain: str) -> bool:
        return any(c.domain == domain for c in self.list_certificates())

    # -------------------------
    # Internal mechanics
    # -------------------------
    def _sync_dynamic_tls(self) -> None:
        certificates = [
            {"certFile": cert.cert_path, "keyFile": cert.key_path}
            for cert in self.list_certificates()
        ]
        data: Dict = {"tls": {"certificates": certificates}}

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


manual_certs_manager = ManualCertificatesManager()


# ----------------------
# FastAPI Endpoints
# ----------------------
@router.get("/certificates/manual", response_model=List[ManualCertificate])
async def list_manual_certificates():
    return manual_certs_manager.list_certificates()


@router.get(
    "/certificates/manual/{name}/exists", response_model=ManualCertificateExists
)
async def manual_certificate_exists(name: str):
    exists = manual_certs_manager.certificate_exists(name)
    return ManualCertificateExists(name=name, exists=exists)


@router.delete("/certificates/manual/{name}", status_code=204)
async def delete_manual_certificate(name: str):
    if not manual_certs_manager.certificate_exists(name):
        raise HTTPException(status_code=404, detail="Certificate not found")
    manual_certs_manager.remove_certificate(name)
