import { useEffect, useState } from 'react'
import type { UUID } from '../types'

interface RatingComponentProps {
  pointId: UUID
  averageScore: number
  totalRatings: number
  userRating?: number | null
  onRate?: (score: number) => void
}

export function RatingComponent({ pointId, averageScore, totalRatings, userRating, onRate }: RatingComponentProps) {
  const [score, setScore] = useState<number | null>(userRating ?? null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setScore(userRating ?? null)
  }, [userRating])

  const handleStarClick = async (value: number) => {
    setScore(value)
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/points/${pointId}/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ score: value }),
      })
      if (response.ok) {
        onRate?.(value)
      }
    } catch (error) {
      console.error('Failed to submit rating:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClear = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/points/${pointId}/rating`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      })
      if (response.ok) {
        setScore(null)
        onRate?.(0)
      }
    } catch (error) {
      console.error('Failed to delete rating:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="rounded-xl bg-surface-raised px-3 py-2">
      <div className="flex items-center justify-between">
        <div>
          <dt className="text-[10.5px] uppercase tracking-wide text-fog">Community Rating</dt>
          <dd className="text-[13px] font-medium mt-0.5">
            {totalRatings > 0 ? (
              <>
                <span className="text-electric">{averageScore.toFixed(1)}</span>
                <span className="text-fog text-[11px] ml-1">({totalRatings})</span>
              </>
            ) : (
              <span className="text-fog">No ratings yet</span>
            )}
          </dd>
        </div>
      </div>
      
      {/* Star rating input */}
      <div className="flex gap-1 mt-2">
        {[1, 2, 3, 4, 5].map(i => (
          <button
            key={i}
            onClick={() => handleStarClick(i)}
            disabled={isSubmitting}
            className={`text-lg transition-colors ${
              score && i <= score
                ? 'text-electric'
                : 'text-fog hover:text-mist'
            }`}
          >
            ★
          </button>
        ))}
      </div>
      
      {score && (
        <button
          onClick={handleClear}
          disabled={isSubmitting}
          className="text-[11px] text-fog hover:text-electric mt-1"
        >
          Clear rating
        </button>
      )}
    </div>
  )
}
