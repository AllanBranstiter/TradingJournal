'use client'

import { cn } from '@/lib/utils/cn'

interface EmotionSelectorProps {
  value: string[]
  onChange: (emotions: string[]) => void
  type?: 'pre-trade' | 'post-trade'
  className?: string
}

const PRE_TRADE_EMOTIONS = [
  { value: 'confident', label: 'Confident', emoji: '💪' },
  { value: 'anxious', label: 'Anxious', emoji: '😰' },
  { value: 'neutral', label: 'Neutral', emoji: '😐' },
  { value: 'fomo', label: 'FOMO', emoji: '😱' },
  { value: 'revenge', label: 'Revenge', emoji: '😤' },
  { value: 'overconfident', label: 'Overconfident', emoji: '🤩' },
  { value: 'fearful', label: 'Fearful', emoji: '😨' },
  { value: 'greedy', label: 'Greedy', emoji: '🤑' },
  { value: 'frustrated', label: 'Frustrated', emoji: '😣' },
  { value: 'disciplined', label: 'Disciplined', emoji: '🎯' },
  { value: 'impulsive', label: 'Impulsive', emoji: '⚡' },
  { value: 'patient', label: 'Patient', emoji: '🧘' },
]

const POST_TRADE_EMOTIONS = [
  { value: 'relieved', label: 'Relieved', emoji: '😌' },
  { value: 'regret', label: 'Regret', emoji: '😔' },
  { value: 'validated', label: 'Validated', emoji: '✅' },
  { value: 'frustrated', label: 'Frustrated', emoji: '😣' },
  { value: 'proud', label: 'Proud', emoji: '🏆' },
  { value: 'disappointed', label: 'Disappointed', emoji: '😞' },
  { value: 'confident', label: 'Confident', emoji: '💪' },
  { value: 'anxious', label: 'Anxious', emoji: '😰' },
  { value: 'greedy', label: 'Greedy', emoji: '🤑' },
  { value: 'disciplined', label: 'Disciplined', emoji: '🎯' },
]

export function EmotionSelector({
  value = [],
  onChange,
  type = 'pre-trade',
  className,
}: EmotionSelectorProps) {
  const emotions = type === 'pre-trade' ? PRE_TRADE_EMOTIONS : POST_TRADE_EMOTIONS

  const toggleEmotion = (emotion: string) => {
    if (value.includes(emotion)) {
      onChange(value.filter(e => e !== emotion))
    } else {
      onChange([...value, emotion])
    }
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {emotions.map(emotion => {
        const isSelected = value.includes(emotion.value)
        
        return (
          <button
            key={emotion.value}
            type="button"
            onClick={() => toggleEmotion(emotion.value)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border',
              isSelected
                ? 'bg-accent-purple text-white border-accent-purple shadow-sm'
                : 'bg-background-tertiary text-text-secondary border-text-tertiary hover:bg-background-secondary hover:text-text-primary hover:border-text-secondary'
            )}
          >
            <span>{emotion.emoji}</span>
            <span>{emotion.label}</span>
          </button>
        )
      })}
    </div>
  )
}
