# UrbanMind AI 🏙️
### AI-Powered Smart City Infrastructure Platform

A full-stack intelligent urban management system built with computer vision, machine learning, and LLM integration for real-time city infrastructure monitoring.

## 🚀 Features

- 🕳️ **AI Pothole Detection** — YOLOv8 computer vision with 77%+ confidence
- 🚦 **Traffic Forecasting** — XGBoost ML model with 6-hour congestion prediction
- 🤖 **LLM City Assistant** — Ask questions about city data in natural language
- 📋 **Complaints Portal** — Citizen issue reporting with GPS tagging
- 📊 **Live Dashboard** — Real-time charts, stats, and infrastructure metrics

## 🧠 Tech Stack

### AI / ML
- YOLOv8 (Ultralytics) — Object detection for road damage
- XGBoost + Scikit-learn — Traffic congestion classification
- Llama 3.3 70B via Groq — Natural language city intelligence
- Roboflow — Pothole detection model with 14k+ training images

### Backend
- FastAPI (Python) — REST API with streaming SSE
- PostgreSQL + PostGIS — Geospatial database
- SQLAlchemy — ORM
- Docker — Containerized services

### Frontend
- Next.js 15 + TypeScript
- Tailwind CSS
- Recharts — Data visualization
- Leaflet.js — Interactive maps

## 📁 Project Structure

urbanmind-ai/
├── backend/
│   ├── app/
│   │   ├── api/          # REST endpoints
│   │   ├── ml/           # YOLOv8 + XGBoost models
│   │   ├── models/       # Database schemas
│   │   └── core/         # Config + DB connection
│   └── requirements.txt
├── frontend/
│   ├── app/              # Next.js pages
│   ├── components/       # Reusable UI
│   └── lib/              # API client
└── docker-compose.yml

## ⚙️ Setup

### 1. Start Database
docker-compose up -d

### 2. Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

### 3. Frontend
cd frontend
npm install
npm run dev

### 4. Environment Variables
Create backend/.env with:
DATABASE_URL=postgresql://urbanmind:urbanmind123@localhost:5432/urbanmind
ROBOFLOW_API_KEY=your_key
GROQ_API_KEY=your_key

## 🔌 API Endpoints

POST   /api/detect/           Upload image → pothole detection
GET    /api/detect/history    Detection history
POST   /api/traffic/forecast  6-hour congestion prediction
POST   /api/complaints/       Submit citizen complaint
GET    /api/complaints/       List all complaints
POST   /api/chat/             LLM chat with city data

## 🧪 Key AI Capabilities

### Pothole Detection
Upload any road image → YOLOv8 returns bounding boxes, severity score 0 to 1, and repair priority recommendation.

### Traffic Forecasting
Input zone plus weather conditions → XGBoost predicts congestion level for next 6 hours with confidence scores.

### LLM City Intelligence
Natural language interface over real PostgreSQL data. Ask which roads need urgent repair and get data-backed answers.

## 👨‍💻 Author
Built by Preetham — CS student passionate about AI and smart city technology.