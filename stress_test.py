import asyncio
import aiohttp
import time

async def fetch(session, url):
    try:
        async with session.get(url) as response:
            return await response.text()
    except Exception as e:
        return str(e)

async def stress_test(url, requests_per_second, duration_seconds):
    print(f"Starting stress test on {url}")
    print(f"Target: {requests_per_second} req/s for {duration_seconds}s")
    
    start_time = time.time()
    async with aiohttp.ClientSession() as session:
        while time.time() - start_time < duration_seconds:
            tasks = []
            for _ in range(requests_per_second):
                tasks.append(fetch(session, url))
            await asyncio.gather(*tasks)
            await asyncio.sleep(1)
            
    print("Stress test complete.")

if __name__ == "__main__":
    BACKEND_URL = "https://recipe-backend-661692832664.us-central1.run.app/api/v1/recipes/"
    # Run 50 requests per second for 5 minutes (300 seconds)
    asyncio.run(stress_test(BACKEND_URL, 50, 300))
