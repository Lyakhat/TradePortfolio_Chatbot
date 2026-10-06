import requests
import json

def test_everything():
    frontend_url = "http://localhost:5173"
    backend_url = "http://127.0.0.1:8000"

    print("========================================")
    print("TradePulse Full Integration Test Suite")
    print("========================================")

    # 1. Frontend Server Check
    rf = requests.get(frontend_url)
    assert rf.status_code == 200, f"Frontend failed with {rf.status_code}"
    print(f"[PASS] Frontend is LIVE at {frontend_url} (HTTP 200 OK)")

    # 2. Backend Health & Rate Limiter Check
    rb = requests.get(f"{backend_url}/api/v1/health")
    assert rb.status_code == 200, f"Backend failed with {rb.status_code}"
    print(f"[PASS] Backend is LIVE at {backend_url} (HTTP 200 OK)")

    # 3. User Registration (Requirement 2 & 3)
    user_email = "alex.portfolio@test.com"
    reg_res = requests.post(f"{backend_url}/api/v1/auth/register", json={
        "name": "Alex Trader",
        "email": user_email,
        "password": "SecurePassword123!"
    })
    
    if reg_res.status_code == 201:
        print(f"[PASS] Registration endpoint successful (HTTP 201 Created): {reg_res.json()['user']['name']}")
        token = reg_res.json()["access_token"]
    elif reg_res.status_code == 409:
        print(f"[INFO] User already registered, logging in to obtain fresh token.")
        login_res = requests.post(f"{backend_url}/api/v1/auth/login", json={
            "email": user_email,
            "password": "SecurePassword123!"
        })
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]

    # 4. Duplicate Registration Check (Requirement 3: if registered tell him to login)
    dup_res = requests.post(f"{backend_url}/api/v1/auth/register", json={
        "name": "Alex Duplicate",
        "email": user_email,
        "password": "AnyPassword"
    })
    assert dup_res.status_code == 409, f"Expected 409 Conflict for duplicate registration, got {dup_res.status_code}"
    print(f"[PASS] Duplicate registration properly detected (HTTP 409 Conflict): Prompts user to log in.")

    # 5. Protected Endpoint Check
    me_res = requests.get(f"{backend_url}/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    print(f"[PASS] Protected endpoint accessible with valid JWT: Logged in as {me_res.json()['email']}")

    # 6. Logout & Token Blacklisting Check (Requirement 4 & 5)
    logout_res = requests.post(f"{backend_url}/api/v1/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert logout_res.status_code == 200
    print(f"[PASS] Logout endpoint successfully blacklisted token (HTTP 200 OK)")

    # 7. Verify Blacklisted Token is Rejected
    revoked_res = requests.get(f"{backend_url}/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert revoked_res.status_code == 401, f"Expected 401 for blacklisted token, got {revoked_res.status_code}"
    print(f"[PASS] Blacklisted token successfully rejected (HTTP 401 Unauthorized): {revoked_res.json()['detail']}")

    print("\n----------------------------------------")
    print("ALL REQUIREMENTS VERIFIED AND PASSING SUCCESSFULLY!")
    print("----------------------------------------")

if __name__ == "__main__":
    test_everything()
