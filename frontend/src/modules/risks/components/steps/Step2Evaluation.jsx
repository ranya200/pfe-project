import CriticalityBadge from '../CriticalityBadge'
import { autoMeasureText, criticality } from '../../utils/criticality'

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

const inputCls = "w-full rounded border border-slate-300 bg-white p-2 text-sm focus:border-[#2563EB] focus:outline-none"

function ScoreSelector({ label, value, onChange, scoreLabels }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((score) => {
          const meta = scoreLabels[score]
          const active = value === score
          return (
            <button
              key={score}
              type="button"
              onClick={() => onChange(score)}
              className="rounded-lg border-2 py-2 text-center transition-all"
              style={{
                borderColor: active ? meta.color : '#e2e8f0',
                background: active ? meta.bg : '#fff',
                color: active ? meta.color : '#64748b',
              }}
            >
              <div className="text-lg font-bold">{score}</div>
              <div className="text-[10px] font-medium leading-tight mt-0.5">{meta.text}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function Step2Evaluation({ form, setForm }) {
  const p = Number(form.probability || 0)
  const g = Number(form.severity || 0)
  const c = (p && g) ? criticality(p, g) : null
  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }))

  return (
    <div className="space-y-5">

      {/* Probabilité */}
      <ScoreSelector
        label="Probabilité d'occurrence"
        value={p}
        onChange={(v) => set('probability', v)}
        scoreLabels={PROB_LABELS}
      />

      {/* Gravité */}
      <ScoreSelector
        label="Gravité / Sévérité"
        value={g}
        onChange={(v) => set('severity', v)}
        scoreLabels={GRAV_LABELS}
      />

      {/* Résultat criticité */}
      {c !== null && (
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <CriticalityBadge value={c} />
          <div>
            <div className="text-sm font-semibold text-slate-700">Criticité : {c}</div>
            <div className="text-xs text-slate-500">{autoMeasureText(c)}</div>
          </div>
        </div>
      )}

      {/* Matrice 4×4 */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Matrice de criticité</label>
        <div className="grid grid-cols-4 gap-1 rounded border border-slate-200 p-2">
          {[4, 3, 2, 1].map((yy) => [1, 2, 3, 4].map((xx) => {
            const v = xx * yy
            const active = xx === g && yy === p
            return (
              <div key={`${yy}-${xx}`}
                className={`h-10 rounded border text-center text-xs leading-10 font-semibold ${active ? 'ring-2 ring-[#2563EB] ring-offset-1' : ''}`}
                style={{ background: v <= 4 ? '#DCFCE7' : v <= 8 ? '#FEF3C7' : '#FEE2E2',
                         color: v <= 4 ? '#166534' : v <= 8 ? '#92400E' : '#991B1B' }}>
                {v}
              </div>
            )
          }))}
        </div>
      </div>

      {/* Décision */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Décision</label>
        <div className="grid grid-cols-3 gap-2">
          {['Acceptation', 'Réduction', 'Éradication'].map((d) => (
            <button key={d} type="button"
              className={`rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all ${form.decision === d ? 'border-[#2563EB] bg-blue-50 text-[#2563EB]' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
              onClick={() => set('decision', d)}>{d}</button>
          ))}
        </div>
      </div>

      {/* Justification */}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Justification</label>
        <textarea className={inputCls} rows={3} value={form.justification || ''} onChange={(e) => set('justification', e.target.value)} />
      </div>
    </div>
  )
}
