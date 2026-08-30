from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os
import re
import asyncio
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

app = FastAPI(title="BauWatcher", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_URL = "https://verkehr.autobahn.de/o/autobahn"
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

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
        return {"roadworks": []}
    data = r.json()
    items = data.get("roadworks", [])
    result = []
    for item in items:
        coord = item.get("coordinate", {})
        if coord:
            result.append({
                "identifier": item.get("identifier", ""),
                "title": item.get("title", ""),
                "road": road,
                "isBlocked": item.get("isBlocked", "false"),
                "startTimestamp": item.get("startTimestamp", ""),
                "coordinate": coord,
            })
    return {"roadworks": result}

@app.get("/api/all")
async def get_all_roadworks():
    roads_resp = httpx.get(f"{BASE_URL}/")
    roads = roads_resp.json().get("roads", [])
    async def fetch_road(road):
        try:
            async with httpx.AsyncClient(timeout=10) as c:
                r = await c.get(f"{BASE_URL}/{road}/services/roadworks")
                if r.status_code == 204:
                    return []
                data = r.json()
                items = data.get("roadworks", [])
                result = []
                for item in items:
                    coord = item.get("coordinate", {})
                    if coord:
                        result.append({
                            "identifier": item.get("identifier", ""),
                            "title": item.get("title", ""),
                            "road": road,
                            "isBlocked": item.get("isBlocked", "false"),
                            "startTimestamp": item.get("startTimestamp", ""),
                            "coordinate": coord,
                        })
                return result
        except:
            return []
    tasks = [fetch_road(road) for road in roads]
    results = await asyncio.gather(*tasks)
    all_roadworks = []
    for r in results:
        all_roadworks.extend(r)
    return {"roadworks": all_roadworks, "total": len(all_roadworks)}

@app.post("/api/summary")
def get_summary(data: dict):
    prompt = f"You are BauWatcher. Roadwork: {data.get('title')} on {data.get('road')}. Write 3 short sentences in English: what is happening, how it affects drivers, when it ends."
    response = client.chat.completions.create(
        model="allam-2-7b",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=150,
    )
    text = response.choices[0].message.content
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()
    return {"summary": text}
