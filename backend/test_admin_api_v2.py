import asyncio
import httpx
import traceback

async def check_endpoints():
    base_url = "http://127.0.0.1:8000/api/v1"
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        print("Logging in...")
        try:
            res = await client.post(f"{base_url}/auth/login", data={"username": "patelmahima304@gmail.com", "password": "123456789"})
            res_json = res.json()
            token = res_json.get("token")
            if not token:
                print(f"Login failed: {res_json}")
                return
            headers = {"Authorization": f"Bearer {token}"}
            print("Login successful.")
            
            endpoints = [
                "/admin/dashboard/analytics",
                "/admin/users",
                "/admin/recipes",
                "/admin/submissions",
                "/admin/notifications"
            ]
            
            for ep in endpoints:
                try:
                    r = await client.get(f"{base_url}{ep}", headers=headers)
                    print(f"Endpoint {ep}: Status {r.status_code}")
                    if r.status_code != 200:
                        print(f"  Response: {r.text}")
                except Exception as e:
                    print(f"Endpoint {ep}: Error {str(e)}")
                    traceback.print_exc()
        except Exception as e:
            print(f"Fatal Error: {str(e)}")
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(check_endpoints())
