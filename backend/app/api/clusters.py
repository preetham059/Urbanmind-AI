from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Complaint
from sklearn.cluster import DBSCAN
from scipy.spatial import ConvexHull
import numpy as np

router = APIRouter(prefix="/api/clusters", tags=["clusters"])

@router.get("/potholes")
def get_pothole_clusters(db: Session = Depends(get_db)):

    points = [
        {"lat": 12.9716, "lng": 77.5946, "severity": "high"},
        {"lat": 12.9720, "lng": 77.5950, "severity": "medium"},
        {"lat": 12.9718, "lng": 77.5942, "severity": "high"},
        {"lat": 12.9722, "lng": 77.5948, "severity": "critical"},
        {"lat": 12.9715, "lng": 77.5955, "severity": "medium"},
        {"lat": 12.9350, "lng": 77.6245, "severity": "high"},
        {"lat": 12.9355, "lng": 77.6250, "severity": "high"},
        {"lat": 12.9348, "lng": 77.6242, "severity": "medium"},
        {"lat": 12.9360, "lng": 77.6248, "severity": "critical"},
        {"lat": 12.9580, "lng": 77.6478, "severity": "medium"},
        {"lat": 12.9585, "lng": 77.6482, "severity": "low"},
        {"lat": 12.9578, "lng": 77.6475, "severity": "medium"},
        {"lat": 12.9210, "lng": 77.6782, "severity": "critical"},
        {"lat": 12.9215, "lng": 77.6788, "severity": "high"},
        {"lat": 12.9208, "lng": 77.6780, "severity": "high"},
    ]

    coords = np.array([[p["lat"], p["lng"]] for p in points])

    db_scan = DBSCAN(eps=0.005, min_samples=2, metric='euclidean')
    labels = db_scan.fit_predict(coords)

    clusters = {}
    for idx, label in enumerate(labels):
        if label == -1:
            continue
        if label not in clusters:
            clusters[label] = []
        clusters[label].append(points[idx])

    result = []
    for label, cluster_points in clusters.items():
        cluster_coords = np.array([[p["lat"], p["lng"]] for p in cluster_points])

        if len(cluster_coords) >= 3:
            try:
                hull = ConvexHull(cluster_coords)
                polygon = cluster_coords[hull.vertices].tolist()
                polygon.append(polygon[0])
            except Exception:
                polygon = cluster_coords.tolist()
        else:
            polygon = cluster_coords.tolist()

        severities = [p["severity"] for p in cluster_points]
        severity_score = {"critical": 4, "high": 3, "medium": 2, "low": 1}
        avg_score = sum(severity_score.get(s, 1) for s in severities) / len(severities)

        if avg_score >= 3.5:
            cluster_severity, color = "critical", "#ef4444"
        elif avg_score >= 2.5:
            cluster_severity, color = "high", "#f97316"
        elif avg_score >= 1.5:
            cluster_severity, color = "medium", "#eab308"
        else:
            cluster_severity, color = "low", "#22c55e"

        center_lat = float(np.mean(cluster_coords[:, 0]))
        center_lng = float(np.mean(cluster_coords[:, 1]))

        result.append({
            "cluster_id": int(label),
            "point_count": len(cluster_points),
            "severity": cluster_severity,
            "color": color,
            "center": {"lat": center_lat, "lng": center_lng},
            "polygon": [[p[0], p[1]] for p in polygon],
            "repair_recommendation": (
                "Immediate full resurfacing required" if cluster_severity == "critical" else
                "Schedule urgent repair within 7 days" if cluster_severity == "high" else
                "Plan repair within 30 days" if cluster_severity == "medium" else
                "Monitor and schedule routine maintenance"
            ),
            "estimated_cost": f"₹{len(cluster_points) * 45000:,}"
        })

    noise_points = [points[i] for i, l in enumerate(labels) if l == -1]

    return {
        "clusters": result,
        "total_clusters": len(result),
        "noise_points": noise_points,
        "total_points": len(points)
    }

@router.get("/complaints")
def get_complaint_clusters(db: Session = Depends(get_db)):
    complaints = db.query(Complaint).filter(
        Complaint.latitude != None,
        Complaint.longitude != None
    ).all()

    if len(complaints) < 3:
        return {
            "hotspots": [
                {"lat": 12.9716, "lng": 77.5946, "count": 5, "category": "pothole"},
                {"lat": 12.9350, "lng": 77.6245, "count": 3, "category": "garbage"},
                {"lat": 12.9580, "lng": 77.6478, "count": 4, "category": "streetlight"},
                {"lat": 12.9210, "lng": 77.6782, "count": 2, "category": "pothole"},
            ]
        }

    return {
        "hotspots": [
            {
                "lat": c.latitude,
                "lng": c.longitude,
                "count": 1,
                "category": c.category
            }
            for c in complaints
        ]
    }