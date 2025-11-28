import os
import sys
from fastapi.testclient import TestClient

# Make 'backend' the import root so 'app' package is discoverable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))


def get_client():
    os.environ["TESTING"] = "1"
    db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "dev.test.db"))
    os.environ["DATABASE_URL"] = f"sqlite:///{db_path}"
    from app.main import app
    client = TestClient(app)
    client.post("/testing/reset")
    return client


def auth_headers(client: TestClient):
    client.post("/register", json={"email": "u2@example.com", "password": "secret123"})
    r = client.post("/login", data={"username": "u2@example.com", "password": "secret123"})
    token = r.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_create_and_list_logs():
    client = get_client()
    headers = auth_headers(client)

    # Create
    r = client.post("/health-logs/", json={"metric_type": "weight", "value1": 65.2, "unit": "kg"}, headers=headers)
    assert r.status_code == 201
    body = r.json()
    assert body["value1"] == 65.2
    assert body["unit"] == "kg"

    # List
    r = client.get("/health-logs/", headers=headers)
    assert r.status_code == 200
    arr = r.json()
    assert isinstance(arr, list)
    assert len(arr) == 1
    assert arr[0]["value1"] == 65.2
