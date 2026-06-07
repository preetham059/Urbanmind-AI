'use client'
import { useState } from 'react'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Detection {
  bbox: number[]
  confidence: number
  class: string
}

interface Result {
  id: string
  filename: string
  total_detected: number
  detections: Detection[]
  severity: {
    score: number
    level: string
    priority: string
  }
  message: string
}

const severityColor: Record<string, string> = {
  none: 'text-gray-400',
  low: 'text-green-400',
  medium: 'text-yellow-400',
  high: 'text-orange-400',
  critical: 'text-red-400',
}

const severityBg: Record<string, string> = {
  none: 'bg-gray-800',
  low: 'bg-green-900/30 border border-green-700',
  medium: 'bg-yellow-900/30 border border-yellow-700',
  high: 'bg-orange-900/30 border border-orange-700',
  critical: 'bg-red-900/30 border border-red-700',
}

export default function DetectPage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return
    setFile(selected)
    setResult(null)
    setError(null)
    const reader = new FileReader()
    reader.onloadend = () => setPreview(reader.result as string)
    reader.readAsDataURL(selected)
  }

  const handleDetect = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await axios.post(`${API}/api/detect/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setResult(res.data)
    } catch (e) {
      setError('Detection failed. Make sure backend is running.')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <h1 className="text-3xl font-bold text-blue-400 mb-2">Pothole Detection</h1>
      <p className="text-gray-400 mb-8">Upload a road image to detect potholes using AI</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl">
        <div>
          <div className="bg-gray-800 rounded-2xl p-6 mb-4">
            <h2 className="text-lg font-semibold mb-4">Upload Road Image</h2>
            <label className="block w-full cursor-pointer">
              <div className="border-2 border-dashed border-gray-600 hover:border-blue-500 rounded-xl p-8 text-center transition">
                {preview ? (
                  <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-lg object-contain" />
                ) : (
                  <div>
                    <p className="text-4xl mb-3">🛣️</p>
                    <p className="text-gray-400">Click to upload a road image</p>
                    <p className="text-gray-600 text-sm mt-1">JPG, PNG up to 10MB</p>
                  </div>
                )}
              </div>
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
            {file && <p className="text-gray-400 text-sm mt-2 text-center">📎 {file.name}</p>}
          </div>

          <button
            onClick={handleDetect}
            disabled={!file || loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl p-4 font-semibold text-lg transition"
          >
            {loading ? '🔍 Analyzing...' : '🚀 Detect Potholes'}
          </button>

          {error && <p className="text-red-400 text-sm mt-3 text-center">{error}</p>}
        </div>

        <div>
          {!result && !loading && (
            <div className="bg-gray-800 rounded-2xl p-6 h-full flex items-center justify-center">
              <p className="text-gray-500 text-center">Upload an image and click Detect to see results</p>
            </div>
          )}

          {loading && (
            <div className="bg-gray-800 rounded-2xl p-6 h-full flex items-center justify-center">
              <div className="text-center">
                <p className="text-4xl mb-4 animate-pulse">🔍</p>
                <p className="text-gray-400">AI is analyzing the image...</p>
              </div>
            </div>
          )}

          {result && (
            <div className="flex flex-col gap-4">
              <div className={`rounded-2xl p-6 ${severityBg[result.severity.level]}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-400 text-sm">Severity Level</p>
                    <p className={`text-3xl font-bold mt-1 ${severityColor[result.severity.level]}`}>
                      {result.severity.level.toUpperCase()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-sm">Score</p>
                    <p className="text-2xl font-bold text-white">{(result.severity.score * 100).toFixed(0)}%</p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="bg-gray-700 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${result.severity.score * 100}%` }} />
                  </div>
                </div>
                <p className="text-gray-300 text-sm mt-3">
                  🔧 Action: <span className="font-semibold">{result.severity.priority.replace(/_/g, ' ').toUpperCase()}</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-800 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-blue-400">{result.total_detected}</p>
                  <p className="text-gray-400 text-sm mt-1">Potholes Found</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-green-400">
                    {result.detections.length > 0 ? `${(result.detections[0].confidence * 100).toFixed(0)}%` : 'N/A'}
                  </p>
                  <p className="text-gray-400 text-sm mt-1">Confidence</p>
                </div>
              </div>

              {result.detections.length > 0 && (
                <div className="bg-gray-800 rounded-2xl p-4">
                  <h3 className="text-sm font-semibold text-gray-400 mb-3">DETECTED REGIONS</h3>
                  {result.detections.map((det, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0">
                      <span className="text-sm text-gray-300">Pothole #{i + 1}</span>
                      <span className="text-sm font-semibold text-green-400">{(det.confidence * 100).toFixed(1)}% confident</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-gray-800 rounded-xl p-4">
                <p className="text-gray-300 text-sm">💡 {result.message}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}