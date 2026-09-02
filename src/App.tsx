import { useMemo, useRef, useState } from 'react'
import MapView, { type MapViewHandle } from './components/MapView'
import Sidebar from './components/Sidebar'
import SettingsMenu from './components/SettingsMenu'
import LayerSwitcher from './components/LayerSwitcher'
import PointDetailSheet from './components/PointDetailSheet'
import CommunityPanel from './components/CommunityPanel'
import FirstTimeIntro from './components/FirstTimeIntro'
import { MAP_POINTS as INITIAL_POINTS } from './data/mockData'
import type { LayerId, MapPoint, PriceItem, ThemeMode } from './types'

export default function App() {
  const [points, setPoints] = useState<MapPoint[]>(INITIAL_POINTS)
  const [activeLayer, setActiveLayer] = useState<LayerId>('neighborhood')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [theme, setTheme] = useState<ThemeMode>('dark')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [placing, setPlacing] = useState(false)
  const [pendingPin, setPendingPin] = useState<{ lat: number; lng: number } | null>(null)
  const [reporting, setReporting] = useState(false)
  const [communityOpen, setCommunityOpen] = useState(false)
  const [communityPointId, setCommunityPointId] = useState<string | null>(null)
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null)
  const [priceFilters, setPriceFilters] = useState<string[]>([])
  const mapRef = useRef<MapViewHandle>(null)

  const selectedPoint = useMemo(
    () => points.find((p) => p.id === selectedId) ?? null,
    [points, selectedId]
  )

  const filteredPoints = useMemo(() => {
    if (priceFilters.length === 0) return points
    if (activeLayer !== 'prices') return points
    return points.filter((p) => {
      if (p.layer !== 'prices') return true
      if (!p.prices) return false
      return p.prices.some((price) => priceFilters.includes(price.name))
    })
  }, [points, priceFilters, activeLayer])

  const handleLayerChange = (id: LayerId) => {
    setActiveLayer(id)
    setSelectedId(null)
  }

  const handleSearchSelect = (result: { lat: number; lng: number }) => {
    mapRef.current?.flyTo(result.lat, result.lng, 15)
  }

  const handleStartPlacing = () => {
    setPlacing(true)
    setPendingPin(null)
    setReporting(false)
  }
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

  const handleStartReporting = () => {
    setReporting(true)
    setPlacing(false)
    setPendingPin(null)
  }

  const handleCancelReporting = () => setReporting(false)

  const handleSubmitReport = (pointId: string, reason: string, correctedPrices?: PriceItem[]) => {
    setPoints((prev) => prev.map((point) => point.id === pointId
      ? {
          ...point,
          disputed: true,
          reportReason: reason,
          lastVerified: { reporterInitial: 'You', timeAgo: 'just now', confirmations: 1 },
          ...(correctedPrices ? { prices: correctedPrices } : {}),
        }
      : point))
    setReporting(false)
    const reportedPoint = points.find((point) => point.id === pointId)
    if (reportedPoint) {
      setActiveLayer(reportedPoint.layer)
      setSelectedId(reportedPoint.id)
      mapRef.current?.flyTo(reportedPoint.lat, reportedPoint.lng, 15)
    }
  }

  const handleConfirmPoint = (pointId: string) => {
    setPoints((prev) => prev.map((point) => point.id === pointId
      ? { ...point, lastVerified: { reporterInitial: 'You', timeAgo: 'just now', confirmations: point.lastVerified.confirmations + 1 } }
      : point))
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-ink" data-theme={theme}>
      <MapView
        ref={mapRef}
        points={filteredPoints}
        activeLayer={activeLayer}
        selectedId={selectedId}
        onSelect={setSelectedId}
        theme={theme}
        placing={placing}
        onMapClick={handleMapClick}
        pendingPin={pendingPin}
        onCenterChange={setMapCenter}
      />

      <Sidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((o) => !o)}
        onSearchResult={handleSearchSelect}
        onOpenCommunity={() => {
          setCommunityOpen(true)
          setCommunityPointId(selectedId ?? null)
        }}
        placing={placing}
        pendingPin={pendingPin}
        onStartPlacing={handleStartPlacing}
        onCancelPlacing={handleCancelPlacing}
        onSubmitPlace={handleSubmitPlace}
        points={points}
        filteredPoints={filteredPoints}
        reporting={reporting}
        onStartReporting={handleStartReporting}
        onCancelReporting={handleCancelReporting}
        onSubmitReport={handleSubmitReport}
        activeLayer={activeLayer}
        selectedId={selectedId}
        onSelectPoint={setSelectedId}
        mapCenter={mapCenter}
        onPriceFiltersChange={setPriceFilters}
      />

      <div className="pointer-events-none absolute top-4 right-4 z-10">
        <SettingsMenu theme={theme} onThemeChange={setTheme} />
      </div>

      <LayerSwitcher active={activeLayer} onChange={handleLayerChange} />
      <PointDetailSheet
        point={selectedPoint}
        onClose={() => setSelectedId(null)}
        onConfirm={handleConfirmPoint}
        onReport={() => {
          setSelectedId(null)
          setSidebarOpen(true)
          handleStartReporting()
        }}
        onDiscuss={(pointId) => {
          setCommunityOpen(true)
          setCommunityPointId(pointId)
          setSelectedId(pointId)
        }}
      />

      <CommunityPanel
        isOpen={communityOpen}
        initialPointId={communityPointId ?? selectedId}
        onClose={() => setCommunityOpen(false)}
        onSelectPoint={(pointId) => {
          setSelectedId(pointId)
          setCommunityPointId(pointId)
          const point = points.find((p) => p.id === pointId)
          if (point) {
            mapRef.current?.flyTo(point.lat, point.lng, 15)
          }
        }}
      />

      <FirstTimeIntro onDismiss={() => {}} />
    </div>
  )
}
