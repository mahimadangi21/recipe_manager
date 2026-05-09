import asyncio
import aiohttp
import time

async def fetch(session, url):
    try:
        async with session.get(url) as response:
            return await response.text()
    except Exception as e:
        return str(e)

async def stress_test(urls, requests_per_second, duration_seconds):
    print(f"Starting multi-region stress test on: {urls}")
    print(f"Target: {requests_per_second} req/s per URL for {duration_seconds}s")
    
    start_time = time.time()
    async with aiohttp.ClientSession() as session:
        while time.time() - start_time < duration_seconds:
            tasks = []
            for url in urls:
                for _ in range(requests_per_second):
                    tasks.append(fetch(session, url))
            await asyncio.gather(*tasks)
            await asyncio.sleep(1)
            
    print("Multi-region stress test complete.")

if __name__ == "__main__":
    URLS = [
        "https://recipe-backend-661692832664.us-central1.run.app/api/v1/recipes/",
        "https://recipe-backend-east-661692832664.us-east1.run.app/api/v1/recipes/",
        "https://recipe-backend-euro-661692832664.europe-west1.run.app/api/v1/recipes/"
    ]
    # Run 100 requests per second per region for 1 hour (3600 seconds)
    asyncio.run(stress_test(URLS, 100, 3600))
