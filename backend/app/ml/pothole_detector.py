from app.core.config import settings
import requests
import base64


class PotholeDetector:
    def __init__(self):
        self.api_key = settings.ROBOFLOW_API_KEY
        self.model_id = "pothole-detection-2-zvaru/6"

    def calculate_severity(self, detections, image_width, image_height):
        if not detections:
            return {"score": 0.0, "level": "none", "priority": "none"}

        total_area = 0
        image_area = image_width * image_height
        max_confidence = 0

        for det in detections:
            area = det["width"] * det["height"]
            total_area += area
            max_confidence = max(max_confidence, det["confidence"])

        coverage = total_area / image_area
        score = min(1.0, (coverage * 0.6) + (max_confidence * 0.4))

        if score < 0.2:
            level, priority = "low", "monitor"
        elif score < 0.45:
            level, priority = "medium", "schedule_repair"
        elif score < 0.7:
            level, priority = "high", "urgent_repair"
        else:
            level, priority = "critical", "immediate_action"

        return {"score": round(score, 3), "level": level, "priority": priority}

    def detect(self, image_bytes: bytes) -> dict:
        # Convert image to base64
        encoded = base64.b64encode(image_bytes).decode("utf-8")

        # Call Roboflow API
        url = f"https://detect.roboflow.com/{self.model_id}?api_key={self.api_key}"
        response = requests.post(
            url,
            data=encoded,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )

        if response.status_code != 200:
            raise Exception(f"Roboflow API error: {response.text}")

        result = response.json()
        detections = result.get("predictions", [])
        image_width = result.get("image", {}).get("width", 640)
        image_height = result.get("image", {}).get("height", 640)

        severity = self.calculate_severity(detections, image_width, image_height)

        formatted = [
            {
                "bbox": [
                    round(d["x"] - d["width"] / 2),
                    round(d["y"] - d["height"] / 2),
                    round(d["x"] + d["width"] / 2),
                    round(d["y"] + d["height"] / 2),
                ],
                "confidence": round(d["confidence"], 3),
                "class": d["class"]
            }
            for d in detections
        ]

        return {
            "detections": formatted,
            "total_detected": len(formatted),
            "severity": severity,
            "image_size": {"width": image_width, "height": image_height}
        }

detector = PotholeDetector()