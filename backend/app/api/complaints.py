from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from app.core.database import get_db
from app.models.models import Complaint, ComplaintStatus
import uuid

router = APIRouter(prefix="/api/complaints", tags=["complaints"])

# What the frontend sends us
class ComplaintCreate(BaseModel):
    category: str
    description: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    image_url: Optional[str] = None

# What we send back
class ComplaintResponse(BaseModel):
    id: str
    category: str
    description: str
    latitude: Optional[float]
    longitude: Optional[float]
    status: str
    created_at: str

    class Config:
        from_attributes = True

@router.post("/", response_model=dict)
def create_complaint(complaint: ComplaintCreate, db: Session = Depends(get_db)):
    db_complaint = Complaint(
        category=complaint.category,
        description=complaint.description,
        latitude=complaint.latitude,
        longitude=complaint.longitude,
        image_url=complaint.image_url,
    )
    db.add(db_complaint)
    db.commit()
    db.refresh(db_complaint)
    return {
        "id": str(db_complaint.id),
        "message": "Complaint submitted successfully",
        "status": db_complaint.status.value
    }

@router.get("/", response_model=List[dict])
def get_complaints(db: Session = Depends(get_db)):
    complaints = db.query(Complaint).order_by(Complaint.created_at.desc()).all()
    return [
        {
            "id": str(c.id),
            "category": c.category,
            "description": c.description,
            "latitude": c.latitude,
            "longitude": c.longitude,
            "status": c.status.value,
            "created_at": str(c.created_at)
        }
        for c in complaints
    ]

@router.get("/{complaint_id}", response_model=dict)
def get_complaint(complaint_id: str, db: Session = Depends(get_db)):
    complaint = db.query(Complaint).filter(
        Complaint.id == uuid.UUID(complaint_id)
    ).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return {
        "id": str(complaint.id),
        "category": complaint.category,
        "description": complaint.description,
        "latitude": complaint.latitude,
        "longitude": complaint.longitude,
        "status": complaint.status.value,
        "created_at": str(complaint.created_at)
    }

@router.patch("/{complaint_id}/status", response_model=dict)
def update_status(complaint_id: str, status: str, db: Session = Depends(get_db)):
    complaint = db.query(Complaint).filter(
        Complaint.id == uuid.UUID(complaint_id)
    ).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    complaint.status = ComplaintStatus(status)
    db.commit()
    return {"message": "Status updated", "status": status}