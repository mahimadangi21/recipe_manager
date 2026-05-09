import asyncio
import httpx

async def test_registration():
    url = "http://127.0.0.1:8001/api/v1/auth/register"
    data = {
        "email": "notif_success@example.com",
        "username": "notif_success",
        "password": "password123"
    }
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=data)
            print(f"Status: {response.status_code}")
            print(f"Response: {response.json()}")
        except Exception as e:
            print(f"Error: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_registration())
