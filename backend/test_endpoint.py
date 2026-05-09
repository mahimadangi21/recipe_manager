import asyncio
import httpx

async def test_endpoint():
    print("Testing /auth/forgot-password endpoint...")
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8002/api/v1/auth/forgot-password",
            json={"email": "patelmahima304@gmail.com"}
        )
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")

if __name__ == "__main__":
    asyncio.run(test_endpoint())
