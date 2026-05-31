import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report
import xgboost as xgb
import joblib
import os

MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "traffic_model.pkl")
ENCODER_PATH = os.path.join(os.path.dirname(__file__), "models", "label_encoder.pkl")

def generate_training_data(n_samples=5000):
    """
    Generate realistic synthetic traffic data for Bangalore.
    In a real project this comes from actual city sensors.
    """
    np.random.seed(42)

    hours = np.random.randint(0, 24, n_samples)
    days = np.random.randint(0, 7, n_samples)       # 0=Monday
    months = np.random.randint(1, 13, n_samples)
    temp = np.random.uniform(18, 42, n_samples)      # Celsius
    rainfall = np.random.uniform(0, 80, n_samples)   # mm
    humidity = np.random.uniform(30, 95, n_samples)  # %
    is_holiday = np.random.randint(0, 2, n_samples)

    zones = np.random.choice(
        ['MG Road', 'Whitefield', 'Electronic City', 'Koramangala', 'Hebbal'],
        n_samples
    )
    zone_encoded = pd.Categorical(zones).codes

    # Simulate realistic congestion rules
    congestion = []
    for i in range(n_samples):
        score = 0

        # Peak hours (8-10am, 5-8pm on weekdays)
        if days[i] < 5:
            if 8 <= hours[i] <= 10:
                score += 3
            elif 17 <= hours[i] <= 20:
                score += 3
            elif 11 <= hours[i] <= 16:
                score += 1

        # Weekend
        if days[i] >= 5:
            if 11 <= hours[i] <= 20:
                score += 1

        # Heavy rain increases congestion
        if rainfall[i] > 40:
            score += 2
        elif rainfall[i] > 20:
            score += 1

        # High temperature
        if temp[i] > 35:
            score += 1

        # Holidays reduce congestion
        if is_holiday[i]:
            score -= 1

        # Night time is clear
        if hours[i] < 6 or hours[i] > 22:
            score = max(0, score - 2)

        # Add noise
        score += np.random.randint(-1, 2)
        score = max(0, score)

        if score <= 1:
            congestion.append('low')
        elif score <= 3:
            congestion.append('medium')
        elif score <= 5:
            congestion.append('high')
        else:
            congestion.append('critical')

    df = pd.DataFrame({
        'hour': hours,
        'day_of_week': days,
        'month': months,
        'temperature': temp,
        'rainfall': rainfall,
        'humidity': humidity,
        'is_holiday': is_holiday,
        'zone': zone_encoded,
        'congestion': congestion
    })

    return df

def train_model():
    """Train XGBoost model and save to disk"""
    print("Generating training data...")
    df = generate_training_data(5000)

    X = df.drop('congestion', axis=1)
    y = df['congestion']

    le = LabelEncoder()
    y_encoded = le.fit_transform(y)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.2, random_state=42
    )

    print("Training XGBoost model...")
    model = xgb.XGBClassifier(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.1,
        random_state=42,
        eval_metric='mlogloss'
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    print("\nModel Performance:")
    print(classification_report(y_test, y_pred, target_names=le.classes_))

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    joblib.dump(le, ENCODER_PATH)
    print(f"\nModel saved to {MODEL_PATH}")

    return model, le

def load_model():
    """Load trained model from disk"""
    if not os.path.exists(MODEL_PATH):
        print("Model not found, training now...")
        return train_model()

    model = joblib.load(MODEL_PATH)
    le = joblib.load(ENCODER_PATH)
    return model, le

if __name__ == "__main__":
    train_model()