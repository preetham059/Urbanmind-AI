from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db, engine, Base
from app.models.models import Pothole, Complaint, TrafficPrediction
from app.api.complaints import router as complaints_router
from app.api.detect import router as detect_router
from app.api.traffic import router as traffic_router
from app.api.chat import router as chat_router
from app.api.clusters import router as clusters_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="UrbanMind AI",
    description="Smart city infrastructure intelligence platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(complaints_router)
app.include_router(detect_router)
app.include_router(traffic_router)
app.include_router(chat_router)
app.include_router(clusters_router)

@app.get("/")
def root():
    return {"message": "UrbanMind AI is running", "status": "ok"}

@app.get("/health")
def health(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"status": "healthy", "database": "connected"}