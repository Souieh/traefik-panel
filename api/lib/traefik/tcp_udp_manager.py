import os
import yaml
from core.config import settings
from pathlib import Path

class TcpUdpManager:
    def __init__(self):
        self.config_file = Path(settings.traefik_config_path, "dynamic/traefik-tcp-udp-configs.yaml") 
        if not self.config_file.exists():
            self.config_file.parent.mkdir(parents=True, exist_ok=True)
            with open(self.config_file, "w") as f:
                f.write("")

       


    def _read_config(self):
        if not os.path.exists(self.config_file):
            return {}
        with open(self.config_file, "r") as f:
            return yaml.safe_load(f) or {}

    def _write_config(self, config):
        with open(self.config_file, "w") as f:
            yaml.dump(config, f, default_flow_style=False)

    # TCP Routers
    def get_tcp_routers(self):
        config = self._read_config()
        return config.get("tcp", {}).get("routers", {})

    def update_tcp_router(self, name: str, router_data: dict):
        config = self._read_config()
        if "tcp" not in config:
            config["tcp"] = {}
        if "routers" not in config["tcp"]:
            config["tcp"]["routers"] = {}
        config["tcp"]["routers"][name] = router_data
        self._write_config(config)

    def delete_tcp_router(self, name: str):
        config = self._read_config()
        if "tcp" in config and "routers" in config["tcp"] and name in config["tcp"]["routers"]:
            del config["tcp"]["routers"][name]
            self._write_config(config)
            return True
        return False

    # TCP Services
    def get_tcp_services(self):
        config = self._read_config()
        return config.get("tcp", {}).get("services", {})

    def update_tcp_service(self, name: str, service_data: dict):
        config = self._read_config()
        if "tcp" not in config:
            config["tcp"] = {}
        if "services" not in config["tcp"]:
            config["tcp"]["services"] = {}
        config["tcp"]["services"][name] = service_data
        self._write_config(config)

    def delete_tcp_service(self, name: str):
        config = self._read_config()
        if "tcp" in config and "services" in config["tcp"] and name in config["tcp"]["services"]:
            del config["tcp"]["services"][name]
            self._write_config(config)
            return True
        return False

    # UDP Routers
    def get_udp_routers(self):
        config = self._read_config()
        return config.get("udp", {}).get("routers", {})

    def update_udp_router(self, name: str, router_data: dict):
        config = self._read_config()
        if "udp" not in config:
            config["udp"] = {}
        if "routers" not in config["udp"]:
            config["udp"]["routers"] = {}
        config["udp"]["routers"][name] = router_data
        self._write_config(config)

    def delete_udp_router(self, name: str):
        config = self._read_config()
        if "udp" in config and "routers" in config["udp"] and name in config["udp"]["routers"]:
            del config["udp"]["routers"][name]
            self._write_config(config)
            return True
        return False

    # UDP Services
    def get_udp_services(self):
        config = self._read_config()
        return config.get("udp", {}).get("services", {})

    def update_udp_service(self, name: str, service_data: dict):
        config = self._read_config()
        if "udp" not in config:
            config["udp"] = {}
        if "services" not in config["udp"]:
            config["udp"]["services"] = {}
        config["udp"]["services"][name] = service_data
        self._write_config(config)

    def delete_udp_service(self, name: str):
        config = self._read_config()
        if "udp" in config and "services" in config["udp"] and name in config["udp"]["services"]:
            del config["udp"]["services"][name]
            self._write_config(config)
            return True
        return False