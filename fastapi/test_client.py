from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

response = client.get("/api/auth/farmer-info?identifier=INAPH-F0049")
print("STATUS:", response.status_code)
print("BODY:", response.text)
