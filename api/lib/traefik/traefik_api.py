import httpx
from core.config import settings

class TraefikApiService:
    def __init__(self):
        self.base_url = settings.traefik_api_url.rstrip("/")

    async def _get(self, path: str):
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(f"{self.base_url}{path}")
                response.raise_for_status()
                return response.json()
            except httpx.RequestError as exc:
                return {"error": f"Connection error: {exc}"}
            except httpx.HTTPStatusError as exc:
                return {"error": f"HTTP error {exc.response.status_code}"}

    async def get_routers(self):
        return await self._get("/http/routers")

    async def get_services(self):
        return await self._get("/http/services")

    async def get_middlewares(self):
        return await self._get("/http/middlewares")

    async def get_tcp_routers(self):
        return await self._get("/tcp/routers")

    async def get_tcp_services(self):
        return await self._get("/tcp/services")

    async def get_udp_routers(self):
        return await self._get("/udp/routers")

    async def get_udp_services(self):
        return await self._get("/udp/services")