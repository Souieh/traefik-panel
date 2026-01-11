import os
import yaml
from core.config import settings

class CertificatesResolversManager:
    def __init__(self):
        self.config_storage_path = os.path.join(settings.traefik_config_static)
        self.config_resolver_file = os.path.join(settings.traefik_config_static, "certificatesResolvers.yaml")
        self.config_storage_path_certs = os.path.join(settings.traefik_config_static, "certs")

        if not os.path.exists(self.config_storage_path):
            os.makedirs(self.config_storage_path, exist_ok=True)
        if not os.path.exists(self.config_storage_path_certs):
            os.makedirs(self.config_storage_path_certs, exist_ok=True)
        if not os.path.exists(self.config_resolver_file):
            with open(self.config_resolver_file, "w") as f:
                f.write("certificatesResolvers:\n") 

    def _read_resolver_config(self):
        if not os.path.exists(self.config_resolver_file):
            return {}
        with open(self.config_resolver_file, "r") as f:
            return yaml.safe_load(f) or {}

    def _write_resolver_config(self, config):
        os.makedirs(os.path.dirname(self.config_resolver_file), exist_ok=True)
        with open(self.config_resolver_file, "w") as f:
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
            resolver_data["acme"]["storage"] = os.path.join(self.config_storage_path_certs, f"{name}.json")
        
        # Update resolver
        print(f"Updating resolver {name} with data: {resolver_data}", config)

        config["certificatesResolvers"][name] = resolver_data

        self._write_resolver_config(config)

    def delete_certificate_resolver(self, name: str):
        config = self._read_resolver_config()
        if "certificatesResolvers" in config and name in config["certificatesResolvers"]:
            de
