import urllib.request
import urllib.error
try:
    response = urllib.request.urlopen('http://127.0.0.1:8000/api/auth/farmer-info?identifier=INAPH-F0049')
    print(response.read().decode())
except urllib.error.HTTPError as e:
    print(e.read().decode())
except Exception as e:
    print(f"Error: {e}")
