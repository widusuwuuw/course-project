import os
import sys
from fastapi.testclient import TestClient

# Make 'backend' the import root so 'app' package is discoverable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))


def get_client():
    # Use a shared test DB and enable testing routes
    os.environ["TESTING"] = "1"
    db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "dev.test.db"))
    os.environ["DATABASE_URL"] = f"sqlite:///{db_path}"
    from app.main import app  # import after env set
    client = TestClient(app)
    # Reset DB to clean state
    client.post("/testing/reset")
    return client


def test_register_and_login():
    client = get_client()

    # Register
    r = client.post("/register", json={"email": "u1@example.com", "password": "secret123"})
    assert r.status_code == 201

    # Login
    r = client.post("/login", data={"username": "u1@example.com", "password": "secret123"})
    assert r.status_code == 200
    token = r.json()["access_token"]
    assert token

    # Access protected endpoint
    r = client.get("/health-logs/", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json() == []
