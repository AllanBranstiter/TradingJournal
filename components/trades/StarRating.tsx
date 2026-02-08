'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useState } from 'react'

interface StarRatingProps {
  value: number
  onChange?: (rating: number) => void
  max?: number
  size?: 'sm' | 'md' | 'lg'
  readonly?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
}

export function StarRating({
  value = 0,
  onChange,
  max = 5,
  size = 'md',
  readonly = false,
  className,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)

  const handleClick = (rating: number) => {
    if (!readonly && onChange) {
      onChange(rating)
    }
  }

  const handleMouseEnter = (rating: number) => {
    if (!readonly) {
      setHoverValue(rating)
    }
  }

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverValue(null)
    }
  }

  const displayValue = hoverValue !== null ? hoverValue : value

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {Array.from({ length: max }, (_, i) => i + 1).map(rating => {
        const isFilled = rating <= displayValue
        
        return (
          <button
            key={rating}
            type="button"
            onClick={() => handleClick(rating)}
            onMouseEnter={() => handleMouseEnter(rating)}
            onMouseLeave={handleMouseLeave}
            disabled={readonly}
            className={cn(
              'transition-all duration-150',
              readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
            )}
            aria-label={`Rate ${rating} out of ${max}`}
          >
            <Star
              className={cn(
                sizeClasses[size],
                'transition-colors duration-150',
                isFilled
                  ? 'fill-yellow-500 text-yellow-500'
                  : 'fill-none text-gray-600'
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
