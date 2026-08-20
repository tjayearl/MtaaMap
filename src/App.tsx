import { useMemo, useState } from 'react'
import MapView from './components/MapView'
import BrandHeader from './components/BrandHeader'
import LayerSwitcher from './components/LayerSwitcher'
import PointDetailSheet from './components/PointDetailSheet'
import { MAP_POINTS } from './data/mockData'
import type { LayerId } from './types'

export default function App() {
  const [activeLayer, setActiveLayer] = useState<LayerId>('neighborhood')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selectedPoint = useMemo(
    () => MAP_POINTS.find((p) => p.id === selectedId) ?? null,
    [selectedId]
  )

  const handleLayerChange = (id: LayerId) => {
    setActiveLayer(id)
    setSelectedId(null)
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-ink">
      <MapView points={MAP_POINTS} activeLayer={activeLayer} selectedId={selectedId} onSelect={setSelectedId} />
      <BrandHeader />
      <LayerSwitcher active={activeLayer} onChange={handleLayerChange} />
      <PointDetailSheet point={selectedPoint} onClose={() => setSelectedId(null)} />
    </div>
  )
}
