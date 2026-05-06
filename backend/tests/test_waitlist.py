"""Backend API tests for MEALUR waitlist endpoints."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # fallback to frontend env file
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    BASE_URL = line.strip().split("=", 1)[1].rstrip("/")
                    break
    except Exception:
        pass

API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def unique_email():
    return f"test_{uuid.uuid4().hex[:10]}@mealur-test.com"


# Root endpoint
class TestRoot:
    def test_root_returns_service_info(self, session):
        r = session.get(f"{API}/")
        assert r.status_code == 200
        data = r.json()
        assert data.get("service") == "MEALUR"
        assert "status" in data


# Waitlist subscribe
class TestWaitlistSubscribe:
    def test_subscribe_valid_email(self, session, unique_email):
        r = session.post(f"{API}/waitlist", json={"email": unique_email})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["ok"] is True
        assert data["already_subscribed"] is False
        assert isinstance(data["count"], int)
        assert data["count"] >= 1

    def test_subscribe_duplicate_email(self, session, unique_email):
        # Insert again with same email (relies on previous test having registered it)
        r = session.post(f"{API}/waitlist", json={"email": unique_email})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["ok"] is True
        assert data["already_subscribed"] is True

    def test_subscribe_case_insensitive_duplicate(self, session, unique_email):
        # Same email upper-cased should still be considered duplicate (server lowercases)
        r = session.post(
            f"{API}/waitlist", json={"email": unique_email.upper()}
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["already_subscribed"] is True

    def test_subscribe_invalid_email_returns_422(self, session):
        r = session.post(f"{API}/waitlist", json={"email": "not-an-email"})
        assert r.status_code == 422

    def test_subscribe_missing_email_returns_422(self, session):
        r = session.post(f"{API}/waitlist", json={})
        assert r.status_code == 422

    def test_subscribe_empty_email_returns_422(self, session):
        r = session.post(f"{API}/waitlist", json={"email": ""})
        assert r.status_code == 422


# Waitlist stats
class TestWaitlistStats:
    def test_stats_returns_count(self, session):
        r = session.get(f"{API}/waitlist/stats")
        assert r.status_code == 200
        data = r.json()
        assert "count" in data
        assert isinstance(data["count"], int)
        assert data["count"] >= 0

    def test_stats_count_increases_on_new_subscription(self, session):
        before = session.get(f"{API}/waitlist/stats").json()["count"]

        new_email = f"test_{uuid.uuid4().hex[:10]}@mealur-test.com"
        sub = session.post(f"{API}/waitlist", json={"email": new_email})
        assert sub.status_code == 200

        after = session.get(f"{API}/waitlist/stats").json()["count"]
        assert after == before + 1
        assert sub.json()["count"] == after
