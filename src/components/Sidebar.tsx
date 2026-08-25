import SearchBar from './SearchBar'
import AddPlaceForm from './AddPlaceForm'
import type { MapPoint } from '../types'

interface SidebarProps {
  open: boolean
  onToggle: () => void
  onSearchResult: (result: { lat: number; lng: number }) => void
  placing: boolean
  pendingPin: { lat: number; lng: number } | null
  onStartPlacing: () => void
  onCancelPlacing: () => void
  onSubmitPlace: (point: MapPoint) => void
}

export default function Sidebar({ open, onToggle, onSearchResult, placing, pendingPin, onStartPlacing, onCancelPlacing, onSubmitPlace }: SidebarProps) {
  return (
    <div
      className={[
        'fixed top-0 left-0 h-full z-20 w-75 max-w-[85vw]',
        'bg-surface border-r border-hairline',
        'transition-transform duration-300 ease-out',
        open ? 'translate-x-0' : '-translate-x-full',
      ].join(' ')}
    >
      <button
        onClick={onToggle}
        aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
        className="absolute top-4 -right-9 flex items-center justify-center h-9 w-9 rounded-r-xl bg-surface border border-l-0 border-hairline text-mist hover:text-paper"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          className={`transition-transform duration-300 ${open ? '' : 'rotate-180'}`}
        >
          <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-electric shadow-[0_0_10px_2px_rgba(47,111,237,0.7)]" />
          <span className="font-display font-semibold text-[16px] tracking-tight text-paper">
            MtaaMap
          </span>
          <span className="text-[11px] font-body text-fog border-l border-hairline pl-2 ml-0.5">
            Mtaa Yetu
          </span>
        </div>

        <SearchBar onResultSelect={onSearchResult} />

        <div className="border-t border-hairline pt-3">
          <p className="text-[10.5px] uppercase tracking-wide text-fog px-0.5">
            Contribute
          </p>
          {!placing && !pendingPin && <button onClick={onStartPlacing} className="mt-2 w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] text-paper bg-surface-raised border border-hairline hover:border-electric transition-colors"><span className="h-1.5 w-1.5 rounded-full bg-electric" />Add a place</button>}
          {placing && !pendingPin && <div className="mt-2 rounded-xl bg-surface-raised border border-hairline px-3 py-3"><p className="text-[13px] text-paper">Tap anywhere on the map to place your pin.</p><button onClick={onCancelPlacing} className="mt-2 text-[12px] text-fog hover:text-mist">Cancel</button></div>}
          {pendingPin && <div className="mt-2"><AddPlaceForm coords={pendingPin} onSubmit={onSubmitPlace} onCancel={onCancelPlacing} /></div>}
          <button
            disabled
            className="mt-1.5 w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] text-fog bg-surface-raised/50 border border-hairline cursor-not-allowed"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-fog" />
            Report incorrect info — coming soon
          </button>
        </div>
      </div>
    </div>
  )
}