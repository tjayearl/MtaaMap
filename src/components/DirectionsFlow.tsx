import { useState } from 'react'
import type { Map as MapLibreGLMap } from 'maplibre-gl'

interface DirectionsFlowProps {
  map: MapLibreGLMap | null
  pointLat: number
  pointLng: number
  pointName: string
  onClose: () => void
}

export function DirectionsFlow({ map, pointLat, pointLng, pointName, onClose }: DirectionsFlowProps) {
  const [step, setStep] = useState<'permission' | 'result'>('permission')

  const [directions, setDirections] = useState<{ distance_km: number; duration_minutes: number } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const requestLocation = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
      })

      const loc = { lat: position.coords.latitude, lng: position.coords.longitude }

      // Get directions
      const response = await fetch('/api/directions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_lat: loc.lat,
          start_lng: loc.lng,
          end_lat: pointLat,
          end_lng: pointLng,
        }),
      })

      const data = await response.json()
      setDirections(data)
      setStep('result')

      // Draw route on map
      if (map) {
        // Remove existing route layer
        if (map.getLayer('route-layer')) map.removeLayer('route-layer')
        if (map.getSource('route')) map.removeSource('route')

        // Add start/end markers
        new (map as any).Marker({ color: '#2f6fed' }).setLngLat([loc.lng, loc.lat]).addTo(map)
        new (map as any).Marker({ color: '#f5a524' }).setLngLat([pointLng, pointLat]).addTo(map)

        // Simple line between points
        map.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: [[loc.lng, loc.lat], [pointLng, pointLat]] },
            properties: {},
          },
        })

        map.addLayer({
          id: 'route-layer',
          type: 'line',
          source: 'route',
          paint: { 'line-color': '#2f6fed', 'line-width': 3 },
        })

        // Fit bounds
        const bounds = [[Math.min(loc.lng, pointLng), Math.min(loc.lat, pointLat)], [Math.max(loc.lng, pointLng), Math.max(loc.lat, pointLat)]]
        map.fitBounds(bounds as any, { padding: 80 })
      }
    } catch (err) {
      const message = err instanceof GeolocationPositionError
        ? 'Location access denied. Please enable location permissions.'
        : 'Failed to get location. Please try again.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-40">
      <div className="w-full bg-surface rounded-t-2xl px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[14px] font-semibold text-paper">Directions to {pointName}</h3>
          <button onClick={onClose} className="text-fog hover:text-paper text-[20px]">×</button>
        </div>

        {step === 'permission' ? (
          <div className="space-y-3">
            <p className="text-[12px] text-fog">We'll share your location to calculate distance and route to this point.</p>
            <button
              onClick={requestLocation}
              disabled={isLoading}
              className="w-full bg-electric text-paper py-2 rounded-lg text-[13px] font-medium hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? 'Getting location...' : 'Share My Location'}
            </button>
            {error && <p className="text-[12px] text-red-500">{error}</p>}
          </div>
        ) : directions ? (
          <div className="space-y-3">
            <div className="bg-surface-raised rounded-lg px-3 py-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-fog">Distance</p>
                  <p className="text-[16px] font-bold text-electric mt-1">{directions.distance_km} km</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-fog">Est. Time</p>
                  <p className="text-[16px] font-bold text-electric mt-1">{directions.duration_minutes} min</p>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-fog text-center">
              📍 You are {directions.distance_km} km away. Follow the route on the map.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-surface-raised text-paper py-2 rounded-lg text-[13px] font-medium hover:bg-mist"
            >
              Done
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
