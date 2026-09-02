import { useEffect, useMemo, useState } from 'react'
import type { UUID } from '../types'

interface MatatuStage {
  id: UUID
  route_id: UUID
  name: string
  lat: number
  lng: number
  notes?: string
  distance_km?: number
}

interface MatatuRoute {
  id: UUID
  name: string
  route_number?: string
  stages: MatatuStage[]
}

interface MatatuFinderModalProps {
  isOpen: boolean
  onClose: () => void
  mapCenter?: { lat: number; lng: number } | null
  onSelectStage: (stage: MatatuStage, route: MatatuRoute) => void
}

export function MatatuFinderModal({ isOpen, onClose, mapCenter, onSelectStage }: MatatuFinderModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<Array<MatatuStage & { route_name: string; route_id: UUID }>>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isOpen || !searchQuery) {
      setResults([])
      return
    }

    const search = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams({
          q: searchQuery,
          ...(mapCenter && { lat: mapCenter.lat.toString(), lng: mapCenter.lng.toString() }),
        })
        const response = await fetch(`/api/matatu-routes/search?${params}`)
        const data = await response.json()
        setResults(data)
      } catch (error) {
        console.error('Failed to search matatu routes:', error)
      } finally {
        setIsLoading(false)
      }
    }

    const timer = setTimeout(search, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, isOpen, mapCenter])

  const sortedResults = useMemo(() => {
    return [...results].sort((a, b) => {
      if (a.distance_km && b.distance_km) return a.distance_km - b.distance_km
      return 0
    })
  }, [results])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-40">
      <div className="w-full bg-surface rounded-t-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="sticky top-0 bg-surface border-b border-hairline px-4 py-3 flex items-center justify-between">
          <h2 className="text-[14px] font-semibold text-paper">Find Matatu Routes</h2>
          <button onClick={onClose} className="text-fog hover:text-paper text-[20px]">×</button>
        </div>

        <input
          type="text"
          placeholder="Search route (e.g., 'Nairobi CBD')"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="mx-4 mt-3 mb-3 w-[calc(100%-2rem)] rounded-lg bg-surface-raised border border-hairline px-3 py-2 text-[13px] text-paper placeholder:text-fog outline-none focus:border-electric"
        />

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="px-4 py-8 text-center text-fog text-[13px]">Searching...</div>
          ) : sortedResults.length > 0 ? (
            <ul className="divide-y divide-hairline">
              {sortedResults.map(stage => (
                <li
                  key={stage.id}
                  onClick={() => {
                    onSelectStage(stage, { id: stage.route_id, name: stage.route_name, stages: [stage] as MatatuStage[] })
                    onClose()
                  }}
                  className="px-4 py-3 hover:bg-surface-raised cursor-pointer"
                >
                  <div className="font-medium text-[13px] text-paper">{stage.route_name}</div>
                  <div className="text-[12px] text-fog mt-1">📍 {stage.name}</div>
                  {stage.distance_km && (
                    <div className="text-[11px] text-mist mt-1">{stage.distance_km.toFixed(1)} km away</div>
                  )}
                </li>
              ))}
            </ul>
          ) : searchQuery ? (
            <div className="px-4 py-8 text-center text-fog text-[13px]">No routes found</div>
          ) : (
            <div className="px-4 py-8 text-center text-fog text-[13px]">Type to search routes</div>
          )}
        </div>
      </div>
    </div>
  )
}
