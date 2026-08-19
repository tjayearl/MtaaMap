import type { LayerId } from '../types'
import { LAYERS } from '../data/mockData'

interface LayerSwitcherProps {
  active: LayerId
  onChange: (id: LayerId) => void
}

export default function LayerSwitcher({ active, onChange }: LayerSwitcherProps) {
  const activeLayer = LAYERS.find((l) => l.id === active)

  return (
    <div className="pointer-events-none absolute left-0 right-0 bottom-[calc(env(safe-area-inset-bottom)+84px)] z-10 flex flex-col items-center gap-2 px-4">
      {activeLayer && (
        <p className="pointer-events-auto rounded-full bg-ink/80 backdrop-blur-md border border-hairline px-3 py-1 text-[12px] font-body text-mist">
          {activeLayer.question}
        </p>
      )}
      <div className="pointer-events-auto flex gap-1.5 rounded-2xl bg-surface/95 backdrop-blur-md border border-hairline p-1.5 shadow-lg shadow-black/30">
        {LAYERS.map((layer) => {
          const isActive = layer.id === active
          return (
            <button
              key={layer.id}
              disabled={!layer.available}
              onClick={() => onChange(layer.id)}
              className={[
                'relative flex flex-col items-center gap-1 rounded-xl px-4 py-2.5 min-w-[84px] transition-colors',
                isActive ? 'bg-surface-raised' : '',
                !layer.available ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
              ].join(' ')}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: layer.color }} />
              <span
                className={['font-body text-[11.5px] font-medium tracking-tight', isActive ? 'text-paper' : 'text-fog'].join(' ')}
              >
                {layer.label}
              </span>
              {!layer.available && <span className="absolute -top-1.5 -right-1.5 rounded-full bg-hairline px-1.5 py-[1px] text-[9px] font-data text-mist">soon</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}