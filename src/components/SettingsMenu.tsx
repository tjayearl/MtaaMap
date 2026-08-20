import { useState } from 'react'
import type { ThemeMode } from '../types'

interface SettingsMenuProps {
  theme: ThemeMode
  onThemeChange: (theme: ThemeMode) => void
}

export default function SettingsMenu({ theme, onThemeChange }: SettingsMenuProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="pointer-events-auto relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Settings"
        className="flex items-center justify-center h-10 w-10 rounded-full bg-ink/85 backdrop-blur-md border border-hairline text-mist hover:text-paper transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="2" />
          <path
            d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
            stroke="currentColor"
            strokeWidth="1.6"
          />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-20 w-52 rounded-xl bg-surface border border-hairline shadow-lg shadow-black/30 p-1.5">
            <p className="px-2.5 pt-1.5 pb-2 text-[10.5px] uppercase tracking-wide text-fog">
              Appearance
            </p>
            {(['dark', 'light'] as ThemeMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  onThemeChange(mode)
                  setOpen(false)
                }}
                className={[
                  'w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-[13px] transition-colors',
                  theme === mode ? 'bg-surface-raised text-paper' : 'text-mist hover:bg-surface-raised/60',
                ].join(' ')}
              >
                <span className="capitalize">{mode} mode</span>
                {theme === mode && <span className="h-1.5 w-1.5 rounded-full bg-electric" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}