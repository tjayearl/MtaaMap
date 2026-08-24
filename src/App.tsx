import { useMemo, useRef, useState } from 'react'
import MapView, { type MapViewHandle } from './components/MapView'
import Sidebar from './components/Sidebar'
import SettingsMenu from './components/SettingsMenu'
import LayerSwitcher from './components/LayerSwitcher'
import PointDetailSheet from './components/PointDetailSheet'
import { MAP_POINTS } from './data/mockData'
import type { LayerId, ThemeMode } from './types'

export default function App() {
  const [activeLayer, setActiveLayer] = useState<LayerId>('neighborhood')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [theme, setTheme] = useState<ThemeMode>('dark')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const mapRef = useRef<MapViewHandle>(null)

  const selectedPoint = useMemo(
    () => MAP_POINTS.find((p) => p.id === selectedId) ?? null,
    [selectedId]
  )

  const handleLayerChange = (id: LayerId) => {
    setActiveLayer(id)
    setSelectedId(null)
  }

  const handleSearchSelect = (result: { lat: number; lng: number }) => {
    mapRef.current?.flyTo(result.lat, result.lng, 15)
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-ink" data-theme={theme}>
      <MapView
        ref={mapRef}
        points={MAP_POINTS}
        activeLayer={activeLayer}
        selectedId={selectedId}
        onSelect={setSelectedId}
        theme={theme}
      />

      <Sidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((o) => !o)}
        onSearchResult={handleSearchSelect}
      />

      <div className="pointer-events-none absolute top-4 right-4 z-10">
        <SettingsMenu theme={theme} onThemeChange={setTheme} />
      </div>

      <LayerSwitcher active={activeLayer} onChange={handleLayerChange} />
      <PointDetailSheet point={selectedPoint} onClose={() => setSelectedId(null)} />
    </div>
  )
}
