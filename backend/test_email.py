import asyncio
from app.utils.email import send_otp_email
from app.config import settings

async def test():
    print(f"Loaded USERNAME: {settings.MAIL_USERNAME}")
    print(f"Loaded PASSWORD: {settings.MAIL_PASSWORD[:4]}...{settings.MAIL_PASSWORD[-4:]} (length: {len(settings.MAIL_PASSWORD)})")
    print(f"Loaded SERVER: {settings.MAIL_SERVER}")
    print(f"Loaded PORT: {settings.MAIL_PORT}")
    success, msg = await send_otp_email("patelmahima304@gmail.com", "123456", "test")
    print(f"Result: {success}, {msg}")

if __name__ == "__main__":
    asyncio.run(test())
