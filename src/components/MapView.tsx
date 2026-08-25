import { useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react'
import * as maplibregl from 'maplibre-gl'
import { setWorkerUrl } from 'maplibre-gl'
import type { Map as MLMap, Marker } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import type { LayerId, MapPoint, ThemeMode } from '../types'
import { LAYERS } from '../data/mockData'

setWorkerUrl(maplibreWorkerUrl)

interface MapViewProps {
  points: MapPoint[]
  activeLayer: LayerId
  selectedId: string | null
  onSelect: (id: string) => void
  theme: ThemeMode
  placing: boolean
  onMapClick: (coords: { lat: number; lng: number }) => void
  pendingPin: { lat: number; lng: number } | null
}

export interface MapViewHandle {
  flyTo: (lat: number, lng: number, zoom?: number) => void
}

const BASEMAP_STYLES: Record<ThemeMode, string> = {
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
}

const MapView = forwardRef<MapViewHandle, MapViewProps>(
  ({ points, activeLayer, selectedId, onSelect, theme, placing, onMapClick, pendingPin }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const mapRef = useRef<MLMap | null>(null)
    const markersRef = useRef<Map<string, Marker>>(new Map())
    const pendingMarkerRef = useRef<Marker | null>(null)
    const [loadError, setLoadError] = useState<string | null>(null)

    useImperativeHandle(ref, () => ({
      flyTo: (lat, lng, zoom = 15) => {
        mapRef.current?.flyTo({ center: [lng, lat], zoom, duration: 1200 })
      },
    }))

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
          style: BASEMAP_STYLES[theme],
          center: [36.8464, -1.1708], // Kirigiti Stadium, Kiambu
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
        map.remove()
        mapRef.current = null
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
      const map = mapRef.current
      if (!map) return
      map.setStyle(BASEMAP_STYLES[theme])
    }, [theme])

    useEffect(() => {
      const map = mapRef.current
      if (!map) return
      const handleClick = (e: maplibregl.MapMouseEvent) => onMapClick({ lat: e.lngLat.lat, lng: e.lngLat.lng })
      map.getCanvas().style.cursor = placing ? 'crosshair' : ''
      if (placing) map.on('click', handleClick)
      return () => {
        map.off('click', handleClick)
      }
    }, [placing, onMapClick])

    useEffect(() => {
      const map = mapRef.current
      if (!map) return
      pendingMarkerRef.current?.remove()
      pendingMarkerRef.current = null
      if (pendingPin) {
        const el = document.createElement('div')
        el.style.cssText = 'width:22px;height:22px;border-radius:999px 999px 999px 2px;transform:rotate(45deg);background:#2f6fed;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4)'
        pendingMarkerRef.current = new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat([pendingPin.lng, pendingPin.lat]).addTo(map)
      }
    }, [pendingPin])

    useEffect(() => {
      const map = mapRef.current
      if (!map) return

      const renderMarkers = () => {
        markersRef.current.forEach((marker) => marker.remove())
        markersRef.current.clear()

        const visible = points.filter((p) => p.layer === activeLayer)
        const layerMeta = LAYERS.find((l) => l.id === activeLayer)
        const color = layerMeta?.color ?? '#2f6fed'
        const ringColor = theme === 'light' ? '#ffffff' : '#0b0f17'

        visible.forEach((point) => {
          const el = document.createElement('button')
          el.setAttribute('aria-label', point.name)
          el.style.width = '18px'
          el.style.height = '18px'
          el.style.borderRadius = '999px'
          el.style.border = `2px solid ${ringColor}`
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
      }

      if (map.isStyleLoaded()) {
        renderMarkers()
      } else {
        map.once('style.load', renderMarkers)
      }
    }, [points, activeLayer, selectedId, onSelect, theme])

    return (
      <div className="absolute inset-0" style={{ position: 'absolute', inset: 0 }}>
        <div ref={containerRef} className="absolute inset-0" style={{ position: 'absolute', inset: 0 }} />
        {loadError && (
          <div className="absolute inset-x-4 top-20 z-30 rounded-xl bg-dispute/90 p-3 text-[13px] text-white">
            Map failed to load: {loadError}
          </div>
        )}
        {placing && <div className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 z-30 rounded-full bg-electric text-white text-[12.5px] font-medium px-3.5 py-1.5 shadow-lg">Tap the map to place your pin</div>}
      </div>
    )
  }
)

MapView.displayName = 'MapView'

export default MapView