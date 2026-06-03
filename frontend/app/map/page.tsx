'use client'
import { useEffect, useState } from 'react'
import axios from 'axios'
import dynamic from 'next/dynamic'

const MapComponent = dynamic(() => import('@/components/maps/CityMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-900">
      <p className="text-gray-400">Loading map...</p>
    </div>
  )
})

export default function MapPage() {
  const [clusters, setClusters] = useState<any>(null)
  const [complaints, setComplaints] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeLayer, setActiveLayer] = useState({
    clusters: true,
    complaints: true,
    heatmap: true,
  })

  useEffect(() => {
    const load = async () => {
      try {
        const [c, comp] = await Promise.all([
          axios.get('http://localhost:8000/api/clusters/potholes'),
          axios.get('http://localhost:8000/api/clusters/complaints'),
        ])
        setClusters(c.data)
        setComplaints(comp.data)
      } catch (e) {
        console.error(e)
      }
      setLoading(false)
    }
    load()
  }, [])

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col">
      <div className="p-6 pb-4">
        <h1 className="text-3xl font-bold text-blue-400 mb-1">City Intelligence Map</h1>
        <p className="text-gray-400 text-sm">Live pothole clusters, complaint hotspots and damage corridors</p>
      </div>

      {/* Layer Controls */}
      <div className="px-6 pb-4 flex gap-4 flex-wrap">
        {[
          { key: 'clusters', label: 'DBSCAN Clusters', color: 'bg-orange-500' },
          { key: 'complaints', label: 'Complaint Hotspots', color: 'bg-blue-500' },
          { key: 'heatmap', label: 'Damage Heatmap', color: 'bg-red-500' },
        ].map(layer => (
          <button
            key={layer.key}
            onClick={() => setActiveLayer(prev => ({ ...prev, [layer.key]: !prev[layer.key as keyof typeof prev] }))}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${
              activeLayer[layer.key as keyof typeof activeLayer]
                ? 'bg-gray-700 text-white'
                : 'bg-gray-900 text-gray-500'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${activeLayer[layer.key as keyof typeof activeLayer] ? layer.color : 'bg-gray-600'}`} />
            {layer.label}
          </button>
        ))}
      </div>

      {/* Stats Bar */}
      {clusters && (
        <div className="px-6 pb-4 flex gap-4 flex-wrap">
          <div className="bg-gray-800 rounded-xl px-4 py-2 text-center">
            <p className="text-orange-400 font-bold text-lg">{clusters.total_clusters}</p>
            <p className="text-gray-400 text-xs">Damage Clusters</p>
          </div>
          <div className="bg-gray-800 rounded-xl px-4 py-2 text-center">
            <p className="text-red-400 font-bold text-lg">{clusters.total_points}</p>
            <p className="text-gray-400 text-xs">Total Potholes</p>
          </div>
          <div className="bg-gray-800 rounded-xl px-4 py-2 text-center">
            <p className="text-yellow-400 font-bold text-lg">
              {clusters.clusters?.filter((c: any) => c.severity === 'critical').length || 0}
            </p>
            <p className="text-gray-400 text-xs">Critical Clusters</p>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="px-6 pb-6" style={{ height: '500px' }}>
        <div className="w-full h-full rounded-2xl overflow-hidden">
          {loading ? (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <p className="text-gray-400">Loading city data...</p>
            </div>
          ) : (
            <MapComponent
              clusters={clusters}
              complaints={complaints}
              activeLayer={activeLayer}
            />
          )}
        </div>
      </div>

      {/* Cluster List */}
      {clusters && clusters.clusters?.length > 0 && (
        <div className="px-6 pb-8">
          <h2 className="text-lg font-semibold mb-3">Damage Corridors Detected</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {clusters.clusters.map((c: any) => (
              <div key={c.cluster_id} className="bg-gray-800 rounded-xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <span
                    className="text-xs font-bold px-2 py-1 rounded-full"
                    style={{ background: c.color + '33', color: c.color }}
                  >
                    {c.severity.toUpperCase()}
                  </span>
                  <span className="text-gray-500 text-xs">{c.point_count} potholes</span>
                </div>
                <p className="text-gray-300 text-xs mb-2">{c.repair_recommendation}</p>
                <p className="text-green-400 text-sm font-semibold">{c.estimated_cost}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}