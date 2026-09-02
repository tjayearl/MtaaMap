import { useMemo } from 'react'
import type { LayerId, MapPoint } from '../types'

interface NearbyListProps {
  points: MapPoint[]
  activeLayer: LayerId
  mapCenter: { lat: number; lng: number } | null
  selectedId: string | null
  onSelect: (id: string) => void
  onFlyTo: (lat: number, lng: number) => void
}

const EARTH_RADIUS_KM = 6371

function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_KM * c
}

export default function NearbyList({
  points,
  activeLayer,
  mapCenter,
  selectedId,
  onSelect,
  onFlyTo,
}: NearbyListProps) {
  const nearby = useMemo(() => {
    if (!mapCenter) return []

    const filtered = points.filter((p) => p.layer === activeLayer)
    const withDistance = filtered.map((p) => ({
      point: p,
      distance: haversineDistance(mapCenter.lat, mapCenter.lng, p.lat, p.lng),
    }))

    return withDistance.sort((a, b) => a.distance - b.distance).slice(0, 15)
  }, [points, activeLayer, mapCenter])

  if (!mapCenter) {
    return (
      <div className="text-[12px] text-fog p-3">
        <p>Map loading...</p>
      </div>
    )
  }

  if (nearby.length === 0) {
    return (
      <div className="text-[12px] text-fog p-3">
        <p>No {activeLayer} points nearby yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-1.5 p-2">
      {nearby.map(({ point, distance }) => (
        <button
          key={point.id}
          onClick={() => {
            onSelect(point.id)
            onFlyTo(point.lat, point.lng)
          }}
          className={[
            'flex w-full flex-col rounded-lg px-3 py-2 text-left border transition-colors',
            selectedId === point.id
              ? 'border-electric bg-electric/10'
              : 'border-hairline bg-surface-raised hover:border-electric/60',
          ].join(' ')}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-paper truncate">{point.name}</p>
              <p className="text-[11px] text-fog mt-0.5">{point.area}</p>
            </div>
            <span className="text-[11px] font-medium text-mist whitespace-nowrap ml-2">
              {distance < 1 ? '<1 km' : `${distance.toFixed(1)} km`}
            </span>
          </div>
          {point.prices && point.prices.length > 0 && (
            <p className="text-[10px] text-mist mt-2">
              {point.prices.map((p) => `${p.name} ${p.price ? `• ${p.price} ${p.unit}` : ''}`).filter(Boolean).join(' • ')}
            </p>
          )}
          {point.neighborhood && (
            <p className="text-[10px] text-mist mt-2 line-clamp-1">
              {point.neighborhood.note}
            </p>
          )}
          {point.disputed && (
            <p className="text-[10px] text-dispute mt-2">⚠ Disputed info</p>
          )}
        </button>
      ))}
    </div>
  )
}
