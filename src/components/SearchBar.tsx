import { useEffect, useRef, useState } from 'react'

interface SearchResult {
  label: string
  lat: number
  lng: number
}

interface SearchBarProps {
  onResultSelect: (result: SearchResult) => void
}

interface NominatimItem {
  display_name: string
  lat: string
  lon: string
}

async function searchPlaces(query: string): Promise<SearchResult[]> {
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', query)
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('limit', '6')
  url.searchParams.set('countrycodes', 'ke')

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Search request failed (${res.status})`)
  const data = await res.json()

  return (data as NominatimItem[]).map((item) => ({
    label: item.display_name,
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
  }))
}

export default function SearchBar({ onResultSelect }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (query.trim().length < 3) {
      debounceRef.current = setTimeout(() => {
        setResults([])
        setError(null)
      }, 0)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const found = await searchPlaces(query.trim())
        setResults(found)
        setOpen(true)
        if (found.length === 0) {
          setError('No matches found — try a different spelling or a nearby landmark.')
        }
      } catch (err) {
        console.error('[MtaaMap] search failed:', err)
        setResults([])
        setOpen(true)
        setError(
          err instanceof TypeError
            ? 'Search is temporarily unreachable (network/CORS). Try again in a moment.'
            : 'Search failed. Try again.'
        )
      } finally {
        setLoading(false)
      }
    }, 400)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  const handleSelect = (result: SearchResult) => {
    onResultSelect(result)
    setQuery(result.label.split(',')[0])
    setOpen(false)
  }

  return (
    <div className="pointer-events-auto relative w-full">
      <div className="flex items-center gap-2 rounded-full bg-surface-raised border border-hairline px-3.5 py-2.5">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="shrink-0 text-fog">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => (results.length > 0 || error) && setOpen(true)}
          placeholder="Search a county, town, or place..."
          className="flex-1 bg-transparent text-[13px] text-paper placeholder:text-fog outline-none min-w-0"
        />
        {loading && (
          <span className="h-3 w-3 shrink-0 rounded-full border-2 border-fog border-t-electric animate-spin" />
        )}
      </div>

      {open && (results.length > 0 || error) && (
        <div className="absolute top-full mt-1.5 w-full rounded-xl bg-surface border border-hairline overflow-hidden shadow-lg shadow-black/30 max-h-64 overflow-y-auto z-30">
          {error && (
            <p className="px-3.5 py-2.5 text-[12px] text-flag">{error}</p>
          )}
          {results.map((r, i) => (
            <button
              key={`${r.lat}-${r.lng}-${i}`}
              onClick={() => handleSelect(r)}
              className="w-full text-left px-3.5 py-2.5 text-[12.5px] text-mist hover:bg-surface-raised hover:text-paper transition-colors border-b border-hairline last:border-b-0"
            >
              {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}