from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_db
from app.models.models import TrafficPrediction, SeverityLevel
from app.ml.traffic_predictor import predictor
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/traffic", tags=["traffic"])

class ForecastRequest(BaseModel):
    zone: str
    temperature: float = 28.0
    rainfall: float = 0.0
    humidity: float = 60.0
    is_holiday: int = 0

@router.post("/forecast")
def get_forecast(request: ForecastRequest, db: Session = Depends(get_db)):
    predictions = predictor.predict(
        zone=request.zone,
        temperature=request.temperature,
        rainfall=request.rainfall,
        humidity=request.humidity,
        is_holiday=request.is_holiday
    )

    # Save to database
    for pred in predictions:
        level = pred['congestion_level']
        if level not in ['low', 'medium', 'high', 'critical']:
            level = 'low'

        db_pred = TrafficPrediction(
            zone_name=request.zone,
            congestion_level=SeverityLevel(level),
            confidence=pred['confidence'],
            weather_condition=f"temp:{request.temperature},rain:{request.rainfall}",
            forecast_for=datetime.now() + timedelta(hours=predictions.index(pred))
        )
        db.add(db_pred)

    db.commit()

    return {
        "zone": request.zone,
        "weather": {
            "temperature": request.temperature,
            "rainfall": request.rainfall,
            "humidity": request.humidity
        },
        "forecast": predictions,
        "generated_at": datetime.now().isoformat()
    }

@router.get("/zones")
def get_zones():
    return {
        "zones": [
            "MG Road",
            "Whitefield",
            "Electronic City",
            "Koramangala",
            "Hebbal"
        ]
    }

@router.get("/history")
def get_history(db: Session = Depends(get_db)):
    records = db.query(TrafficPrediction)\
        .order_by(TrafficPrediction.created_at.desc())\
        .limit(50).all()

    return [
        {
            "id": str(r.id),
            "zone": r.zone_name,
            "congestion_level": r.congestion_level.value,
            "confidence": r.confidence,
            "forecast_for": str(r.forecast_for),
            "created_at": str(r.created_at)
        }
        for r in records
    ]