import os
import yaml
from core.config import settings

class CertificatesResolversManager:
    def __init__(self):
        self.config_resolver_file = settings.traefik_config_resolver_file 
 

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
        config = self._read_resolver_config()
        if "certificatesResolvers" not in config:
            config["certificatesResolvers"] = {}
        config["certificatesResolvers"][name] = resolver_data
        self._write_resolver_config(config)

    def delete_certificate_resolver(self, name: str):
        config = self._read_resolver_config()
        if "certificatesResolvers" in config and name in config["certificatesResolvers"]:
            del config["certificatesResolvers"][name]
            self._write_resolver_config(config)
            return True
        return False