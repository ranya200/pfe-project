const STEP_LABELS = [
  { num: 1, title: 'Analyse',          icon: '🔍' },
  { num: 2, title: 'Évaluation',       icon: '📊' },
  { num: 3, title: "Plan d'action",    icon: '🎯' },
  { num: 4, title: 'Risque résiduel',  icon: '✅' },
]

export default function RiskStepper({ step, completedSteps = 0, onStepClick }) {
  return (
    <div className="flex items-center">
      {STEP_LABELS.map((s, i) => {
        const isDone = completedSteps >= s.num
        const isActive = step === s.num
        const isClickable = onStepClick && s.num <= completedSteps + 1

        return (
          <div key={s.num} className="flex items-center" style={{ flex: 1 }}>
            <div
              className={`flex flex-col items-center transition-all ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
              style={{ flex: 1 }}
              onClick={() => isClickable && onStepClick(s.num)}
            >
              {/* Cercle */}
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all"
                style={{
                  background: isDone ? '#16a34a' : isActive ? '#2563EB' : '#e2e8f0',
                  color: isDone || isActive ? '#fff' : '#94a3b8',
                  boxShadow: isActive ? '0 0 0 3px #bfdbfe' : 'none',
                }}
              >
                {isDone && !isActive ? '✓' : s.num}
              </div>
              {/* Label */}
              <span
                className="mt-1 text-center text-[10px] font-medium leading-tight"
                style={{
                  color: isActive ? '#2563EB' : isDone ? '#16a34a' : '#94a3b8',
                }}
              >
                {s.title}
              </span>
            </div>

            {/* Trait de connexion */}
            {i < STEP_LABELS.length - 1 && (
              <div
                className="h-0.5 flex-1 -mt-4 transition-all"
                style={{ background: completedSteps > s.num ? '#16a34a' : '#e2e8f0' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
