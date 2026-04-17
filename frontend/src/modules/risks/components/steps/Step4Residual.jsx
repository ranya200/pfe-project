import CriticalityBadge from '../CriticalityBadge'
import { criticality, reductionPct } from '../../utils/criticality'

const PROB_LABELS = {
  1: { text: 'Faible',      color: '#16a34a', bg: '#dcfce7' },
  2: { text: 'Moyenne',     color: '#ca8a04', bg: '#fef9c3' },
  3: { text: 'Assez Forte', color: '#ea580c', bg: '#ffedd5' },
  4: { text: 'Forte',       color: '#dc2626', bg: '#fee2e2' },
}

const GRAV_LABELS = {
  1: { text: 'Mineure',         color: '#16a34a', bg: '#dcfce7' },
  2: { text: 'Moyenne',         color: '#ca8a04', bg: '#fef9c3' },
  3: { text: 'Importante',      color: '#ea580c', bg: '#ffedd5' },
  4: { text: 'Très importante', color: '#dc2626', bg: '#fee2e2' },
}

function ScoreSelector({ label, value, onChange, scoreLabels }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((score) => {
          const meta = scoreLabels[score]
          const active = value === score
          return (
            <button key={score} type="button" onClick={() => onChange(score)}
              className="rounded-lg border-2 py-2 text-center transition-all"
              style={{
                borderColor: active ? meta.color : '#e2e8f0',
                background: active ? meta.bg : '#fff',
                color: active ? meta.color : '#64748b',
              }}>
              <div className="text-lg font-bold">{score}</div>
              <div className="text-[10px] font-medium leading-tight mt-0.5">{meta.text}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function Step4Residual({ form, setForm, initialCriticality = 0 }) {
  const p = Number(form.residual_probability || 0)
  const g = Number(form.residual_severity || 0)
  const c = (p && g) ? criticality(p, g) : null
  const red = c !== null ? reductionPct(initialCriticality, c) : null
  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }))

  return (
    <div className="space-y-5">

      {/* Probabilité résiduelle */}
      <ScoreSelector
        label="Probabilité résiduelle"
        value={p}
        onChange={(v) => set('residual_probability', v)}
        scoreLabels={PROB_LABELS}
      />

      {/* Gravité résiduelle */}
      <ScoreSelector
        label="Gravité résiduelle"
        value={g}
        onChange={(v) => set('residual_severity', v)}
        scoreLabels={GRAV_LABELS}
      />

      {/* Comparaison criticité initiale vs résiduelle */}
      {c !== null && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-xs text-slate-500 mb-1">Criticité initiale</div>
              <CriticalityBadge value={initialCriticality} />
            </div>
            <div className="text-slate-400 text-lg">→</div>
            <div className="text-center">
              <div className="text-xs text-slate-500 mb-1">Criticité résiduelle</div>
              <CriticalityBadge value={c} />
            </div>
          </div>
          {red !== null && (
            <div className={`text-sm font-semibold ${red > 0 ? 'text-green-700' : red < 0 ? 'text-red-600' : 'text-slate-600'}`}>
              {red > 0 ? `✅ Réduction de ${red}% de la criticité` : red < 0 ? `⚠️ Augmentation de ${Math.abs(red)}% de la criticité` : 'Pas de changement de criticité'}
            </div>
          )}
        </div>
      )}

      {/* Statut final du risque */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Statut final du risque
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'Ouvert',    color: '#dc2626', bg: '#fee2e2' },
            { value: 'Atténué',   color: '#ca8a04', bg: '#fef9c3' },
            { value: 'Clôturé',   color: '#16a34a', bg: '#dcfce7' },
          ].map((s) => {
            const active = (form.risk_status || 'Ouvert') === s.value
            return (
              <button key={s.value} type="button"
                className="rounded-lg border-2 py-2 text-sm font-medium transition-all"
                style={{
                  borderColor: active ? s.color : '#e2e8f0',
                  background: active ? s.bg : '#fff',
                  color: active ? s.color : '#64748b',
                }}
                onClick={() => set('risk_status', s.value)}>
                {s.value}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
