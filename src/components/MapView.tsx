import { useEffect, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import { setWorkerUrl } from 'maplibre-gl'
import type { Map as MLMap, Marker } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
// Vite-specific import: bundles the MapLibre worker as its own chunk with a
// resolvable URL. Without this, the worker silently fails in production
// builds — style/sprite requests succeed, but no vector tiles ever render
// and no error is thrown. Dev mode works either way, which is why this only
// showed up on the deployed site.
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import type { LayerId, MapPoint } from '../types'
import { LAYERS } from '../data/mockData'

setWorkerUrl(maplibreWorkerUrl)
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
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    console.log('[MtaaMap] map container size at init:', rect.width, rect.height)
    if (rect.width === 0 || rect.height === 0) {
      setLoadError(`Map container has zero size (${rect.width}x${rect.height}) — CSS layout issue.`)
      return
    }

    let map: MLMap
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: BASEMAP_STYLE,
        center: [36.6705, -1.233],
        zoom: 14.2,
        attributionControl: { compact: true },
      })
    } catch (err) {
      console.error('[MtaaMap] failed to construct maplibregl.Map:', err)
      setLoadError(err instanceof Error ? err.message : String(err))
      return
    }

    map.on('load', () => {
      console.log('[MtaaMap] map "load" event fired — basemap style loaded successfully.')
    })

    map.on('error', (e) => {
      console.error('[MtaaMap] maplibre "error" event:', e?.error ?? e)
      setLoadError(e?.error?.message ?? 'Unknown MapLibre error — check console for the full event object.')
    })

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right')
    mapRef.current = map

    return () => {
      if (!map) return
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

  return (
    <div className="absolute inset-0" style={{ position: 'absolute', inset: 0 }}>
      <div ref={containerRef} className="absolute inset-0" style={{ position: 'absolute', inset: 0 }} />
      {loadError && (
        <div className="absolute inset-x-4 top-20 z-30 rounded-xl bg-dispute/90 p-3 text-[13px] text-white">
          Map failed to load: {loadError}
        </div>
      )}
    </div>
  )
}