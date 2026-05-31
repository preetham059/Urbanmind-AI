from sqlalchemy import Column, String, Float, DateTime, Text, Enum
from sqlalchemy.dialects.postgresql import UUID
from geoalchemy2 import Geometry
import uuid
import enum
from datetime import datetime
from app.core.database import Base

class SeverityLevel(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"

class ComplaintStatus(str, enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    resolved = "resolved"

class Pothole(Base):
    __tablename__ = "potholes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    image_url = Column(String, nullable=True)
    severity_score = Column(Float, nullable=False)  # 0.0 to 1.0
    severity_level = Column(Enum(SeverityLevel), nullable=False)
    bbox_json = Column(Text, nullable=True)          # bounding box from YOLO
    location = Column(Geometry("POINT", srid=4326), nullable=True)
    repair_priority = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category = Column(String, nullable=False)        # pothole, garbage, streetlight etc
    description = Column(Text, nullable=False)
    location = Column(Geometry("POINT", srid=4326), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    image_url = Column(String, nullable=True)
    status = Column(Enum(ComplaintStatus), default=ComplaintStatus.pending)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class TrafficPrediction(Base):
    __tablename__ = "traffic_predictions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    zone_name = Column(String, nullable=False)
    congestion_level = Column(Enum(SeverityLevel), nullable=False)
    confidence = Column(Float, nullable=False)
    weather_condition = Column(String, nullable=True)
    forecast_for = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)