import os
from pathlib import Path
from core.config import settings

# Traefik dynamic router config as a string
config = """
http:
  routers:
    traefik-api:
      entryPoints:
        - traefik
      rule: PathPrefix(`/`)
      service: api@internal
"""

def ensure_traefik_api_config():
    TRA_API_FILE = Path(settings.traefik_config_path, "dynamic/traefik-api.yaml")
    if not TRA_API_FILE.exists():
        print("Creating Traefik API dynamic router config...")
        os.makedirs(TRA_API_FILE.parent, exist_ok=True)
        with open(TRA_API_FILE, "w") as f:
            f.write(config)
    else:
        print("Traefik API config already exists.")
 