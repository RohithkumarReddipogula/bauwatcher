cat > main.py << 'EOF'
from fastapi import FastAPI
import httpx

app = FastAPI(title="BauWatcher", version="1.0.0")

@app.get("/")
def root():
    return {"app": "BauWatcher", "status": "live"}

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.get("/api/test")
def test():
    response = httpx.get("https://autobahn.api.bund.dev/v1/services/roadworks/A1")
    return response.json()
EOF



