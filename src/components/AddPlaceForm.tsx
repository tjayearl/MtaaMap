import { useState } from 'react'
import type { LayerId, MapPoint, NeighborhoodRating, PriceItem } from '../types'

interface AddPlaceFormProps {
  coords: { lat: number; lng: number }
  onSubmit: (point: MapPoint) => void
  onCancel: () => void
}

const emptyPriceRow = (): PriceItem => ({ name: '', price: 0, unit: 'kg' })

export default function AddPlaceForm({ coords, onSubmit, onCancel }: AddPlaceFormProps) {
  const [layer, setLayer] = useState<LayerId>('neighborhood')
  const [name, setName] = useState('')
  const [area, setArea] = useState('')
  const [note, setNote] = useState('')
  const [electricity, setElectricity] = useState<NeighborhoodRating['electricity']>('unknown')
  const [water, setWater] = useState<NeighborhoodRating['water']>('unknown')
  const [roads, setRoads] = useState<NeighborhoodRating['roads']>('mixed')
  const [security, setSecurity] = useState<NeighborhoodRating['security']>('fair')
  const [priceRows, setPriceRows] = useState<PriceItem[]>([emptyPriceRow()])

  const updatePriceRow = (i: number, patch: Partial<PriceItem>) => {
    setPriceRows((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  }

  const canSubmit = name.trim().length > 0 && area.trim().length > 0

  const handleSubmit = () => {
    if (!canSubmit) return

    const base = {
      id: `user-${Date.now()}`,
      lat: coords.lat,
      lng: coords.lng,
      layer,
      name: name.trim(),
      area: area.trim(),
      lastVerified: { reporterInitial: 'You', timeAgo: 'just now', confirmations: 1 },
    }

    const point: MapPoint =
      layer === 'prices'
        ? { ...base, prices: priceRows.filter((r) => r.name.trim().length > 0) }
        : { ...base, neighborhood: { electricity, water, roads, security, note: note.trim() } }

    onSubmit(point)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-paper">Pin placed</p>
        <button onClick={onCancel} className="text-[11px] text-fog hover:text-mist">Cancel</button>
      </div>
      <p className="font-data text-[11px] text-fog -mt-2">
        {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
      </p>

      <div>
        <label className="text-[10.5px] uppercase tracking-wide text-fog">What kind of info?</label>
        <div className="mt-1.5 flex gap-1.5">
          {(['neighborhood', 'prices'] as LayerId[]).map((l) => (
            <button
              key={l}
              onClick={() => setLayer(l)}
              className={[
                'flex-1 rounded-lg px-2 py-1.5 text-[12px] border transition-colors',
                layer === l ? 'bg-electric/15 border-electric text-paper' : 'bg-surface-raised border-hairline text-mist',
              ].join(' ')}
            >
              {l === 'neighborhood' ? 'Neighborhood' : 'Prices'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-[10.5px] uppercase tracking-wide text-fog">Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={layer === 'prices' ? 'e.g. Wanjiku Fresh Produce' : 'e.g. Riverside Estate'} className="mt-1 w-full rounded-lg bg-surface-raised border border-hairline px-2.5 py-2 text-[13px] text-paper placeholder:text-fog outline-none focus:border-electric" />
      </div>

      <div>
        <label className="text-[10.5px] uppercase tracking-wide text-fog">Area</label>
        <input value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. Kirigiti, Kiambu" className="mt-1 w-full rounded-lg bg-surface-raised border border-hairline px-2.5 py-2 text-[13px] text-paper placeholder:text-fog outline-none focus:border-electric" />
      </div>

      {layer === 'prices' ? (
        <div>
          <label className="text-[10.5px] uppercase tracking-wide text-fog">Items &amp; prices</label>
          <div className="mt-1.5 flex flex-col gap-1.5">
            {priceRows.map((row, i) => (
              <div key={i} className="flex gap-1.5">
                <input value={row.name} onChange={(e) => updatePriceRow(i, { name: e.target.value })} placeholder="Item" className="flex-1 min-w-0 rounded-lg bg-surface-raised border border-hairline px-2.5 py-1.5 text-[12.5px] text-paper placeholder:text-fog outline-none focus:border-electric" />
                <input type="number" value={row.price || ''} onChange={(e) => updatePriceRow(i, { price: Number(e.target.value) })} placeholder="KES" className="w-20 rounded-lg bg-surface-raised border border-hairline px-2.5 py-1.5 text-[12.5px] text-paper placeholder:text-fog outline-none focus:border-electric" />
                <select value={row.unit} onChange={(e) => updatePriceRow(i, { unit: e.target.value })} className="rounded-lg bg-surface-raised border border-hairline px-1.5 py-1.5 text-[12.5px] text-paper outline-none focus:border-electric">
                  <option value="kg">kg</option>
                  <option value="head">head</option>
                  <option value="bunch">bunch</option>
                  <option value="piece">pc</option>
                </select>
              </div>
            ))}
          </div>
          <button onClick={() => setPriceRows((rows) => [...rows, emptyPriceRow()])} className="mt-1.5 text-[11.5px] text-electric">+ add another item</button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            {([
              ['Electricity', electricity, setElectricity, ['reliable', 'unreliable', 'unknown']],
              ['Water', water, setWater, ['reliable', 'unreliable', 'unknown']],
              ['Roads', roads, setRoads, ['paved', 'unpaved', 'mixed']],
              ['Security', security, setSecurity, ['good', 'fair', 'concerning']],
            ] as const).map(([label, value, setter, options]) => (
              <div key={label}>
                <label className="text-[10.5px] uppercase tracking-wide text-fog">{label}</label>
                <select value={value} onChange={(e) => setter(e.target.value as never)} className="mt-1 w-full rounded-lg bg-surface-raised border border-hairline px-2 py-1.5 text-[12.5px] text-paper outline-none focus:border-electric">
                  {options.map((option) => <option key={option} value={option}>{option === 'unknown' ? 'Not sure' : option[0].toUpperCase() + option.slice(1)}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div>
            <label className="text-[10.5px] uppercase tracking-wide text-fog">Notes</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="What's it actually like here — anything worth knowing before someone moves nearby?" className="mt-1 w-full rounded-lg bg-surface-raised border border-hairline px-2.5 py-2 text-[12.5px] text-paper placeholder:text-fog outline-none focus:border-electric resize-none" />
          </div>
        </>
      )}

      <button onClick={handleSubmit} disabled={!canSubmit} className="mt-1 w-full rounded-xl bg-electric text-white text-[13px] font-medium py-2.5 disabled:opacity-40 disabled:cursor-not-allowed">Add to map</button>
    </div>
  )
}