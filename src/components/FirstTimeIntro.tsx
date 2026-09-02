import { useEffect, useState } from 'react'

interface FirstTimeIntroProps {
  onDismiss: () => void
}

export default function FirstTimeIntro({ onDismiss }: FirstTimeIntroProps) {
  const [show, setShow] = useState(true)

  useEffect(() => {
    const seen = localStorage.getItem('mtaamap-intro-seen')
    if (seen) {
      setShow(false)
    }
  }, [])

  const handleDismiss = () => {
    localStorage.setItem('mtaamap-intro-seen', 'true')
    setShow(false)
    onDismiss()
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-hairline bg-surface shadow-xl">
        <div className="space-y-4 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-electric text-[20px] font-bold text-white">
              M
            </div>
            <div>
              <h1 className="text-[18px] font-display font-semibold text-paper">Welcome to MtaaMap</h1>
              <p className="text-[11px] uppercase tracking-wide text-fog">Mtaa Yetu</p>
            </div>
          </div>

          <div className="space-y-3 py-2">
            <div className="flex gap-3">
              <div className="mt-0.5 h-5 w-5 flex-shrink-0 rounded-full bg-electric/20 flex items-center justify-center">
                <span className="text-[11px] font-bold text-electric">📍</span>
              </div>
              <div>
                <p className="text-[13px] font-medium text-paper">Explore local data</p>
                <p className="text-[12px] text-mist mt-0.5">Browse crowdsourced info about neighborhoods, prices, and road conditions.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="mt-0.5 h-5 w-5 flex-shrink-0 rounded-full bg-electric/20 flex items-center justify-center">
                <span className="text-[11px] font-bold text-electric">💬</span>
              </div>
              <div>
                <p className="text-[13px] font-medium text-paper">Join the conversation</p>
                <p className="text-[12px] text-mist mt-0.5">Share your experience in community threads to help others make better decisions.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="mt-0.5 h-5 w-5 flex-shrink-0 rounded-full bg-electric/20 flex items-center justify-center">
                <span className="text-[11px] font-bold text-electric">✅</span>
              </div>
              <div>
                <p className="text-[13px] font-medium text-paper">Help keep data accurate</p>
                <p className="text-[12px] text-mist mt-0.5">Report outdated or incorrect information so everyone has reliable information.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="mt-0.5 h-5 w-5 flex-shrink-0 rounded-full bg-electric/20 flex items-center justify-center">
                <span className="text-[11px] font-bold text-electric">🎯</span>
              </div>
              <div>
                <p className="text-[13px] font-medium text-paper">Find what you need</p>
                <p className="text-[12px] text-mist mt-0.5">Search locations, filter by product, and sort by distance from where you are.</p>
              </div>
            </div>
          </div>

          <div className="border-t border-hairline pt-4 flex items-center justify-between">
            <p className="text-[10px] text-fog">This is always in settings if you need help later.</p>
            <button
              onClick={handleDismiss}
              className="rounded-lg bg-electric px-4 py-2 text-[13px] font-medium text-white hover:bg-electric-bright transition-colors"
            >
              Get started
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
