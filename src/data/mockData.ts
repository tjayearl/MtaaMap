import type { LayerMeta, MapPoint } from '../types'

export const LAYERS: LayerMeta[] = [
  {
    id: 'neighborhood',
    label: 'Neighborhood',
    question: "What's it actually like to live here?",
    color: '#2f6fed',
    available: true,
  },
  {
    id: 'prices',
    label: 'Prices',
    question: 'Where are things cheapest right now?',
    color: '#22c55e',
    available: true,
  },
  {
    id: 'potholes',
    label: 'Road issues',
    question: 'Where should I slow down?',
    color: '#f5a524',
    available: false,
  },
]

// Kirigiti Stadium, Kiambu — real coordinates, verified via search.
// Everything below is a placeholder shape for Tjay to fill in with real,
// personally-verified kiosks/estates near where he actually lives.
export const MAP_POINTS: MapPoint[] = [
  {
    id: 'nh-kirigiti-1',
    lat: -1.1708,
    lng: 36.8464,
    layer: 'neighborhood',
    name: 'Near Kirigiti Stadium',
    area: 'Kirigiti, Kiambu',
    lastVerified: { reporterInitial: 'T', timeAgo: '1h ago', confirmations: 1 },
    neighborhood: {
      electricity: 'unknown',
      water: 'unknown',
      roads: 'mixed',
      security: 'good',
      note: "Replace with a real, specific note about this exact spot — what it's actually like day to day.",
    },
  },
  {
    id: 'pr-kirigiti-1',
    lat: -1.1695,
    lng: 36.8471,
    layer: 'prices',
    name: 'Replace with real kiosk name',
    area: 'Kirigiti, Kiambu',
    lastVerified: { reporterInitial: 'T', timeAgo: '30m ago', confirmations: 1 },
    prices: [
      { name: 'Tomatoes', price: 0, unit: 'kg' },
      { name: 'Onions', price: 0, unit: 'kg' },
      { name: 'Cabbage', price: 0, unit: 'head' },
    ],
  },
]