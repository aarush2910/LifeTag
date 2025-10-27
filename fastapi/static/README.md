Static assets directory

Purpose:
- Store static files (images, icons, CSS, etc.) that the backend should serve directly.
- Files placed into `static/images/` are available at `/static/images/<filename>` once the FastAPI app is running.

Examples:
- Put `logo.png` into `fastapi/static/images/logo.png` and access it at `http://localhost:8000/static/images/logo.png`.

Notes:
- Do NOT store secrets or private keys here.
- For uploaded user files, use the `uploads/` folder (already present in the project).
- Add only non-sensitive, public assets to this folder.
