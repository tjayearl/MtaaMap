import { useMemo, useState } from 'react'
import type { MapPoint } from '../types'

interface PriceFiltersProps {
  points: MapPoint[]
  onFilterChange: (selectedProducts: string[]) => void
}

export default function PriceFilters({ points, onFilterChange }: PriceFiltersProps) {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])

  const allProducts = useMemo(() => {
    const products = new Set<string>()
    points
      .filter((p) => p.layer === 'prices' && p.prices)
      .forEach((p) => {
        p.prices?.forEach((price) => {
          if (price.name.trim()) products.add(price.name)
        })
      })
    return Array.from(products).sort()
  }, [points])

  const handleToggle = (product: string) => {
    const updated = selectedProducts.includes(product)
      ? selectedProducts.filter((p) => p !== product)
      : [...selectedProducts, product]
    setSelectedProducts(updated)
    onFilterChange(updated)
  }

  const handleClearAll = () => {
    setSelectedProducts([])
    onFilterChange([])
  }

  if (allProducts.length === 0) {
    return (
      <div className="text-[12px] text-fog p-3">
        <p>No price data yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 p-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-wide text-fog">Filter by product</p>
        {selectedProducts.length > 0 && (
          <button
            onClick={handleClearAll}
            className="text-[10px] text-electric hover:text-electric-bright"
          >
            Clear
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {allProducts.map((product) => (
          <button
            key={product}
            onClick={() => handleToggle(product)}
            className={[
              'rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors whitespace-nowrap',
              selectedProducts.includes(product)
                ? 'border-electric bg-electric/20 text-electric'
                : 'border-hairline bg-surface-raised text-mist hover:border-electric/60',
            ].join(' ')}
          >
            {product}
          </button>
        ))}
      </div>

      {selectedProducts.length > 0 && (
        <p className="text-[10px] text-fog pt-2">
          Showing {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
