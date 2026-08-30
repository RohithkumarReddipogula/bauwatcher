[![Live Demo](https://img.shields.io/badge/Live_Demo-BauWatcher-brightgreen?style=for-the-badge)](https://frontend-jet-kappa-25.vercel.app)

# BauWächter

A live map of every roadwork and construction disruption across Germany. Click any marker and get an AI-generated plain English summary of what is happening, how it affects drivers, and when it ends.

**Live:** https://frontend-jet-kappa-25.vercel.app  
**Backend API:** https://bauwatcher-production.up.railway.app/docs

---

## Why I built this

I was trying to plan a drive from Berlin to Munich and could not find a single place that showed me all the roadworks across Germany in one view. The official Autobahn app shows highway disruptions. City portals show local construction. But nothing combines them.

So I built BauWächter in 5 days.

---

## What it does

- Shows live roadworks across all German Autobahns on an interactive map
- Color-coded markers: red for road closures, yellow for disruptions
- Click any marker to get a 3-sentence AI summary explaining the impact
- Search by road name or location
- Filter by severity
- Data refreshes automatically from the official German government API

Right now it is tracking around 2900 active sites. That number changes every day.

---

## How it works

The data comes from the Autobahn GmbH des Bundes API at `verkehr.autobahn.de`. This is the official German federal highway authority. No API key required, which was a nice surprise. The API returns live roadwork data per road segment.

One thing I ran into: most documentation online points to `autobahn.api.bund.dev` as the base URL. That returns a 404. The actual working URL is `verkehr.autobahn.de/o/autobahn`. Took me an hour to figure that out.

The AI summaries use Groq's LLM API. I initially tried the Llama models but they had all been deprecated since the last time I used Groq. The current working model is `allam-2-7b`. The summaries take about 2 seconds to generate, which feels acceptable for the use case.

---

## Stack

**Backend**
- Python 3.11
- FastAPI with async endpoints
- Groq API for AI summaries
- Deployed on Railway.app

**Frontend**
- React 18
- Leaflet.js with react-leaflet for the map
- OpenStreetMap tiles (free, no key needed)
- Deployed on Vercel

---

## Running it locally

Clone the repo:

```bash
git clone https://github.com/RohithkumarReddipogula/bauwatcher.git
cd bauwatcher
```

Start the backend:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file in the backend folder:

```
GROQ_API_KEY=your_groq_key_here
```

Get a free Groq key at console.groq.com. Then:

```bash
uvicorn main:app --reload
```

Backend runs at `http://localhost:8000`. Open `http://localhost:8000/docs` to see the API.

Start the frontend:

```bash
cd ../frontend
npm install
npm start
```

Frontend runs at `http://localhost:3000`.

---

## API endpoints

| Endpoint | Description |
|---|---|
| GET /api/roads | List of all German Autobahns |
| GET /api/roadworks/{road} | Live roadworks for a specific road |
| POST /api/summary | Generate AI summary for a roadwork |
| GET /health | Health check |

---

## What I would add next

Push notifications when a major closure opens on a route you care about. Right now the data refreshes when you load the page but there is no alert system. That would require storing user preferences and integrating the Web Push API, which is the next thing I want to build.

I also want to add city-level construction data from InfraNode, which aggregates open data from 84 German cities. The Autobahn API only covers federal highways.

---

## Built by

Rohith Kumar Reddipogula  
MSc Data Science, University of Europe for Applied Sciences, Potsdam (2026)  
Berlin, Germany  
rohithkumar336699@gmail.com  
https://rohithkumarreddipogula.github.io
