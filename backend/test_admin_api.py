import asyncio
import httpx

async def check_endpoints():
    base_url = "http://127.0.0.1:8000/api/v1"
    
    # Get token
    async with httpx.AsyncClient() as client:
        res = await client.post(f"{base_url}/auth/login", data={"username": "patelmahima304@gmail.com", "password": "123456789"})
        token = res.json().get("token")
        headers = {"Authorization": f"Bearer {token}"}
        
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
                    print(f"  Error: {r.text}")
            except Exception as e:
                print(f"Endpoint {ep}: Exception {e}")

if __name__ == "__main__":
    asyncio.run(check_endpoints())
