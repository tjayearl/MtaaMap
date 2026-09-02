import { useState } from 'react'
import SearchBar from './SearchBar'
import AddPlaceForm from './AddPlaceForm'
import ReportForm from './ReportForm'
import NearbyList from './NearbyList'
import PriceFilters from './PriceFilters'
import { MatatuFinderModal } from './MatatuFinderModal'
import { LeaderboardComponent } from './LeaderboardComponent'
import type { LayerId, MapPoint, PriceItem } from '../types'

interface SidebarProps {
  open: boolean
  onToggle: () => void
  onSearchResult: (result: { lat: number; lng: number }) => void
  onOpenCommunity: () => void
  placing: boolean
  pendingPin: { lat: number; lng: number } | null
  onStartPlacing: () => void
  onCancelPlacing: () => void
  onSubmitPlace: (point: MapPoint) => void
  points: MapPoint[]
  filteredPoints: MapPoint[]
  reporting: boolean
  onStartReporting: () => void
  onCancelReporting: () => void
  onSubmitReport: (pointId: string, reason: string, correctedPrices?: PriceItem[]) => void
  activeLayer: LayerId
  selectedId: string | null
  onSelectPoint: (id: string) => void
  mapCenter: { lat: number; lng: number } | null
  onPriceFiltersChange: (filters: string[]) => void
}

type SidebarTab = 'browse' | 'nearby' | 'filters' | 'leaderboard' | 'matatu'

export default function Sidebar({
  open, onToggle, onSearchResult, onOpenCommunity, placing, pendingPin, onStartPlacing, onCancelPlacing, onSubmitPlace,
  points, filteredPoints, reporting, onStartReporting, onCancelReporting, onSubmitReport,
  activeLayer, selectedId, onSelectPoint, mapCenter, onPriceFiltersChange,
}: SidebarProps) {
  const [tab, setTab] = useState<SidebarTab>('browse')
  const [showMatatuModal, setShowMatatuModal] = useState(false)
  const idle = !placing && !pendingPin && !reporting

  return (
    <div className={[
      'fixed top-0 left-0 h-full z-20 w-[300px] max-w-[85vw]',
      'bg-surface border-r border-hairline',
      'transition-transform duration-300 ease-out',
      open ? 'translate-x-0' : '-translate-x-full',
    ].join(' ')}>
      <button onClick={onToggle} aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'} className="absolute top-4 -right-9 flex items-center justify-center h-9 w-9 rounded-r-xl bg-surface border border-l-0 border-hairline text-mist hover:text-paper">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={`transition-transform duration-300 ${open ? '' : 'rotate-180'}`}>
          <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="h-2 w-2 rounded-full bg-electric shadow-[0_0_10px_2px_rgba(47,111,237,0.7)]" />
            <div className="min-w-0">
              <span className="font-display font-semibold text-[16px] tracking-tight text-paper block truncate">MtaaMap</span>
              <span className="text-[11px] font-body text-fog">Mtaa Yetu</span>
            </div>
          </div>
          <button className="flex-shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-paper bg-electric/20 border border-electric/40 hover:border-electric transition-colors whitespace-nowrap">
            Sign in
          </button>
        </div>

        <SearchBar onResultSelect={onSearchResult} />

        <div className="border-t border-hairline pt-3">
          <p className="text-[10.5px] uppercase tracking-wide text-fog px-0.5">Community</p>
          <button onClick={onOpenCommunity} className="mt-2 w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] text-paper bg-surface-raised border border-hairline hover:border-electric transition-colors">
            <span className="h-1.5 w-1.5 rounded-full bg-electric" />
            Browse active discussions
          </button>
        </div>

        <div className="border-t border-hairline pt-3">
          <p className="text-[10.5px] uppercase tracking-wide text-fog px-0.5">Explore</p>
          <div className="mt-2 flex gap-1.5 flex-wrap">
            {(['browse', 'nearby', 'leaderboard', 'matatu', ...(activeLayer === 'prices' ? ['filters'] : [])] as Array<SidebarTab>).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={[
                  'rounded-lg px-2.5 py-1.5 text-[11px] font-medium border transition-colors',
                  tab === t ? 'bg-electric/15 border-electric text-paper' : 'bg-surface-raised border-hairline text-mist hover:border-electric/60',
                ].join(' ')}
              >
                {t === 'browse' ? 'Browse' : t === 'nearby' ? 'Nearby' : t === 'leaderboard' ? 'Top' : t === 'matatu' ? 'Matatu' : 'Filter'}
              </button>
            ))}
          </div>

          <div className="mt-2">
            {tab === 'browse' && idle && (
              <>
                <button onClick={onStartPlacing} className="w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] text-paper bg-surface-raised border border-hairline hover:border-electric transition-colors">
                  <span className="h-1.5 w-1.5 rounded-full bg-electric" />
                  Add a place
                </button>
                <button onClick={onStartReporting} className="mt-1.5 w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] text-paper bg-surface-raised border border-hairline hover:border-dispute transition-colors">
                  <span className="h-1.5 w-1.5 rounded-full bg-dispute" />
                  Report incorrect info
                </button>
              </>
            )}

            {placing && !pendingPin && (
              <div className="rounded-xl bg-surface-raised border border-hairline px-3 py-3">
                <p className="text-[13px] text-paper">Tap anywhere on the map to place your pin.</p>
                <button onClick={onCancelPlacing} className="mt-2 text-[12px] text-fog hover:text-mist">Cancel</button>
              </div>
            )}

            {pendingPin && (
              <div>
                <AddPlaceForm coords={pendingPin} onSubmit={onSubmitPlace} onCancel={onCancelPlacing} />
              </div>
            )}

            {reporting && (
              <div>
                <ReportForm points={points} onSubmit={onSubmitReport} onCancel={onCancelReporting} />
              </div>
            )}

            {tab === 'nearby' && idle && (
              <NearbyList
                points={filteredPoints}
                activeLayer={activeLayer}
                mapCenter={mapCenter}
                selectedId={selectedId}
                onSelect={onSelectPoint}
                onFlyTo={(lat, lng) => onSearchResult({ lat, lng })}
              />
            )}

            {tab === 'filters' && idle && activeLayer === 'prices' && (
              <PriceFilters
                points={points}
                onFilterChange={onPriceFiltersChange}
              />
            )}

            {tab === 'leaderboard' && idle && (
              <div>
                <p className="text-[10.5px] uppercase tracking-wide text-fog mb-2">Top Contributors</p>
                <LeaderboardComponent metric="contributions" limit={15} />
              </div>
            )}

            {tab === 'matatu' && idle && (
              <div>
                <button
                  onClick={() => setShowMatatuModal(true)}
                  className="w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] text-paper bg-surface-raised border border-hairline hover:border-electric transition-colors"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-electric" />
                  Find matatu routes
                </button>
              </div>
            )}

            {/* Matatu Finder Modal */}
            <MatatuFinderModal
              isOpen={showMatatuModal}
              onClose={() => setShowMatatuModal(false)}
              mapCenter={mapCenter}
              onSelectStage={(stage) => {
                onSearchResult({ lat: stage.lat, lng: stage.lng })
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
