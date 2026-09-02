import { useEffect, useState } from 'react'

interface LeaderboardEntry {
  rank: number
  user_id: string
  display_name: string
  confirmed_contributions: number
  average_rating: number
  trust_score: number
}

interface LeaderboardComponentProps {
  metric?: 'contributions' | 'rating'
  limit?: number
}

export function LeaderboardComponent({ metric = 'contributions', limit = 10 }: LeaderboardComponentProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const response = await fetch(`/api/leaderboard?metric=${metric}&limit=${limit}`)
        const data = await response.json()
        setLeaderboard(data)
      } catch (error) {
        console.error('Failed to load leaderboard:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadLeaderboard()
  }, [metric, limit])

  if (isLoading) return <div className="text-center text-fog text-[13px] py-4">Loading...</div>

  if (leaderboard.length === 0) {
    return <div className="text-center text-fog text-[13px] py-4">No contributors yet</div>
  }

  return (
    <div className="divide-y divide-hairline">
      {leaderboard.map((entry, i) => (
        <div
          key={entry.user_id}
          className={`px-3 py-2 ${i === 0 ? 'bg-surface-raised border-l-2 border-electric' : ''}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-bold ${
                i === 0 ? 'text-electric' : i === 1 ? 'text-mist' : i === 2 ? 'text-fog' : 'text-fog'
              }`}>
                #{entry.rank}
              </span>
              <div>
                <div className="text-[12px] font-medium text-paper">{entry.display_name}</div>
                <div className="text-[10px] text-fog">
                  {metric === 'contributions' ? (
                    <>✓ {entry.confirmed_contributions} verified</>
                  ) : (
                    <>★ {entry.average_rating.toFixed(1)} avg</>
                  )}
                </div>
              </div>
            </div>
            {entry.trust_score > 0 && (
              <span className="text-[10px] text-electric font-bold">+{entry.trust_score}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
