import { criticalityMeta } from '../utils/criticality'

export default function CriticalityBadge({ value }) {
  const v = Number(value || 0)
  const meta = criticalityMeta(v)
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ backgroundColor: meta.bg, color: meta.color }}
    >
      {v} - {meta.label}
    </span>
  )
}
