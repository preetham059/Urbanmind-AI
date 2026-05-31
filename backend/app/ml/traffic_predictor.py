import numpy as np
import pandas as pd
from datetime import datetime
from app.ml.traffic_model import load_model

ZONE_MAP = {
    'MG Road': 0,
    'Whitefield': 1,
    'Electronic City': 2,
    'Koramangala': 3,
    'Hebbal': 4
}

class TrafficPredictor:
    def __init__(self):
        self.model = None
        self.label_encoder = None

    def load(self):
        if self.model is None:
            self.model, self.label_encoder = load_model()

    def predict(self, zone: str, temperature: float,
                rainfall: float, humidity: float,
                is_holiday: int = 0,
                forecast_hours: int = 6) -> list:

        self.load()
        now = datetime.now()
        predictions = []

        for h in range(forecast_hours):
            future_hour = (now.hour + h) % 24
            future_day = now.weekday()

            zone_code = ZONE_MAP.get(zone, 0)

            features = pd.DataFrame([{
                'hour': future_hour,
                'day_of_week': future_day,
                'month': now.month,
                'temperature': temperature,
                'rainfall': rainfall,
                'humidity': humidity,
                'is_holiday': is_holiday,
                'zone': zone_code
            }])

            pred_encoded = self.model.predict(features)[0]
            proba = self.model.predict_proba(features)[0]
            confidence = float(max(proba))
            level = self.label_encoder.inverse_transform([pred_encoded])[0]

            predictions.append({
                'hour': future_hour,
                'congestion_level': level,
                'confidence': round(confidence, 3),
                'label': f"{future_hour:02d}:00"
            })

        return predictions

predictor = TrafficPredictor()