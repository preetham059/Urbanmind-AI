'use client'
import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface Props {
  clusters: any
  complaints: any
  activeLayer: {
    clusters: boolean
    complaints: boolean
    heatmap: boolean
  }
}
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})
export default function CityMap({ clusters, complaints, activeLayer }: Props) {
  const mapRef = useRef<L.Map | null>(null)
  const layersRef = useRef<{
    clusters: L.LayerGroup
    complaints: L.LayerGroup
    heatmap: L.LayerGroup
  } | null>(null)

  useEffect(() => {
    if (mapRef.current) return

    const map = L.map('city-map', {
      center: [12.9716, 77.5946],
      zoom: 12,
      zoomControl: true,
    })

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO',
      maxZoom: 19,
    }).addTo(map)

    const clusterLayer = L.layerGroup().addTo(map)
    const complaintLayer = L.layerGroup().addTo(map)
    const heatmapLayer = L.layerGroup().addTo(map)

    layersRef.current = {
      clusters: clusterLayer,
      complaints: complaintLayer,
      heatmap: heatmapLayer,
    }

    // Draw DBSCAN clusters
    if (clusters?.clusters) {
      clusters.clusters.forEach((cluster: any) => {
        // Draw convex hull polygon
        if (cluster.polygon?.length >= 3) {
          const polygon = L.polygon(
            cluster.polygon.map((p: number[]) => [p[0], p[1]] as [number, number]),
            {
              color: cluster.color,
              fillColor: cluster.color,
              fillOpacity: 0.2,
              weight: 2,
              dashArray: '5 5',
            }
          ).addTo(clusterLayer)

          polygon.bindPopup(`
            <div style="color:#111;min-width:200px">
              <strong>Damage Cluster #${cluster.cluster_id + 1}</strong><br/>
              Severity: <span style="color:${cluster.color};font-weight:bold">${cluster.severity.toUpperCase()}</span><br/>
              Potholes: ${cluster.point_count}<br/>
              Action: ${cluster.repair_recommendation}<br/>
              Est. Cost: <strong>${cluster.estimated_cost}</strong>
            </div>
          `)
        }

        // Center marker
        const marker = L.circleMarker(
          [cluster.center.lat, cluster.center.lng],
          {
            radius: 10 + cluster.point_count * 2,
            color: cluster.color,
            fillColor: cluster.color,
            fillOpacity: 0.7,
            weight: 2,
          }
        ).addTo(clusterLayer)

        marker.bindTooltip(
          `Cluster: ${cluster.severity.toUpperCase()} — ${cluster.point_count} potholes`,
          { permanent: false }
        )
      })

      // Draw noise points
      clusters.noise_points?.forEach((p: any) => {
        L.circleMarker([p.lat, p.lng], {
          radius: 4,
          color: '#6b7280',
          fillColor: '#6b7280',
          fillOpacity: 0.5,
          weight: 1,
        }).addTo(clusterLayer)
      })
    }

    // Draw complaint hotspots
    if (complaints?.hotspots) {
      const categoryColors: Record<string, string> = {
        pothole: '#3b82f6',
        garbage: '#22c55e',
        streetlight: '#eab308',
        water_leakage: '#06b6d4',
        traffic: '#f97316',
      }

      complaints.hotspots.forEach((h: any) => {
        const color = categoryColors[h.category] || '#6b7280'
        const marker = L.circleMarker([h.lat, h.lng], {
          radius: 6,
          color: color,
          fillColor: color,
          fillOpacity: 0.8,
          weight: 1.5,
        }).addTo(complaintLayer)

        marker.bindPopup(`
          <div style="color:#111">
            <strong>${h.category.replace('_', ' ').toUpperCase()}</strong><br/>
            Complaints: ${h.count}
          </div>
        `)
      })
    }

    // Heatmap circles for damage intensity
    if (clusters?.clusters) {
      clusters.clusters.forEach((cluster: any) => {
        L.circle([cluster.center.lat, cluster.center.lng], {
          radius: 300,
          color: 'transparent',
          fillColor: cluster.color,
          fillOpacity: 0.08,
          weight: 0,
        }).addTo(heatmapLayer)
      })
    }

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [clusters, complaints])

  useEffect(() => {
    if (!layersRef.current || !mapRef.current) return
    const map = mapRef.current
    const layers = layersRef.current

    if (activeLayer.clusters) {
      map.addLayer(layers.clusters)
    } else {
      map.removeLayer(layers.clusters)
    }

    if (activeLayer.complaints) {
      map.addLayer(layers.complaints)
    } else {
      map.removeLayer(layers.complaints)
    }

    if (activeLayer.heatmap) {
      map.addLayer(layers.heatmap)
    } else {
      map.removeLayer(layers.heatmap)
    }
  }, [activeLayer])

  return <div id="city-map" style={{ width: '100%', height: '100%' }} />
}