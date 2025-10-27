import aiosmtplib
from email.message import EmailMessage
from app.core.config import settings
from pathlib import Path
import mimetypes


async def send_email(subject: str, to_email: str, body: str, is_html: bool = False):
    """Send an email. If is_html is True, this will attempt to embed
    the project's `static/images/logo.png` inline (CID) so it displays in
    HTML-capable email clients.
    """
    msg = EmailMessage()
    # Prefer a readable From header (Name <email>) if available
    from_header = settings.MAIL_USERNAME
    msg["From"] = from_header
    msg["To"] = to_email
    msg["Subject"] = subject

    if is_html:
        # Primary plain-text fallback
        msg.set_content("This email requires an HTML-compatible email client.")
        # Add the HTML body as an alternative
        msg.add_alternative(body, subtype="html")

        # Try to find the project's logo and attach it as a related part with a fixed CID.
        try:
            # fastapi/static/images/logo.png relative to this file: ..(services)->app->fastapi
            logo_path = Path(__file__).resolve().parents[2] / "static" / "images" / "logo.png"
            if logo_path.exists():
                mime_type, _ = mimetypes.guess_type(str(logo_path))
                if mime_type and mime_type.startswith("image/"):
                    maintype, subtype = mime_type.split("/", 1)
                else:
                    maintype, subtype = ("image", "png")

                with open(logo_path, "rb") as f:
                    img_data = f.read()

                # Use a stable CID that callers can reference in their HTML: cid:life_logo
                cid_name = "life_logo"
                # add_related attaches the image as a related MIME part to the HTML alternative
                msg.get_payload()[-1].add_related(img_data, maintype=maintype, subtype=subtype, cid=f"<{cid_name}>")
        except Exception:
            # don't fail sending if embedding the logo fails; log quietly
            print("Warning: failed to attach inline logo for email.")
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
            start_tls=settings.MAIL_USE_TLS,
        )
    except Exception as e:
        print(f"Mail sending failed: {e}")
