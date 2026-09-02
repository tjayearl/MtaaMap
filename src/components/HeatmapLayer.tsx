import { useEffect } from 'react'
import type { Map as MapLibreGLMap } from 'maplibre-gl'

interface HeatmapLayerProps {
  map: MapLibreGLMap | null
  layer: string
  metric: string
  visible: boolean
}

interface HeatmapDataPoint {
  lat: number
  lng: number
  intensity: number
}

export function HeatmapLayer({ map, layer, metric, visible }: HeatmapLayerProps) {
  useEffect(() => {
    if (!map || !visible) return

    const addHeatmapLayer = async () => {
      try {
        const response = await fetch(`/api/heatmap/data?layer=${layer}&metric=${metric}`)
        const data = await response.json()

        // Convert to GeoJSON feature collection
        const features = data.data.map((point: HeatmapDataPoint) => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [point.lng, point.lat] },
          properties: { intensity: point.intensity },
        }))

        // Remove existing source/layer if present
        if (map.getLayer('heatmap-layer')) map.removeLayer('heatmap-layer')
        if (map.getSource('heatmap-data')) map.removeSource('heatmap-data')

        // Add source and layer
        map.addSource('heatmap-data', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features },
        })

        map.addLayer({
          id: 'heatmap-layer',
          type: 'heatmap',
          source: 'heatmap-data',
          paint: {
            'heatmap-weight': ['interpolate', ['linear'], ['get', 'intensity'], 0, 0, 1, 1],
            'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 3],
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0,
              'rgba(0, 255, 0, 0)',
              0.25,
              'rgba(255, 255, 0, 0.4)',
              0.5,
              'rgba(255, 165, 0, 0.6)',
              0.75,
              'rgba(255, 69, 0, 0.8)',
              1,
              'rgba(255, 0, 0, 1)',
            ],
            'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 9, 20],
            'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 1, 9, 0],
          },
        })
      } catch (error) {
        console.error('Failed to load heatmap data:', error)
      }
    }

    if (map.isStyleLoaded()) {
      addHeatmapLayer()
    } else {
      map.on('load', addHeatmapLayer)
    }

    return () => {
      if (map.getLayer('heatmap-layer')) map.removeLayer('heatmap-layer')
      if (map.getSource('heatmap-data')) map.removeSource('heatmap-data')
    }
  }, [map, layer, metric, visible])

  return null
}
