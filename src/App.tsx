import { useMemo, useRef, useState } from 'react'
import MapView, { type MapViewHandle } from './components/MapView'
import Sidebar from './components/Sidebar'
import SettingsMenu from './components/SettingsMenu'
import LayerSwitcher from './components/LayerSwitcher'
import PointDetailSheet from './components/PointDetailSheet'
import { MAP_POINTS as INITIAL_POINTS } from './data/mockData'
import type { LayerId, MapPoint, ThemeMode } from './types'

export default function App() {
  const [points, setPoints] = useState<MapPoint[]>(INITIAL_POINTS)
  const [activeLayer, setActiveLayer] = useState<LayerId>('neighborhood')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [theme, setTheme] = useState<ThemeMode>('dark')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [placing, setPlacing] = useState(false)
  const [pendingPin, setPendingPin] = useState<{ lat: number; lng: number } | null>(null)
  const mapRef = useRef<MapViewHandle>(null)

  const selectedPoint = useMemo(
    () => points.find((p) => p.id === selectedId) ?? null,
    [points, selectedId]
  )

  const handleLayerChange = (id: LayerId) => {
    setActiveLayer(id)
    setSelectedId(null)
  }

  const handleSearchSelect = (result: { lat: number; lng: number }) => {
    mapRef.current?.flyTo(result.lat, result.lng, 15)
  }

  const handleStartPlacing = () => { setPlacing(true); setPendingPin(null) }
  const handleCancelPlacing = () => { setPlacing(false); setPendingPin(null) }
  const handleMapClick = (coords: { lat: number; lng: number }) => {
    if (!placing) return
    setPendingPin(coords)
    setPlacing(false)
  }
  const handleSubmitPlace = (point: MapPoint) => {
    setPoints((prev) => [...prev, point])
    setActiveLayer(point.layer)
    setPendingPin(null)
    setSelectedId(point.id)
    mapRef.current?.flyTo(point.lat, point.lng, 15)
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-ink" data-theme={theme}>
      <MapView
        ref={mapRef}
        points={points}
        activeLayer={activeLayer}
        selectedId={selectedId}
        onSelect={setSelectedId}
        theme={theme}
        placing={placing}
        onMapClick={handleMapClick}
        pendingPin={pendingPin}
      />

      <Sidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((o) => !o)}
        onSearchResult={handleSearchSelect}
        placing={placing}
        pendingPin={pendingPin}
        onStartPlacing={handleStartPlacing}
        onCancelPlacing={handleCancelPlacing}
        onSubmitPlace={handleSubmitPlace}
      />

      <div className="pointer-events-none absolute top-4 right-4 z-10">
        <SettingsMenu theme={theme} onThemeChange={setTheme} />
      </div>

      <LayerSwitcher active={activeLayer} onChange={handleLayerChange} />
      <PointDetailSheet point={selectedPoint} onClose={() => setSelectedId(null)} />
    </div>
  )
}
