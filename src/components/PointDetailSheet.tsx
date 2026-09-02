import { useState } from 'react'
import type { Map as MapLibreGLMap } from 'maplibre-gl'
import type { MapPoint, UUID } from '../types'
import { RatingComponent } from './RatingComponent'
import { DirectionsFlow } from './DirectionsFlow'

interface PointDetailSheetProps {
  point: MapPoint | null
  onClose: () => void
  onConfirm: (pointId: string) => void
  onReport: () => void
  onDiscuss: (pointId: string) => void
  map?: MapLibreGLMap | null
}

const ratingTone: Record<string, string> = {
  reliable: 'text-verified',
  good: 'text-verified',
  paved: 'text-verified',
  fair: 'text-flag',
  mixed: 'text-flag',
  unreliable: 'text-dispute',
  unpaved: 'text-dispute',
  concerning: 'text-dispute',
  unknown: 'text-fog',
}

export default function PointDetailSheet({ point, onClose, onConfirm, onReport, onDiscuss, map }: PointDetailSheetProps) {
  const open = point !== null
  const [showDirections, setShowDirections] = useState(false)
  const [userRating, setUserRating] = useState<number | null>(null)

  return (
    <div
      className={[
        'absolute inset-x-0 bottom-0 z-20 transition-transform duration-300 ease-out',
        open ? 'translate-y-0' : 'translate-y-full',
      ].join(' ')}
    >
      <div className="mx-auto max-w-lg rounded-t-3xl bg-surface border-t border-x border-hairline pb-[calc(env(safe-area-inset-bottom)+16px)] shadow-[0_-8px_30px_rgba(0,0,0,0.4)]">
        <div className="flex justify-center pt-2.5">
          <div className="h-1 w-9 rounded-full bg-hairline" />
        </div>

        {point && (
          <div className="px-5 pt-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display font-semibold text-[18px] text-paper leading-tight">
                  {point.name}
                </h2>
                <p className="text-[13px] text-fog mt-0.5">{point.area}</p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="shrink-0 rounded-full h-8 w-8 flex items-center justify-center bg-surface-raised text-mist hover:text-paper"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="verify-pulse absolute inline-flex h-full w-full rounded-full bg-verified" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-verified" />
              </span>
              <p className="font-data text-[12px] text-mist">
                Confirmed {point.lastVerified.timeAgo} · {point.lastVerified.confirmations} people agree
              </p>
              {point.disputed && (
                <span className="ml-auto rounded-full bg-dispute/15 text-dispute text-[11px] font-medium px-2 py-0.5">
                  Recently corrected
                </span>
              )}
            </div>

            {point.disputed && point.reportReason && (
              <div className="mt-2.5 rounded-xl bg-dispute/10 border border-dispute/30 px-3 py-2.5">
                <p className="text-[12px] text-dispute leading-relaxed">{point.reportReason}</p>
              </div>
            )}

            <div className="mt-4 border-t border-hairline pt-4">
              {point.prices && (
                <ul className="space-y-2.5">
                  {point.prices.map((item) => (
                    <li key={item.name} className="flex items-center justify-between">
                      <span className="text-[14px] text-mist">{item.name}</span>
                      <span className="font-data text-[14px] text-paper">
                        KES {item.price}
                        <span className="text-fog">/{item.unit}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {point.neighborhood && (
                <div>
                  <dl className="grid grid-cols-2 gap-3">
                    {(
                      [
                        ['Electricity', point.neighborhood.electricity],
                        ['Water Available', point.neighborhood.water_availability],
                        ['Roads', point.neighborhood.roads],
                        ['Security', point.neighborhood.security],
                      ] as const
                    ).map(([label, value]) => (
                      <div key={label} className="rounded-xl bg-surface-raised px-3 py-2">
                        <dt className="text-[10.5px] uppercase tracking-wide text-fog">{label}</dt>
                        <dd className={`text-[13px] font-medium capitalize mt-0.5 ${ratingTone[value]}`}>
                          {value}
                        </dd>
                      </div>
                    ))}
                    <div className="rounded-xl bg-surface-raised px-3 py-2">
                      <dt className="text-[10.5px] uppercase tracking-wide text-fog">Water Quality</dt>
                      <dd className={`text-[13px] font-medium capitalize mt-0.5 ${ratingTone[point.neighborhood.water_potability]}`}>
                        {point.neighborhood.water_potability === 'safe_to_drink' ? 'Safe to drink' : point.neighborhood.water_potability === 'needs_treatment' ? 'Needs treatment' : 'Unknown'}
                      </dd>
                    </div>
                  </dl>
                  <p className="text-[13px] text-mist leading-relaxed mt-3">
                    {point.neighborhood.note}
                  </p>
                </div>
              )}

              {/* Rating Component */}
              <RatingComponent
                pointId={point.id as UUID}
                averageScore={4.5}
                totalRatings={12}
                userRating={userRating}
                onRate={setUserRating}
              />
            </div>

            <div className="mt-4 flex gap-2 pb-1">
              <button onClick={() => onConfirm(point.id)} className="flex-1 rounded-xl bg-electric text-white text-[13px] font-medium py-2.5">
                This matches what I see
              </button>
              <button onClick={() => setShowDirections(true)} className="flex-1 rounded-xl bg-surface-raised text-paper text-[13px] font-medium py-2.5 border border-hairline">
                Get Directions
              </button>
            </div>
            <div className="mt-2 pb-1 flex gap-2">
              <button onClick={() => onDiscuss(point.id)} className="flex-1 rounded-xl bg-surface-raised text-paper text-[13px] font-medium py-2.5 border border-hairline">
                What&apos;s your opinion?
              </button>
              <button onClick={onReport} className="flex-1 rounded-xl bg-surface-raised text-paper text-[13px] font-medium py-2.5 border border-hairline">
                Report different info
              </button>
            </div>

            {/* Directions Flow Modal */}
            {showDirections && (
              <DirectionsFlow
                map={map || null}
                pointLat={point.lat}
                pointLng={point.lng}
                pointName={point.name}
                onClose={() => setShowDirections(false)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}