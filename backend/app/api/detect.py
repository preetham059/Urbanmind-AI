from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Pothole, SeverityLevel
from app.ml.pothole_detector import detector
import json

router = APIRouter(prefix="/api/detect", tags=["detection"])

@router.post("/")
async def detect_pothole(
    file: UploadFile = File(...),
    latitude: float = None,
    longitude: float = None,
    db: Session = Depends(get_db)
):
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Read image bytes
    image_bytes = await file.read()

    if len(image_bytes) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=400, detail="Image too large (max 10MB)")

    try:
        # Run YOLOv8 detection
        result = detector.detect(image_bytes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")

    severity = result["severity"]

    # Skip saving if nothing detected
    if result["total_detected"] > 0:
        db_pothole = Pothole(
            severity_score=severity["score"],
            severity_level=SeverityLevel(severity["level"]) if severity["level"] != "none" else SeverityLevel.low,
            bbox_json=json.dumps(result["detections"]),
            repair_priority=severity["priority"],
        )
        db.add(db_pothole)
        db.commit()
        db.refresh(db_pothole)
        record_id = str(db_pothole.id)
    else:
        record_id = None

    return {
        "id": record_id,
        "filename": file.filename,
        "total_detected": result["total_detected"],
        "detections": result["detections"],
        "severity": severity,
        "message": (
            f"Found {result['total_detected']} pothole(s). Severity: {severity['level'].upper()}"
            if result["total_detected"] > 0
            else "No potholes detected in this image"
        )
    }

@router.get("/history")
def get_detection_history(db: Session = Depends(get_db)):
    potholes = db.query(Pothole).order_by(Pothole.created_at.desc()).limit(20).all()
    return [
        {
            "id": str(p.id),
            "severity_score": p.severity_score,
            "severity_level": p.severity_level.value,
            "repair_priority": p.repair_priority,
            "created_at": str(p.created_at)
        }
        for p in potholes
    ]