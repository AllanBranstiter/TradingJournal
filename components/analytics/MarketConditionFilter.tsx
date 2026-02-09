'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface MarketConditionFilterProps {
  onFilterChange: (filters: {
    spyTrend?: string[]
    sectors?: string[]
  }) => void
}

const SPY_TRENDS = [
  { value: 'uptrend', label: 'Uptrend' },
  { value: 'downtrend', label: 'Downtrend' },
  { value: 'sideways', label: 'Sideways' },
  { value: 'choppy', label: 'Choppy' }
]

const SECTORS = [
  { value: 'technology', label: 'Technology' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'financial', label: 'Financial' },
  { value: 'energy', label: 'Energy' },
  { value: 'consumer', label: 'Consumer' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'materials', label: 'Materials' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'real estate', label: 'Real Estate' },
  { value: 'communication', label: 'Communication' }
]

export function MarketConditionFilter({ onFilterChange }: MarketConditionFilterProps) {
  const [selectedSpyTrends, setSelectedSpyTrends] = useState<string[]>([])
  const [selectedSectors, setSelectedSectors] = useState<string[]>([])

  const handleSpyTrendToggle = (trend: string) => {
    setSelectedSpyTrends(prev => {
      if (prev.includes(trend)) {
        return prev.filter(t => t !== trend)
      } else {
        return [...prev, trend]
      }
    })
  }

  const handleSectorToggle = (sector: string) => {
    setSelectedSectors(prev => {
      if (prev.includes(sector)) {
        return prev.filter(s => s !== sector)
      } else {
        return [...prev, sector]
      }
    })
  }

  const handleApply = () => {
    onFilterChange({
      spyTrend: selectedSpyTrends.length > 0 ? selectedSpyTrends : undefined,
      sectors: selectedSectors.length > 0 ? selectedSectors : undefined
    })
  }

  const handleClearAll = () => {
    setSelectedSpyTrends([])
    setSelectedSectors([])
    onFilterChange({})
  }

  const hasActiveFilters = selectedSpyTrends.length > 0 || selectedSectors.length > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Market Context Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* SPY Trend Filters */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">SPY Market Condition</Label>
          <div className="grid grid-cols-2 gap-3">
            {SPY_TRENDS.map(trend => (
              <div key={trend.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`spy-${trend.value}`}
                  checked={selectedSpyTrends.includes(trend.value)}
                  onCheckedChange={() => handleSpyTrendToggle(trend.value)}
                />
                <label
                  htmlFor={`spy-${trend.value}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {trend.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Sector Filters */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Sectors</Label>
          <div className="grid grid-cols-2 gap-3 max-h-[200px] overflow-y-auto pr-2">
            {SECTORS.map(sector => (
              <div key={sector.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`sector-${sector.value}`}
                  checked={selectedSectors.includes(sector.value)}
                  onCheckedChange={() => handleSectorToggle(sector.value)}
                />
                <label
                  htmlFor={`sector-${sector.value}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {sector.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button 
            onClick={handleApply} 
            className="flex-1"
            disabled={!hasActiveFilters}
          >
            Apply Filters
          </Button>
          <Button 
            onClick={handleClearAll} 
            variant="outline"
            disabled={!hasActiveFilters}
          >
            Clear All
          </Button>
        </div>

        {hasActiveFilters && (
          <div className="text-sm text-muted-foreground">
            Active: {selectedSpyTrends.length + selectedSectors.length} filter(s)
          </div>
        )}
      </CardContent>
    </Card>
  )
}
