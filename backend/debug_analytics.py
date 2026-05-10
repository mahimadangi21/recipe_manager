import asyncio
import httpx

async def run():
    base_url = "http://127.0.0.1:8000/api/v1"
    async with httpx.AsyncClient() as client:
        res = await client.post(f"{base_url}/auth/login", data={"username": "patelmahima304@gmail.com", "password": "123456789"})
        token = res.json().get("token")
        r = await client.get(f"{base_url}/admin/dashboard/analytics", headers={"Authorization": f"Bearer {token}"})
        print(r.json())

if __name__ == "__main__":
    asyncio.run(run())
