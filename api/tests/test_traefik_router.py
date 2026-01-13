from unittest.mock import patch

def test_get_routers(client):
    from lib.dependencies import get_current_active_user

    async def override_get_current_active_user():
        return {"username": "testuser", "disabled": False}

    app = client.app
    app.dependency_overrides[get_current_active_user] = override_get_current_active_user

    with patch('routers.traefik.manager.get_routers') as mock_get_routers:
        mock_routers_data = {
            "router1": {"rule": "Host(`example.com`)", "service": "service1"}
        }
        mock_get_routers.return_value = mock_routers_data

        response = client.get("/api/traefik/routers")

        assert response.status_code == 200
        assert response.json() == mock_routers_data
        mock_get_routers.assert_called_once()

    # Clean up the override
    app.dependency_overrides.clear()
