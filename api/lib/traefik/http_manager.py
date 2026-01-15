import os
from pathlib import Path
from typing import Dict

import yaml

from core.config import settings
from core.models import (
    TraefikHttpBlock,
    TraefikHttpConfig,
    TraefikMiddleware,
    TraefikRouter,
    TraefikService,
)


class HttpManager:
    def __init__(self):
        # Initialize config file path
        self.config_file = Path(
            settings.traefik_config_path, "dynamic/traefik-http-configs.yaml"
        )

        # Ensure the config file and directory exist
        if not self.config_file.exists():
            self.config_file.parent.mkdir(parents=True, exist_ok=True)
            with open(self.config_file, "w") as f:
                f.write("\n")

    def _read_config(self) -> TraefikHttpConfig:
        """Reads the YAML configuration file and returns a Pydantic model."""
        if not os.path.exists(self.config_file):
            # Return empty config as a model
            return TraefikHttpConfig(
                http=TraefikHttpBlock(routers={}, services={}, middlewares={})
            )
        try:
            with open(self.config_file, "r") as f:
                data = yaml.safe_load(f) or {}

            # Ensure the top-level http block exists
            http_data = data.get("http", {})
            return TraefikHttpConfig(
                http=TraefikHttpBlock(
                    routers=http_data.get("routers", {}),
                    services=http_data.get("services", {}),
                    middlewares=http_data.get("middlewares", {}),
                )
            )
        except Exception as e:
            print(f"Error reading {self.config_file}: {e}")
            raise (e)

    def _write_config(self, config: TraefikHttpConfig):
        """Writes the configuration to the YAML file."""
        with open(self.config_file, "w") as f:
            yaml.dump(config.model_dump(exclude_none=True), f, default_flow_style=False)

    # -------------------- GET METHODS --------------------
    def get_routers(self) -> Dict[str, TraefikRouter]:
        """Retrieves all HTTP routers."""
        config = self._read_config()
        if not config.http or not config.http.routers:
            return {}
        return config.http.routers

    def get_services(self) -> Dict[str, TraefikService]:
        """Retrieves all HTTP services."""
        config = self._read_config()
        if not config.http or not config.http.services:
            return {}
        return config.http.services

    def get_middlewares(self) -> Dict[str, TraefikMiddleware]:
        """Retrieves all HTTP middlewares."""
        config = self._read_config()
        if not config.http or not config.http.middlewares:
            return {}
        return config.http.middlewares

    # -------------------- UPDATE METHODS --------------------
    def update_router(self, name: str, router_data: TraefikRouter | None):
        """Add/update or delete a router. Removes the routers block if empty."""
        config = self._read_config()
        http = config.http or TraefikHttpBlock()
        routers = http.routers or {}

        if router_data:
            routers[name] = router_data
        else:
            routers.pop(name, None)

        http.routers = routers or None
        config.http = (
            http if any([http.routers, http.services, http.middlewares]) else None
        )

        self._write_config(config)

    def update_service(self, name: str, service_data: TraefikService | None):
        """Add/update or delete a service. Removes the services block if empty."""
        config = self._read_config()
        http = config.http or TraefikHttpBlock()
        services = http.services or {}

        if service_data:
            services[name] = service_data
        else:
            services.pop(name, None)

        http.services = services or None
        config.http = (
            http if any([http.routers, http.services, http.middlewares]) else None
        )

        self._write_config(config)

    def update_middleware(self, name: str, middleware_data: TraefikMiddleware | None):
        """Add/update or delete a middleware. Removes the middlewares block if empty."""
        config = self._read_config()
        http = config.http or TraefikHttpBlock()
        middlewares = http.middlewares or {}

        if middleware_data:
            middlewares[name] = middleware_data
        else:
            middlewares.pop(name, None)

        http.middlewares = middlewares or None
        config.http = (
            http if any([http.routers, http.services, http.middlewares]) else None
        )

        self._write_config(config)

    # -------------------- DELETE METHODS --------------------
    def delete_router(self, name: str) -> bool:
        """Deletes an HTTP router by name."""
        if name in self.get_routers():
            self.update_router(name, None)
            return True
        return False

    def delete_service(self, name: str) -> bool:
        """Deletes an HTTP service by name."""
        if name in self.get_services():
            self.update_service(name, None)
            return True
        return False

    def delete_middleware(self, name: str) -> bool:
        """Deletes an HTTP middleware by name."""
        if name in self.get_middlewares():
            self.update_middleware(name, None)
            return True
        return False
