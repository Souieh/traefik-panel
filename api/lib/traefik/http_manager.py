import os
import yaml
from core.config import settings

class HttpManager:
    def __init__(self):
        self.config_file = settings.traefik_config_file
        self.config_resolver_file =  settings.traefik_config_resolver_file

    def _read_config(self):
        if not os.path.exists(self.config_file):
            return {"http": {"routers": {}, "services": {}}}
        with open(self.config_file, "r") as f:
            return yaml.safe_load(f) or {"http": {"routers": {}, "services": {}}}

    def _write_config(self, config):
        with open(self.config_file, "w") as f:
            yaml.dump(config, f, default_flow_style=False)


    def get_routers(self):
        config = self._read_config()
        return config.get("http", {}).get("routers", {})

    def get_services(self):
        config = self._read_config()
        return config.get("http", {}).get("services", {})

    def update_router(self, name: str, router_data: dict):
        config = self._read_config()
        if not router_data:
            return
        if "http" not in config:
            config["http"] = {}
        if "routers" not in config["http"]:
            config["http"]["routers"] = {}
        config["http"]["routers"][name] = router_data
        self._write_config(config)

    def delete_router(self, name: str):
        config = self._read_config()
        if "http" in config and "routers" in config["http"] and name in config["http"]["routers"]:
            del config["http"]["routers"][name]
            self._write_config(config)
            return True
        return False

    

    def update_service(self, name: str, service_data: dict):
        config = self._read_config()
        if "http" not in config:
            config["http"] = {}

        # Only create 'services' if service_data is non-empty
        if service_data:
            if "services" not in config["http"]:
                config["http"]["services"] = {}
            config["http"]["services"][name] = service_data
        self._write_config(config)

    def delete_service(self, name: str):
        config = self._read_config()
        if "http" in config and "services" in config["http"] and name in config["http"]["services"]:
            del config["http"]["services"][name]
            self._write_config(config)
            return True
        return False

    def get_middlewares(self):
        config = self._read_config()
        return config.get("http", {}).get("middlewares", {})

    def update_middleware(self, name: str, middleware_data: dict):
        config = self._read_config()
        if "http" not in config:
            config["http"] = {}
        if "middlewares" not in config["http"]:
            config["http"]["middlewares"] = {}
        config["http"]["middlewares"][name] = middleware_data
        self._write_config(config)

    def delete_middleware(self, name: str):
        config = self._read_config()
        if "http" in config and "middlewares" in config["http"] and name in config["http"]["middlewares"]:
            del config["http"]["middlewares"][name]
            self._write_config(config)
            return True
        return False