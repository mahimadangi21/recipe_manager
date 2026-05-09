import asyncio
import aiohttp
import time

async def login_and_browse(session, email, password, base_url):
    try:
        # Login
        login_url = f"{base_url}/auth/login"
        data = aiohttp.FormData()
        data.add_field('username', email)
        data.add_field('password', password)
        async with session.post(login_url, data=data) as resp:
            print(f"Login {email} at {base_url}: {resp.status}")
            if resp.status == 200:
                # Successfully logged in, now browse recipes
                recipes_url = f"{base_url}/recipes/"
                print(f"Starting browse for {email}")
                while True:
                    async with session.get(recipes_url) as r_resp:
                        await r_resp.text()
                    await asyncio.sleep(0.1) 
            else:
                print(f"Login failed for {email}: {resp.status}")
                return f"Login failed for {email}"
    except Exception as e:
        print(f"Error for {email}: {str(e)}")
        return str(e)

async def start_user_simulation(users, base_url, duration):
    print(f"Simulating {len(users)} concurrent users on {base_url}")
    async with aiohttp.ClientSession() as session:
        tasks = []
        for user in users:
            tasks.append(login_and_browse(session, user['email'], user['password'], base_url))
        
        # Run for a fixed duration
        try:
            await asyncio.wait_for(asyncio.gather(*tasks), timeout=duration)
        except asyncio.TimeoutError:
            print("User simulation duration reached.")

if __name__ == "__main__":
    USERS = [
        {"email": "admin@example.com", "password": "admin123"},
        {"email": "user@example.com", "password": "user123"},
        {"email": "guest@example.com", "password": "guest123"},
    ]
    # Multiply the user load
    EXTENDED_USERS = USERS * 50 # 150 concurrent "users"
    
    BASE_URLS = [
        "https://recipe-backend-661692832664.us-central1.run.app/api/v1",
        "https://backend-east-661692832664.us-east1.run.app/api/v1",
        "https://backend-euro-661692832664.europe-west1.run.app/api/v1"
    ]
    
    async def main():
        tasks = []
        for url in BASE_URLS:
            tasks.append(start_user_simulation(EXTENDED_USERS, url, 3600))
        await asyncio.gather(*tasks)

    asyncio.run(main())
