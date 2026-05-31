'use client'
import { useState, useEffect } from 'react'
import { submitComplaint, getComplaints } from '@/lib/api'

const CATEGORIES = ['pothole', 'garbage', 'streetlight', 'water_leakage', 'traffic']

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    category: 'pothole',
    description: '',
    latitude: '',
    longitude: '',
  })

  const fetchComplaints = async () => {
    try {
      const data = await getComplaints()
      setComplaints(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchComplaints()
  }, [])

  const handleSubmit = async () => {
    if (!form.description) return
    setLoading(true)
    try {
      await submitComplaint({
        ...form,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
      })
      setSuccess(true)
      setForm({ category: 'pothole', description: '', latitude: '', longitude: '' })
      fetchComplaints()
      setTimeout(() => setSuccess(false), 3000)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const statusColor: any = {
    pending: 'text-yellow-400',
    in_progress: 'text-blue-400',
    resolved: 'text-green-400',
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <h1 className="text-3xl font-bold text-blue-400 mb-2">Complaint Portal</h1>
      <p className="text-gray-400 mb-8">Report infrastructure issues in your area</p>

      {/* FORM */}
      <div className="bg-gray-800 rounded-2xl p-6 mb-10 max-w-xl">
        <h2 className="text-lg font-semibold mb-4">Submit a Complaint</h2>

        <div className="mb-4">
          <label className="text-sm text-gray-400 mb-1 block">Category</label>
          <select
            className="w-full bg-gray-700 rounded-lg p-3 text-white"
            value={form.category}
            onChange={e => setForm({ ...form, category: e.target.value })}
          >
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c.replace('_', ' ').toUpperCase()}</option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="text-sm text-gray-400 mb-1 block">Description</label>
          <textarea
            className="w-full bg-gray-700 rounded-lg p-3 text-white h-24 resize-none"
            placeholder="Describe the issue..."
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Latitude</label>
            <input
              className="w-full bg-gray-700 rounded-lg p-3 text-white"
              placeholder="12.9716"
              value={form.latitude}
              onChange={e => setForm({ ...form, latitude: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Longitude</label>
            <input
              className="w-full bg-gray-700 rounded-lg p-3 text-white"
              placeholder="77.5946"
              value={form.longitude}
              onChange={e => setForm({ ...form, longitude: e.target.value })}
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !form.description}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 rounded-lg p-3 font-semibold transition"
        >
          {loading ? 'Submitting...' : 'Submit Complaint'}
        </button>

        {success && (
          <p className="text-green-400 text-sm mt-3 text-center">
            ✅ Complaint submitted successfully!
          </p>
        )}
      </div>

      {/* COMPLAINTS LIST */}
      <div className="max-w-3xl">
        <h2 className="text-lg font-semibold mb-4">
          All Complaints
          <span className="text-gray-400 font-normal text-sm ml-2">
            ({complaints.length} total)
          </span>
        </h2>

        {complaints.length === 0 ? (
          <p className="text-gray-500">No complaints yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {complaints.map(c => (
              <div key={c.id} className="bg-gray-800 rounded-xl p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="bg-gray-700 text-xs px-2 py-1 rounded-full mr-2">
                      {c.category.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className={`text-xs font-semibold ${statusColor[c.status]}`}>
                      {c.status.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-gray-500 text-xs">
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-300 mt-2 text-sm">{c.description}</p>
                {c.latitude && (
                  <p className="text-gray-500 text-xs mt-1">
                    📍 {c.latitude}, {c.longitude}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}