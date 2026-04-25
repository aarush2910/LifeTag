import sys, traceback
sys.path.insert(0, '.')
try:
    import app.main
    print("SUCCESS: app.main imported OK")
except Exception as e:
    traceback.print_exc()
