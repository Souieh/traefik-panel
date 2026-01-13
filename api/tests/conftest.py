import sys
import os
import pytest
from fastapi.testclient import TestClient
import shutil

# Add the 'api' directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# This fixture will be used by all tests
@pytest.fixture(scope="session", autouse=True)
def manage_test_environment():
    # Setup: create the test directory
    test_dir = "/tmp/traefik_test_data"
    if os.path.exists(test_dir):
        shutil.rmtree(test_dir)
    os.makedirs(test_dir, exist_ok=True)

    # Let the tests run
    yield

    # Teardown: remove the test directory
    shutil.rmtree(test_dir)

# Now, we can simply import the app
from main import app

@pytest.fixture(scope="function")
def client():
    with TestClient(app) as c:
        yield c
