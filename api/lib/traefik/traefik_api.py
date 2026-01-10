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
            
    async def _better_get(self, path:str):
        result = await self._get("/api"+    path )
        if isinstance(result, dict) and "error" in result:
            # Handle or raise the error
            return [] 
        return result

    async def get_status(self):
        # 1. Liveness (special case)
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
        http = overview.get("http", {})

        if http.get("routers", 0) == 0:
            return {"status": "EMPTY"}

        return {"status": "RUNNING"}


    async def get_overview(self):
        return await self._get("/overview")

    async def get_rawdata(self):
        return await self._get("/rawdata")
    async def get_routers(self):
        return await self._better_get("/http/routers")

    async def get_services(self):
        return await self._better_get("/http/services")

    async def get_middlewares(self):
        return await self._better_get("/http/middlewares")

    async def get_tcp_routers(self):
        return await self._better_get("/tcp/routers")

    async def get_tcp_services(self):
        return await self._better_get("/tcp/services")

    async def get_udp_routers(self):
        return await self._better_get("/udp/routers")

    async def get_udp_services(self):
        return await self._better_get("/udp/services")