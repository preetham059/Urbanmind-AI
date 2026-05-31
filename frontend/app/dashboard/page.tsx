'use client'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Link from 'next/link'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalComplaints: 0,
    pendingComplaints: 0,
    totalPotholes: 0,
    criticalPotholes: 0,
  })
  const [complaints, setComplaints] = useState<any[]>([])
  const [potholes, setPotholes] = useState<any[]>([])
  const [dbStatus, setDbStatus] = useState('checking...')

  useEffect(() => {
    const load = async () => {
      try {
        const [health, comp, poth] = await Promise.all([
          axios.get('http://localhost:8000/health'),
          axios.get('http://localhost:8000/api/complaints/'),
          axios.get('http://localhost:8000/api/detect/history'),
        ])
        setDbStatus(health.data.database)
        setComplaints(comp.data)
        setPotholes(poth.data)
        setStats({
          totalComplaints: comp.data.length,
          pendingComplaints: comp.data.filter((c: any) => c.status === 'pending').length,
          totalPotholes: poth.data.length,
          criticalPotholes: poth.data.filter((p: any) => p.severity_level === 'critical').length,
        })
      } catch (e) {
        setDbStatus('error')
      }
    }
    load()
  }, [])

  // Chart data — complaints by category
  const categoryCount: Record<string, number> = {}
  complaints.forEach((c: any) => {
    categoryCount[c.category] = (categoryCount[c.category] || 0) + 1
  })
  const chartData = Object.entries(categoryCount).map(([cat, count]) => ({
    category: cat.replace('_', ' '),
    count,
  }))

  // Severity distribution
  const severityCount: Record<string, number> = {}
  potholes.forEach((p: any) => {
    severityCount[p.severity_level] = (severityCount[p.severity_level] || 0) + 1
  })
  const severityData = Object.entries(severityCount).map(([level, count]) => ({
    level,
    count,
  }))

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-blue-400">Dashboard</h1>
          <p className="text-gray-400 mt-1">City infrastructure overview</p>
        </div>
        <div className={`text-sm px-3 py-1 rounded-full ${
          dbStatus === 'connected'
            ? 'bg-green-900/50 text-green-400'
            : 'bg-red-900/50 text-red-400'
        }`}>
          ● {dbStatus === 'connected' ? 'System Online' : 'System Offline'}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Complaints', value: stats.totalComplaints, color: 'text-blue-400', icon: '📋' },
          { label: 'Pending Action', value: stats.pendingComplaints, color: 'text-yellow-400', icon: '⏳' },
          { label: 'Potholes Detected', value: stats.totalPotholes, color: 'text-purple-400', icon: '🕳️' },
          { label: 'Critical Potholes', value: stats.criticalPotholes, color: 'text-red-400', icon: '🚨' },
        ].map((stat, i) => (
          <div key={i} className="bg-gray-800 rounded-2xl p-5">
            <p className="text-2xl mb-2">{stat.icon}</p>
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-gray-400 text-sm mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-800 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-4">COMPLAINTS BY CATEGORY</h3>
          {chartData.length === 0 ? (
            <p className="text-gray-500 text-sm">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="category" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 8 }}
                />
                <Bar dataKey="count" fill="#60a5fa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-gray-800 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-4">POTHOLE SEVERITY DISTRIBUTION</h3>
          {severityData.length === 0 ? (
            <p className="text-gray-500 text-sm">No detections yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={severityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="level" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 8 }}
                />
                <Bar dataKey="count" fill="#a78bfa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[
          { href: '/detect', label: 'Detect Potholes', desc: 'Upload road image for AI analysis', icon: '🕳️', color: 'bg-purple-900/30 border border-purple-700' },
          { href: '/complaints', label: 'View Complaints', desc: 'Manage citizen reports', icon: '📋', color: 'bg-blue-900/30 border border-blue-700' },
          { href: '/traffic', label: 'Traffic Forecast', desc: 'Predict congestion patterns', icon: '🚦', color: 'bg-green-900/30 border border-green-700' },
        ].map((action, i) => (
          <Link key={i} href={action.href}>
            <div className={`rounded-2xl p-5 cursor-pointer hover:opacity-80 transition ${action.color}`}>
              <p className="text-3xl mb-3">{action.icon}</p>
              <p className="font-semibold">{action.label}</p>
              <p className="text-gray-400 text-sm mt-1">{action.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}