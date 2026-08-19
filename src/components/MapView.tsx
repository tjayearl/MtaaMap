import { useEffect, useRef } from 'react'
import * as maplibregl from 'maplibre-gl'
import type { Map as MLMap, Marker } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { LayerId, MapPoint } from '../types'
import { LAYERS } from '../data/mockData'

interface MapViewProps {
  points: MapPoint[]
  activeLayer: LayerId
  selectedId: string | null
  onSelect: (id: string) => void
}

// CARTO's free "dark matter" vector basemap is built on OpenStreetMap data —
// swap the style URL for a self-hosted OSM tile server (TileServer GL /
// OpenMapTiles) once we're editing building/place data ourselves.
const BASEMAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

export default function MapView({ points, activeLayer, selectedId, onSelect }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MLMap | null>(null)
  const markersRef = useRef<Map<string, Marker>>(new Map())

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASEMAP_STYLE,
      center: [36.6705, -1.233],
      zoom: 14.2,
      attributionControl: { compact: true },
    })

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right')
    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current.clear()

    const visible = points.filter((p) => p.layer === activeLayer)
    const layerMeta = LAYERS.find((l) => l.id === activeLayer)
    const color = layerMeta?.color ?? '#2f6fed'

    visible.forEach((point) => {
      const el = document.createElement('button')
      el.setAttribute('aria-label', point.name)
      el.style.width = '18px'
      el.style.height = '18px'
      el.style.borderRadius = '999px'
      el.style.border = '2px solid #0b0f17'
      el.style.cursor = 'pointer'
      el.style.background = point.disputed ? '#ef4444' : color
      el.style.boxShadow = selectedId === point.id ? `0 0 0 4px ${color}55` : 'none'
      el.style.transition = 'box-shadow 120ms ease'

      el.addEventListener('click', (e) => {
        e.stopPropagation()
        onSelect(point.id)
      })

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([point.lng, point.lat])
        .addTo(map)

      markersRef.current.set(point.id, marker)
    })
  }, [points, activeLayer, selectedId, onSelect])

  return <div ref={containerRef} className="absolute inset-0" />
}