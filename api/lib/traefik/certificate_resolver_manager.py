import os
import yaml
from core.config import settings
from pathlib import Path 
class CertificatesResolversManager:
    def __init__(self):
        self.traefik_config_path = Path(settings.traefik_config_path)
        self.config_resolver_path = Path(settings.traefik_config_path, "traefik-resolver-configs.yaml")
        self.config_acme_path = Path(settings.traefik_config_path, "acme")
        self.config_certs_path = Path(settings.traefik_config_path, "certs")


        if not self.traefik_config_path.exists():
            self.traefik_config_path.mkdir(parents=True, exist_ok=True)

        if not self.config_resolver_path.exists():
            self.config_resolver_path.parent.mkdir(parents=True, exist_ok=True)
            with open(self.config_resolver_path, "w") as f:
                f.write("resolvers: {}\n")
                
        if not self.config_acme_path.exists():
            self.config_acme_path.mkdir(parents=True, exist_ok=True)
            
        if not self.config_certs_path.exists():
            self.config_certs_path.mkdir(parents=True, exist_ok=True)
 

    def _read_resolver_config(self):
        if not os.path.exists(self.config_resolver_path):
            return {}
        with open(self.config_resolver_path, "r") as f:
            return yaml.safe_load(f) or {}

    def _write_resolver_config(self, config):
        os.makedirs(os.path.dirname(self.config_resolver_path), exist_ok=True)
        with open(self.config_resolver_path, "w") as f:
            yaml.dump(config, f, default_flow_style=False)

    def get_certificate_resolvers(self):
        config = self._read_resolver_config()
        return config.get("certificatesResolvers", {})

    def update_certificate_resolver(self, name: str, resolver_data: dict):
        """
        Update or create a resolver.
        Enforces backend-controlled storage file.
        """
        config = self._read_resolver_config()

        # Ensure certificatesResolvers section exists
        if "certificatesResolvers" not in config or config["certificatesResolvers"] is None:
            config["certificatesResolvers"] = {}

        # Ensure acme storage is controlled by backend
        if "acme" in resolver_data:
            resolver_data["acme"]["storage"] = os.path.join(self.config_acme_path, f"{name}.json")
        
        # Update resolver
        print(f"Updating resolver {name} with data: {resolver_data}", config)

        config["certificatesResolvers"][name] = resolver_data

        self._write_resolver_config(config)

    def delete_certificate_resolver(self, name: str):
        config = self._read_resolver_config()
        if "certificatesResolvers" in config and name in config["certificatesResolvers"]:
            de
