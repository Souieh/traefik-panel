from typing import Any, Dict, List

import httpx

from core.config import settings

JSONDict = Dict[str, Any]


class TraefikApiService:
    def __init__(self) -> None:
        self.base_url: str = settings.traefik_api_url.rstrip("/")

    # -------------------- INTERNAL --------------------
    async def _get(self, path: str) -> JSONDict:
        """
        Perform HTTP GET and always return dict.
        Errors return dict with "error".
        """
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(f"{self.base_url}{path}")
                response.raise_for_status()
                data = response.json()
                if isinstance(data, dict):
                    return data
                # If API returned a list, wrap in dict to satisfy typing
                return {"data": data}
            except httpx.RequestError as exc:
                return {"error": f"Connection error: {exc}"}
            except httpx.HTTPStatusError as exc:
                return {"error": f"HTTP error {exc.response.status_code}"}

    async def _get_list(self, path: str) -> List[JSONDict]:
        """
        Perform GET and return list of dicts.
        On error or empty response, return empty list.
        """
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(f"{self.base_url}/api{path}")
                response.raise_for_status()
                data = response.json()
                if isinstance(data, list):
                    return data
                elif isinstance(data, dict):
                    # Sometimes Traefik returns dict of routers/services, convert to list of dicts
                    return list(data.values())
            except httpx.RequestError:
                print("Request error", httpx.RequestError)
                return []
            except httpx.HTTPStatusError:
                print("Request error", httpx.HTTPStatusError)
                return []
        return []

    # -------------------- STATUS / HEALTH --------------------
    async def get_status(self) -> JSONDict:
        """
        Returns Traefik status: DOWN, BROKEN, EMPTY, RUNNING
        """
        # 1. Liveness
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.base_url}/ping")
                if response.status_code != 200 or response.text.strip() != "OK":
                    return {"status": "DOWN", "details": {"text": response.text}}
        except Exception as exc:
            return {"status": "DOWN", "details": {"error": str(exc)}}

        # 2. Raw config validation
        raw = await self._get("/rawdata")
        providers = raw.get("providers", {})
        for name, provider in providers.items():
            if provider.get("error"):
                return {
                    "status": "BROKEN",
                    "provider": name,
                    "error": provider["error"],
                }

        # 3. Readiness
        overview = await self._get("/overview")
        http_data = overview.get("http", {})
        if not http_data.get("routers"):
            return {"status": "RUNNING", "details": "EMPTY"}

        return {"status": "RUNNING"}

    # -------------------- API ENDPOINTS --------------------
    async def get_overview(self) -> JSONDict:
        return await self._get("/overview")

    async def get_rawdata(self) -> JSONDict:
        return await self._get("/rawdata")

    async def get_routers(self) -> List[JSONDict]:
        return await self._get_list("/http/routers")

    async def get_services(self) -> List[JSONDict]:
        return await self._get_list("/http/services")

    async def get_middlewares(self) -> List[JSONDict]:
        return await self._get_list("/http/middlewares")

    async def get_tcp_routers(self) -> List[JSONDict]:
        return await self._get_list("/tcp/routers")

    async def get_tcp_services(self) -> List[JSONDict]:
        return await self._get_list("/tcp/services")

    async def get_udp_routers(self) -> List[JSONDict]:
        return await self._get_list("/udp/routers")

    async def get_udp_services(self) -> List[JSONDict]:
        return await self._get_list("/udp/services")
