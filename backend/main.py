from fastapi import FastAPI
import httpx

app = FastAPI(title="BauWatcher", version="1.0.0")

BASE_URL = "https://verkehr.autobahn.de/o/autobahn"

@app.get("/")
def root():
    return {"app": "BauWatcher", "status": "live"}

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.get("/api/roads")
def get_roads():
    r = httpx.get(f"{BASE_URL}/")
    return r.json()

@app.get("/api/roadworks/{road}")
def get_roadworks(road: str):
    r = httpx.get(f"{BASE_URL}/{road}/services/roadworks")
    if r.status_code == 204:
        return {"road": road, "roadworks": []}
    return r.json()
