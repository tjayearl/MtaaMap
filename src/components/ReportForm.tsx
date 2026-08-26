import { useMemo, useState } from 'react'
import type { MapPoint, PriceItem } from '../types'

interface ReportFormProps {
  points: MapPoint[]
  onSubmit: (pointId: string, reason: string, correctedPrices?: PriceItem[]) => void
  onCancel: () => void
}

export default function ReportForm({ points, onSubmit, onCancel }: ReportFormProps) {
  const [selectedId, setSelectedId] = useState<string>(points[0]?.id ?? '')
  const [reason, setReason] = useState('')
  const [correctedPrices, setCorrectedPrices] = useState<PriceItem[] | null>(
    points[0]?.prices?.map((price) => ({ ...price })) ?? null
  )

  const selectedPoint = useMemo(
    () => points.find((p) => p.id === selectedId) ?? null,
    [points, selectedId]
  )

  const handleSelectPoint = (id: string) => {
    setSelectedId(id)
    const point = points.find((p) => p.id === id)
    setCorrectedPrices(point?.prices ? point.prices.map((p) => ({ ...p })) : null)
  }

  const updateCorrectedPrice = (i: number, price: number) => {
    setCorrectedPrices((rows) => rows?.map((r, idx) => (idx === i ? { ...r, price } : r)) ?? null)
  }

  const canSubmit = selectedId && reason.trim().length > 0

  const handleSubmit = () => {
    if (!canSubmit) return
    onSubmit(selectedId, reason.trim(), correctedPrices ?? undefined)
  }

  if (points.length === 0) {
    return (
      <div className="mt-2 rounded-xl bg-surface-raised border border-hairline px-3 py-3">
        <p className="text-[13px] text-mist">No places to report yet — add one first.</p>
        <button onClick={onCancel} className="mt-2 text-[12px] text-fog hover:text-mist">Close</button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-paper">Report incorrect info</p>
        <button onClick={onCancel} className="text-[11px] text-fog hover:text-mist">Cancel</button>
      </div>
      <div>
        <label className="text-[10.5px] uppercase tracking-wide text-fog">Which place?</label>
        <select value={selectedId} onChange={(e) => handleSelectPoint(e.target.value)} className="mt-1 w-full rounded-lg bg-surface-raised border border-hairline px-2.5 py-2 text-[13px] text-paper outline-none focus:border-electric">
          {points.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.area}</option>)}
        </select>
      </div>
      {selectedPoint?.prices && correctedPrices && (
        <div>
          <label className="text-[10.5px] uppercase tracking-wide text-fog">What's the real price?</label>
          <div className="mt-1.5 flex flex-col gap-1.5">
            {correctedPrices.map((row, i) => (
              <div key={row.name} className="flex items-center justify-between gap-2 rounded-lg bg-surface-raised border border-hairline px-2.5 py-1.5">
                <span className="text-[12.5px] text-mist">{row.name}</span>
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-fog">KES</span>
                  <input type="number" value={row.price || ''} onChange={(e) => updateCorrectedPrice(i, Number(e.target.value))} className="w-16 bg-transparent text-[12.5px] text-paper text-right outline-none" />
                  <span className="text-[11px] text-fog">/{row.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div>
        <label className="text-[10.5px] uppercase tracking-wide text-fog">What's wrong, exactly?</label>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="e.g. I bought tomatoes here today and paid a different price than shown." className="mt-1 w-full rounded-lg bg-surface-raised border border-hairline px-2.5 py-2 text-[12.5px] text-paper placeholder:text-fog outline-none focus:border-electric resize-none" />
      </div>
      <button onClick={handleSubmit} disabled={!canSubmit} className="mt-1 w-full rounded-xl bg-dispute text-white text-[13px] font-medium py-2.5 disabled:opacity-40 disabled:cursor-not-allowed">Submit report</button>
    </div>
  )
}