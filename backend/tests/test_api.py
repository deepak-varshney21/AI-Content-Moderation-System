"""Integration tests for FastAPI endpoints."""

import pytest
from fastapi.testclient import TestClient
from app.database.database import init_db
from app.main import app


@pytest.fixture(autouse=True, scope="module")
def initialize_database():
    """Ensure database schema is created before tests run."""
    init_db()


def test_health_endpoint():
    """Verify /health returns operational status."""
    with TestClient(app) as client:
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "oleksiizirka/xlm-roberta-toxicity-classifier" in data["model_name"]


def test_predict_endpoint_benign_comment():
    """Verify /predict returns correct payload for safe comment."""
    with TestClient(app) as client:
        payload = {"comment": "Thank you very much for this wonderful tutorial, it helped a lot!"}
        response = client.post("/predict", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["recommended_action"] == "ALLOW"
        assert data["severity"]["level"] == "LOW"
        assert "toxicity" in data
        assert "toxic" in data["toxicity"]
        assert data["censored_comment"] is None


def test_moderate_endpoint_toxic_comment():
    """Verify /moderate persists to DB and handles toxic comment."""
    with TestClient(app) as client:
        payload = {"comment": "You are a stupid idiot!"}
        response = client.post("/moderate", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "toxicity" in data
        assert data["severity"]["level"] in ["MEDIUM", "HIGH", "CRITICAL"]
        if data["recommended_action"] == "CENSOR":
            assert data["censored_comment"] is not None
            assert "******" in data["censored_comment"]


def test_history_and_stats_endpoints():
    """Verify history and stats return aggregated data."""
    with TestClient(app) as client:
        # First ensure at least one record exists
        client.post("/moderate", json={"comment": "You are a stupid idiot!"})

        # Fetch history
        hist_resp = client.get("/history")
        assert hist_resp.status_code == 200
        hist_data = hist_resp.json()
        assert "total" in hist_data
        assert "items" in hist_data
        assert hist_data["total"] >= 1

        # Fetch stats
        stats_resp = client.get("/stats")
        assert stats_resp.status_code == 200
        stats_data = stats_resp.json()
        assert "total_comments" in stats_data
        assert "label_distribution" in stats_data
        assert "toxic" in stats_data["label_distribution"]


def test_empty_comment_validation():
    """Verify 422 is returned on empty or whitespace comments."""
    with TestClient(app) as client:
        response = client.post("/moderate", json={"comment": "   "})
        assert response.status_code == 422
