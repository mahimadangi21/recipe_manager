import logging
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from app.config import settings

logger = logging.getLogger(__name__)

def get_mail_config():
    return ConnectionConfig(
        MAIL_USERNAME=settings.MAIL_USERNAME,
        MAIL_PASSWORD=settings.MAIL_PASSWORD,
        MAIL_FROM=settings.MAIL_FROM,
        MAIL_PORT=settings.MAIL_PORT,
        MAIL_SERVER=settings.MAIL_SERVER,
        MAIL_STARTTLS=settings.MAIL_STARTTLS,
        MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
        USE_CREDENTIALS=True,
        VALIDATE_CERTS=True,
        MAIL_FROM_NAME=settings.MAIL_FROM_NAME
    )

async def send_otp_email(email: str, otp: str, type: str = "signup"):
    """
    Sends OTP email. Logs detailed status to console.
    """
    subject = "Verify Your RecipeManager Account" if type == "signup" else "Reset Your RecipeManager Password"
    
    template = f"""
    --------------------------------------------------
    RECIPE MANAGER - {subject.upper()}
    --------------------------------------------------
    Hello,
    
    Your verification code is:
    
    [ {otp} ]
    
    This code will expire in 5 minutes.
    If you did not request this code, please ignore this email.
    
    Happy Cooking,
    The RecipeManager Team
    --------------------------------------------------
    """
    
    print("\n" + "="*50)
    print(f"EMAIL LOG: Starting delivery to {email}")
    print(f"EMAIL LOG: Subject: {subject}")
    print(f"EMAIL LOG: OTP: {otp}")
    
    # Check if credentials are placeholders
    is_placeholder = "example.com" in settings.MAIL_USERNAME or not settings.MAIL_PASSWORD
    
    if is_placeholder:
        print("EMAIL LOG: [WARNING] SMTP credentials are not configured. Email will ONLY be logged here.")
        print(template)
        print("="*50 + "\n")
        return True, "Mock email logged to console (SMTP credentials missing)"

    try:
        message = MessageSchema(
            subject=subject,
            recipients=[email],
            body=template,
            subtype=MessageType.plain
        )
        conf = get_mail_config()
        fm = FastMail(conf)
        await fm.send_message(message)
        
        print("EMAIL LOG: [SUCCESS] Email sent successfully via SMTP.")
        print("="*50 + "\n")
        return True, "Email sent successfully"
    except Exception as e:
        error_msg = f"SMTP ERROR: {str(e)}"
        print(f"EMAIL LOG: [FAILURE] {error_msg}")
        print("="*50 + "\n")
        logger.error(error_msg)
        return False, error_msg
