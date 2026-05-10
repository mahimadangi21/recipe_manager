"""
Full API Audit Script for Recipe Manager
Tests all major endpoints with the provided credentials
"""
import asyncio
import json
import urllib.request
import urllib.parse
import urllib.error

BASE_URL = "http://127.0.0.1:8000/api/v1"
EMAIL = "patelmahima304@gmail.com"
PASSWORD = "123456789"

def make_request(url, method="GET", data=None, headers=None):
    """Make an HTTP request and return (status_code, json_body)"""
    try:
        if data and isinstance(data, dict):
            data = json.dumps(data).encode("utf-8")
        elif data and isinstance(data, str):
            data = data.encode("utf-8")
        
        req = urllib.request.Request(url, data=data, headers=headers or {}, method=method)
        res = urllib.request.urlopen(req)
        body = json.loads(res.read())
        return res.status, body
    except urllib.error.HTTPError as e:
        try:
            body = json.loads(e.read())
        except:
            body = {"raw": str(e)}
        return e.code, body
    except Exception as e:
        return None, {"error": str(e)}

def report(feature, status_code, body, expected_ok=True):
    """Print a formatted PASS/FAIL line"""
    is_ok = (status_code is not None and status_code < 400)
    result = "[PASS]" if (is_ok == expected_ok) else "[FAIL]"
    print(f"{result} | {feature} | HTTP {status_code} | {json.dumps(body)[:150]}")

async def main():
    print("=" * 70)
    print("RECIPE MANAGER - FULL API AUDIT")
    print("=" * 70)

    # 1. LOGIN
    print("\n[1] AUTHENTICATION")
    form_data = urllib.parse.urlencode({"username": EMAIL, "password": PASSWORD}).encode()
    status, body = make_request(f"{BASE_URL}/auth/login", method="POST", data=form_data,
                                headers={"Content-Type": "application/x-www-form-urlencoded"})
    report("POST /auth/login", status, body)
    if not body.get("token"):
        print("   ⚠️  Cannot continue without token")
        return
    
    token = body["token"]
    auth = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    # 2. GET ME
    status, body = make_request(f"{BASE_URL}/auth/me", headers=auth)
    report("GET  /auth/me", status, body)
    user_id = body.get("id") or body.get("data", {}).get("id")

    # 3. RECIPES
    print("\n[2] RECIPES")
    status, body = make_request(f"{BASE_URL}/recipes/", headers=auth)
    report("GET  /recipes/", status, body)
    
    status, body = make_request(f"{BASE_URL}/recipes/1", headers=auth)
    report("GET  /recipes/1", status, body)

    # 4. FAVORITES
    print("\n[3] FAVORITES")
    status, body = make_request(f"{BASE_URL}/favorites/", headers=auth)
    report("GET  /favorites/", status, body)

    # 5. COLLECTIONS
    print("\n[4] COLLECTIONS")
    status, body = make_request(f"{BASE_URL}/collections/", headers=auth)
    report("GET  /collections/", status, body)

    # 6. MEAL PLANNER
    print("\n[5] MEAL PLANNER")
    status, body = make_request(f"{BASE_URL}/meal-planner/", headers=auth)
    report("GET  /meal-planner/", status, body)

    meal_data = json.dumps({"recipe_id": 1, "planned_date": "2026-05-11", "meal_type": "lunch", "servings": 2})
    status, body = make_request(f"{BASE_URL}/meal-planner/", method="POST", data=meal_data, headers=auth)
    report("POST /meal-planner/", status, body)

    # Get item id if created
    item_id = None
    if body.get("data"):
        item_id = body["data"].get("id")
    
    # 7. SHOPPING LIST
    print("\n[6] SHOPPING LIST")
    status, body = make_request(f"{BASE_URL}/meal-planner/shopping-list", headers=auth)
    report("GET  /shopping-list", status, body)

    status, body = make_request(f"{BASE_URL}/meal-planner/shopping-list/generate", method="POST", headers=auth)
    report("POST /shopping-list/generate", status, body)

    # 8. NOTIFICATIONS
    print("\n[7] NOTIFICATIONS")
    status, body = make_request(f"{BASE_URL}/notifications/", headers=auth)
    report("GET  /notifications/", status, body)

    # 9. REVIEWS
    print("\n[8] REVIEWS")
    status, body = make_request(f"{BASE_URL}/reviews/recipe/1", headers=auth)
    report("GET  /reviews/recipe/1", status, body)

    # 10. ADMIN (should be 403 for non-admin)
    print("\n[9] ADMIN (expect 403 for regular user)")
    status, body = make_request(f"{BASE_URL}/admin/users", headers=auth)
    report("GET  /admin/users (non-admin)", status, body, expected_ok=False)

    # 11. DELETE meal item
    print("\n[10] CLEANUP")
    if item_id:
        status, body = make_request(f"{BASE_URL}/meal-planner/{item_id}", method="DELETE", headers=auth)
        report(f"DEL  /meal-planner/{item_id}", status, body)

    print("\n" + "=" * 70)
    print("AUDIT COMPLETE")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(main())
