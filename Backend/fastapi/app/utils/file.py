import os
from fastapi import UploadFile, HTTPException
from app.core.config import settings
from datetime import datetime
from pathlib import Path
import uuid

ALLOWED_EXT = {"png", "jpg", "jpeg", "gif"}


def allowed_file(filename: str) -> bool:
    if not filename or "." not in filename:
        return False
    ext = filename.rsplit(".", 1)[1].lower()
    return ext in ALLOWED_EXT


async def save_upload_file(upload_file: UploadFile, folder: str = None) -> str:
    """
    Save an UploadFile to disk using a safe generated filename.
    - strips any path components from the provided filename
    - enforces allowed extensions
    - enforces maximum upload size from settings.MAX_UPLOAD_SIZE_MB
    - writes file in chunks to avoid loading large files wholly into memory
    Returns absolute path to saved file.
    """
    folder = folder or settings.UPLOAD_FOLDER
    Path(folder).mkdir(parents=True, exist_ok=True)

    original_name = Path(upload_file.filename).name
    if "." not in original_name:
        raise HTTPException(status_code=400, detail="Uploaded file has no extension")
    ext = original_name.rsplit(".", 1)[1].lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    unique = uuid.uuid4().hex
    safe_name = f"{timestamp}_{unique}.{ext}"
    path = os.path.join(folder, safe_name)

    max_mb = getattr(settings, "MAX_UPLOAD_SIZE_MB", 16)
    max_bytes = int(max_mb) * 1024 * 1024

    size = 0
    try:
        with open(path, "wb") as buffer:
            while True:
                chunk = await upload_file.read(1024 * 1024)  # 1MB
                if not chunk:
                    break
                size += len(chunk)
                if size > max_bytes:
                    buffer.close()
                    try:
                        os.remove(path)
                    except Exception:
                        pass
                    raise HTTPException(status_code=413, detail="Uploaded file is too large")
                buffer.write(chunk)
    finally:
        try:
            await upload_file.seek(0)
        except Exception:
            pass

    return path
