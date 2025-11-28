import os
import sys
from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient


BACKEND_DIR = os.path.dirname(os.path.dirname(__file__))
sys.path.insert(0, BACKEND_DIR)

os.environ["TESTING"] = "1"
_TEST_DB = os.path.join(BACKEND_DIR, 'dev.test.db')
os.environ["DATABASE_URL"] = f"sqlite:///{_TEST_DB}"

from app.main import app  # noqa: E402


client = TestClient(app)
client.post("/testing/reset")


def register_and_login(email: str, password: str) -> str:
    r = client.post("/register", json={"email": email, "password": password})
    assert r.status_code == 201 or r.status_code == 400
    r = client.post(
        "/login",
        data={"username": email, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert r.status_code == 200, r.text
    token = r.json()["access_token"]
    return token


def auth_headers(token: str):
    return {"Authorization": f"Bearer {token}"}


def test_trends_up_direction():
    email = "trends@example.com"
    token = register_and_login(email, "secret123")

    # insert 10 days of increasing weights
    base = datetime.utcnow() - timedelta(days=10)
    for i in range(10):
        dt = base + timedelta(days=i)
        weight = 70.0 + i * 0.5
        resp = client.post(
            "/health-logs/",
            json={
                "metric_type": "weight",
                "value1": weight,
                "unit": "kg",
                "logged_at": dt.isoformat(),
            },
            headers=auth_headers(token),
        )
        assert resp.status_code == 201, resp.text

    r = client.get("/health-logs/trends", headers=auth_headers(token))
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["metric"] == "weight"
    assert body["points"], "points should not be empty"
    assert body["trend"] == "up"
    assert body["weekly_change"] is None or body["weekly_change"] > 0
