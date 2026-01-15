import os
from pathlib import Path
from typing import Any, Dict

import yaml

from core.config import settings
from core.models import TraefikCertResolver


class CertificatesResolversManager:
    def __init__(self) -> None:
        self.traefik_config_path: Path = Path(settings.traefik_config_path)
        self.config_resolver_path: Path = Path(
            settings.traefik_config_path, "traefik-resolver-configs.yaml"
        )
        self.config_acme_path: Path = Path(settings.traefik_config_path, "acme")
        self.config_certs_path: Path = Path(settings.traefik_config_path, "certs")

        self.traefik_config_path.mkdir(parents=True, exist_ok=True)
        self.config_acme_path.mkdir(parents=True, exist_ok=True)
        self.config_certs_path.mkdir(parents=True, exist_ok=True)

        if not self.config_resolver_path.exists():
            self.config_resolver_path.parent.mkdir(parents=True, exist_ok=True)
            with open(self.config_resolver_path, "w") as f:
                f.write("certificatesResolvers: {}\n")

    # -------------------- INTERNAL I/O --------------------
    def _read_resolver_config(self) -> Dict[str, Any]:
        """Reads the YAML resolver config as a plain dict."""
        if not os.path.exists(self.config_resolver_path):
            return {"certificatesResolvers": {}}
        with open(self.config_resolver_path, "r") as f:
            return yaml.safe_load(f) or {"certificatesResolvers": {}}

    def _write_resolver_config(
        self, config: Dict[str, Any] | TraefikCertResolver
    ) -> None:
        """Writes the resolver config to YAML."""
        os.makedirs(os.path.dirname(self.config_resolver_path), exist_ok=True)
        if isinstance(config, TraefikCertResolver):
            data = (config.model_dump(exclude_none=True),)
        else:
            data = config
        with open(self.config_resolver_path, "w") as f:
            yaml.dump(data, f, default_flow_style=False)

    # -------------------- PUBLIC METHODS --------------------
    def get_certificate_resolvers(self) -> Dict[str, Dict[str, Any]]:
        """Returns all certificate resolvers."""
        config = self._read_resolver_config()
        return config.get("certificatesResolvers", {})

    def update_certificate_resolver(
        self, name: str, resolver_data: Dict[str, Any]
    ) -> None:
        """
        Update or create a resolver.
        Enforces backend-controlled ACME storage path.
        """
        config = self._read_resolver_config()

        # Ensure certificatesResolvers section exists
        if (
            "certificatesResolvers" not in config
            or config["certificatesResolvers"] is None
        ):
            config["certificatesResolvers"] = {}

        # Ensure ACME storage is backend-controlled
        if "acme" in resolver_data:
            resolver_data["acme"]["storage"] = str(
                self.config_acme_path / f"{name}.json"
            )

        # Update resolver
        print(f"Updating resolver {name} with data: {resolver_data}", config)
        config["certificatesResolvers"][name] = resolver_data

        self._write_resolver_config(config)

    def delete_certificate_resolver(self, name: str) -> bool:
        """Deletes a certificate resolver by name."""
        config = self._read_resolver_config()
        resolvers = config.get("certificatesResolvers", {})
        if name in resolvers:
            del resolvers[name]
            self._write_resolver_config(config)
            return True
        return False
