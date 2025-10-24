import aiosmtplib
from email.message import EmailMessage
from app.core.config import settings

async def send_email(subject: str, to_email: str, body: str, is_html: bool = False):
    msg = EmailMessage()
    msg["From"] = settings.MAIL_USERNAME
    msg["To"] = to_email
    msg["Subject"] = subject
    if is_html:
        msg.set_content("This email requires an HTML-compatible email client.")
        msg.add_alternative(body, subtype="html")
    else:
        msg.set_content(body)

    try:
        await aiosmtplib.send(
            msg,
            hostname=settings.MAIL_SERVER,
            port=settings.MAIL_PORT,
            username=settings.MAIL_USERNAME,
            password=settings.MAIL_PASSWORD,
            use_tls=settings.MAIL_USE_SSL,
            start_tls=settings.MAIL_USE_TLS
        )
    except Exception as e:
        print(f"Mail sending failed: {e}")
