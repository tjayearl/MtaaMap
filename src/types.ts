export type ThemeMode = 'dark' | 'light'

export type LayerId = 'neighborhood' | 'prices' | 'potholes'

export interface LayerMeta {
  id: LayerId
  label: string
  question: string
  color: string
  available: boolean
}

export interface PriceItem {
  name: string
  price: number
  unit: string
}

export interface NeighborhoodRating {
  electricity: 'reliable' | 'unreliable' | 'unknown'
  water: 'reliable' | 'unreliable' | 'unknown'
  roads: 'paved' | 'unpaved' | 'mixed'
  security: 'good' | 'fair' | 'concerning'
  note: string
}

export interface Contribution {
  reporterInitial: string
  timeAgo: string
  confirmations: number
}

export interface MapPoint {
  id: string
  lat: number
  lng: number
  layer: LayerId
  name: string
  area: string
  lastVerified: Contribution
  disputed?: boolean
  prices?: PriceItem[]
  neighborhood?: NeighborhoodRating
}