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

export interface CommunityComment {
  id: string
  author: string
  body: string
  createdAt: string
  parentId?: string
}

export interface CommunityThread {
  pointId: string
  title: string
  area: string
  commentCount: number
  latestSnippet: string
  latestActivity: string
  comments: CommunityComment[]
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
  reportReason?: string
  prices?: PriceItem[]
  neighborhood?: NeighborhoodRating
}