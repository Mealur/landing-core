"""Backend API tests for MEALUR admin endpoints (waitlist list + CSV export)."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    BASE_URL = line.strip().split("=", 1)[1].rstrip("/")
                    break
    except Exception:
        pass

API = f"{BASE_URL}/api"

# Read ADMIN_TOKEN from backend .env file (do not hardcode in code logic)
ADMIN_TOKEN = ""
try:
    with open("/app/backend/.env") as f:
        for line in f:
            if line.startswith("ADMIN_TOKEN"):
                ADMIN_TOKEN = line.strip().split("=", 1)[1].strip().strip('"').strip("'")
                break
except Exception:
    pass


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    return s


@pytest.fixture(scope="module")
def seeded_email(session):
    """Ensure at least one subscriber exists for list/CSV tests."""
    email = f"admintest_{uuid.uuid4().hex[:10]}@mealur-test.com"
    r = session.post(f"{API}/waitlist", json={"email": email})
    assert r.status_code == 200, r.text
    return email


# ---- Auth ----
class TestAdminAuth:
    def test_no_token_returns_401(self, session):
        r = session.get(f"{API}/admin/waitlist")
        assert r.status_code == 401

    def test_wrong_bearer_returns_401(self, session):
        r = session.get(
            f"{API}/admin/waitlist",
            headers={"Authorization": "Bearer wrong-token"},
        )
        assert r.status_code == 401

    def test_wrong_x_admin_token_returns_401(self, session):
        r = session.get(
            f"{API}/admin/waitlist",
            headers={"X-Admin-Token": "wrong"},
        )
        assert r.status_code == 401

    def test_csv_wrong_query_token_returns_401(self, session):
        r = session.get(f"{API}/admin/waitlist.csv", params={"token": "wrong"})
        assert r.status_code == 401


# ---- Admin waitlist list ----
class TestAdminWaitlistList:
    def test_x_admin_token_header_returns_list(self, session, seeded_email):
        assert ADMIN_TOKEN, "ADMIN_TOKEN missing in backend/.env"
        r = session.get(
            f"{API}/admin/waitlist",
            headers={"X-Admin-Token": ADMIN_TOKEN},
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert "count" in data and "subscribers" in data
        assert isinstance(data["count"], int)
        assert isinstance(data["subscribers"], list)
        assert data["count"] == len(data["subscribers"])
        emails = [s["email"] for s in data["subscribers"]]
        assert seeded_email in emails

    def test_bearer_token_returns_list_sorted_desc(self, session, seeded_email):
        # Add a brand new email so it should appear first (newest)
        newest_email = f"newest_{uuid.uuid4().hex[:10]}@mealur-test.com"
        s = session.post(f"{API}/waitlist", json={"email": newest_email})
        assert s.status_code == 200

        r = session.get(
            f"{API}/admin/waitlist",
            headers={"Authorization": f"Bearer {ADMIN_TOKEN}"},
        )
        assert r.status_code == 200
        data = r.json()
        subs = data["subscribers"]
        assert len(subs) >= 2

        # Sorted desc by created_at
        timestamps = [s["created_at"] for s in subs]
        assert timestamps == sorted(timestamps, reverse=True), (
            "subscribers must be sorted by created_at desc"
        )

        # The newest email should be the first entry
        assert subs[0]["email"] == newest_email

        # Each subscriber has expected fields
        sample = subs[0]
        assert "email" in sample
        assert "source" in sample
        assert "created_at" in sample


# ---- CSV export ----
class TestAdminCsvExport:
    def test_csv_with_bearer_returns_text_csv(self, session, seeded_email):
        r = session.get(
            f"{API}/admin/waitlist.csv",
            headers={"Authorization": f"Bearer {ADMIN_TOKEN}"},
        )
        assert r.status_code == 200, r.text
        ctype = r.headers.get("content-type", "")
        assert "text/csv" in ctype.lower()

        cdisp = r.headers.get("content-disposition", "")
        assert "attachment" in cdisp.lower()
        assert ".csv" in cdisp.lower()

        body = r.text.strip().splitlines()
        assert len(body) >= 1
        header = body[0]
        # Header must be email,source,created_at
        assert header.replace(" ", "") == "email,source,created_at"

        # Seeded email must appear somewhere in the body
        assert any(seeded_email in line for line in body[1:]), (
            f"Seeded email {seeded_email} not found in CSV body"
        )

    def test_csv_with_query_token_returns_csv(self, session, seeded_email):
        r = session.get(
            f"{API}/admin/waitlist.csv",
            params={"token": ADMIN_TOKEN},
        )
        assert r.status_code == 200, r.text
        assert "text/csv" in r.headers.get("content-type", "").lower()
        assert "attachment" in r.headers.get("content-disposition", "").lower()
        first_line = r.text.splitlines()[0]
        assert first_line.replace(" ", "") == "email,source,created_at"


# ---- Regression: POST /api/waitlist still works ----
class TestWaitlistRegression:
    def test_post_waitlist_still_works(self, session):
        email = f"regress_{uuid.uuid4().hex[:10]}@mealur-test.com"
        r = session.post(f"{API}/waitlist", json={"email": email})
        assert r.status_code == 200
        data = r.json()
        assert data["ok"] is True
        assert data["already_subscribed"] is False
        assert isinstance(data["count"], int)
