'use client'
import { useState } from 'react'
import axios from 'axios'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const ZONES = ['MG Road', 'Whitefield', 'Electronic City', 'Koramangala', 'Hebbal']

const levelColor: Record<string, string> = {
  low: '#4ade80',
  medium: '#facc15',
  high: '#fb923c',
  critical: '#f87171',
}

const levelScore: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
}

export default function TrafficPage() {
  const [zone, setZone] = useState('MG Road')
  const [temperature, setTemperature] = useState('28')
  const [rainfall, setRainfall] = useState('0')
  const [humidity, setHumidity] = useState('60')
  const [isHoliday, setIsHoliday] = useState(false)
  const [forecast, setForecast] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [weather, setWeather] = useState<any>(null)

  const handleForecast = async () => {
    setLoading(true)
    try {
      const res = await axios.post(`${API}/api/traffic/forecast`, {
        zone,
        temperature: parseFloat(temperature),
        rainfall: parseFloat(rainfall),
        humidity: parseFloat(humidity),
        is_holiday: isHoliday ? 1 : 0,
      })
      setForecast(res.data.forecast)
      setWeather(res.data.weather)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const chartData = forecast.map(f => ({
    time: f.label,
    score: levelScore[f.congestion_level],
    level: f.congestion_level,
    confidence: Math.round(f.confidence * 100),
  }))

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <h1 className="text-3xl font-bold text-blue-400 mb-2">Traffic Forecast</h1>
      <p className="text-gray-400 mb-8">AI-powered 6-hour congestion prediction</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl">
        <div className="bg-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Forecast Parameters</h2>

          <div className="mb-4">
            <label className="text-sm text-gray-400 mb-1 block">Zone</label>
            <select
              className="w-full bg-gray-700 rounded-lg p-3 text-white"
              value={zone}
              onChange={e => setZone(e.target.value)}
            >
              {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>

          <div className="mb-4">
            <label className="text-sm text-gray-400 mb-1 block">Temperature: {temperature}°C</label>
            <input type="range" min="15" max="45" value={temperature}
              onChange={e => setTemperature(e.target.value)}
              className="w-full accent-blue-500" />
          </div>

          <div className="mb-4">
            <label className="text-sm text-gray-400 mb-1 block">Rainfall: {rainfall}mm</label>
            <input type="range" min="0" max="80" value={rainfall}
              onChange={e => setRainfall(e.target.value)}
              className="w-full accent-blue-500" />
          </div>

          <div className="mb-4">
            <label className="text-sm text-gray-400 mb-1 block">Humidity: {humidity}%</label>
            <input type="range" min="30" max="95" value={humidity}
              onChange={e => setHumidity(e.target.value)}
              className="w-full accent-blue-500" />
          </div>

          <div className="mb-6 flex items-center gap-3">
            <input type="checkbox" id="holiday" checked={isHoliday}
              onChange={e => setIsHoliday(e.target.checked)}
              className="w-4 h-4 accent-blue-500" />
            <label htmlFor="holiday" className="text-sm text-gray-400">Public Holiday</label>
          </div>

          <button
            onClick={handleForecast}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 rounded-xl p-3 font-semibold transition"
          >
            {loading ? 'Predicting...' : '🔮 Generate Forecast'}
          </button>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-4">
          {forecast.length === 0 ? (
            <div className="bg-gray-800 rounded-2xl p-6 flex items-center justify-center h-64">
              <p className="text-gray-500">Set parameters and generate a forecast</p>
            </div>
          ) : (
            <>
              <div className="bg-gray-800 rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-gray-400 mb-4">
                  6-HOUR CONGESTION FORECAST — {zone.toUpperCase()}
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="time" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} domain={[0, 4]}
                      tickFormatter={v => ['', 'Low', 'Med', 'High', 'Crit'][v] || ''} />
                    <Tooltip
                      contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 8 }}
                      formatter={(val: any) => [val, 'Score']}
                    />
                    <Line type="monotone" dataKey="score" stroke="#60a5fa"
                      strokeWidth={2} dot={{ fill: '#60a5fa', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {forecast.map((f, i) => (
                  <div key={i} className="bg-gray-800 rounded-xl p-4 text-center">
                    <p className="text-gray-400 text-xs mb-1">{f.label}</p>
                    <p className="text-lg font-bold" style={{ color: levelColor[f.congestion_level] }}>
                      {f.congestion_level.toUpperCase()}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">{Math.round(f.confidence * 100)}% confident</p>
                  </div>
                ))}
              </div>

              {weather && (
                <div className="bg-gray-800 rounded-xl p-4 flex gap-6">
                  <div className="text-center">
                    <p className="text-gray-500 text-xs">Temperature</p>
                    <p className="text-white font-semibold">{weather.temperature}°C</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-500 text-xs">Rainfall</p>
                    <p className="text-white font-semibold">{weather.rainfall}mm</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-500 text-xs">Humidity</p>
                    <p className="text-white font-semibold">{weather.humidity}%</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  )
}