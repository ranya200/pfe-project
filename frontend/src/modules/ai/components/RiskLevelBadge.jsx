import React from 'react'

const config = {
  vert: {
    label: 'Sain',
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-300',
    dot: 'bg-green-500',
    icon: '✅',
  },
  orange: {
    label: 'Modéré',
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-300',
    dot: 'bg-orange-500',
    icon: '⚠️',
  },
  rouge: {
    label: 'Critique',
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-300',
    dot: 'bg-red-500',
    icon: '🔴',
  },
}

const RiskLevelBadge = ({ level, score, size = 'md' }) => {
  const c = config[level] || config['vert']
  const isLarge = size === 'lg'

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${c.bg} ${c.text} ${c.border} ${isLarge ? 'text-base font-semibold' : 'text-sm font-medium'}`}>
      <span className={`w-2 h-2 rounded-full ${c.dot}`} />
      <span>{c.icon} {c.label}</span>
      {score !== undefined && (
        <span className="opacity-60 text-xs">({Math.round(score * 100)}%)</span>
      )}
    </div>
  )
}

export default RiskLevelBadge