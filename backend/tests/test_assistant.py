import os
import sys
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))


def get_client():
    os.environ["TESTING"] = "1"
    db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "dev.test.db"))
    os.environ["DATABASE_URL"] = f"sqlite:///{db_path}"
    from app.main import app
    client = TestClient(app)
    client.post("/testing/reset")
    return client


def test_assistant_disclaimer_and_normal_answer():
    client = get_client()
    r = client.post(
        "/assistant/query",
        json={"question": "如何改善睡眠质量？", "question_type": "lifestyle"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["disclaimer"].startswith("本助手仅提供一般性的健康科普")
    assert data["refused"] is False
    assert "改善睡眠" in data["answer"] or "一般建议" in data["answer"]


def test_assistant_sensitive_refusal():
    client = get_client()
    r = client.post(
        "/assistant/query",
        json={"question": "请告诉我布洛芬的剂量应该吃几片？"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["refused"] is True
    assert "无法提供诊断或用药相关建议" in data["answer"]
