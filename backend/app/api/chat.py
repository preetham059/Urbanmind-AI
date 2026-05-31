from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.database import get_db
from app.core.config import settings
from app.models.models import Complaint, Pothole, TrafficPrediction
import json

router = APIRouter(prefix="/api/chat", tags=["chat"])

def get_city_context(db: Session) -> str:
    complaints = db.query(Complaint).all()
    complaint_summary = f"Total complaints: {len(complaints)}\n"
    pending = [c for c in complaints if c.status.value == 'pending']
    complaint_summary += f"Pending complaints: {len(pending)}\n"
    categories = {}
    for c in complaints:
        categories[c.category] = categories.get(c.category, 0) + 1
    complaint_summary += f"Complaints by category: {json.dumps(categories)}\n"

    potholes = db.query(Pothole).all()
    pothole_summary = f"Total potholes detected: {len(potholes)}\n"
    severity_counts = {}
    for p in potholes:
        level = p.severity_level.value
        severity_counts[level] = severity_counts.get(level, 0) + 1
    pothole_summary += f"Potholes by severity: {json.dumps(severity_counts)}\n"
    critical = [p for p in potholes if p.severity_level.value == 'critical']
    high = [p for p in potholes if p.severity_level.value == 'high']
    pothole_summary += f"Critical potholes needing immediate action: {len(critical)}\n"
    pothole_summary += f"High priority potholes: {len(high)}\n"

    traffic = db.query(TrafficPrediction).order_by(
        TrafficPrediction.created_at.desc()
    ).limit(20).all()
    traffic_summary = f"Recent traffic predictions: {len(traffic)}\n"
    zone_congestion = {}
    for t in traffic:
        zone = t.zone_name
        level = t.congestion_level.value
        if zone not in zone_congestion:
            zone_congestion[zone] = []
        zone_congestion[zone].append(level)
    traffic_summary += f"Zone congestion levels: {json.dumps(zone_congestion)}\n"

    return f"""
URBANMIND AI - CITY DATA CONTEXT
==================================
COMPLAINTS DATA:
{complaint_summary}
POTHOLE DETECTION DATA:
{pothole_summary}
TRAFFIC PREDICTION DATA:
{traffic_summary}
==================================
"""

class ChatRequest(BaseModel):
    message: str
    history: list = []

@router.post("/")
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
    city_context = get_city_context(db)

    system_prompt = f"""You are UrbanMind AI, an intelligent city infrastructure assistant for Bangalore, India.
You have access to real-time city data including complaints, pothole detections, and traffic predictions.

Here is the current city data:
{city_context}

Answer questions about the city infrastructure clearly and helpfully.
Give specific numbers and actionable recommendations based on the data.
Keep responses concise but informative.
If asked about something not in the data, say so honestly."""

    messages = []
    for h in request.history[-6:]:
        messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": request.message})

    async def generate():
        from groq import Groq
        client = Groq(api_key=settings.GROQ_API_KEY)

        all_messages = [{"role": "system", "content": system_prompt}] + messages

        stream = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=all_messages,
            max_tokens=1024,
            stream=True
        )

        for chunk in stream:
            text = chunk.choices[0].delta.content
            if text:
                yield f"data: {json.dumps({'text': text})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")