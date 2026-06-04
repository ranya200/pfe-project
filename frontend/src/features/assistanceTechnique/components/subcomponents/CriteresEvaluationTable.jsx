const SATISFACTION_OPTIONS = [
  { value: 'tres_satisfait',    label: 'Très satisfait',    score: 4 },
  { value: 'satisfait',         label: 'Satisfait',         score: 3 },
  { value: 'insatisfait',       label: 'Insatisfait',       score: 2 },
  { value: 'tres_insatisfait',  label: 'Très insatisfait',  score: 1 },
  { value: 'na',                label: 'N/A',               score: null },
]

function scoreColor(score) {
  if (!score) return 'text-gray-400'
  if (score >= 3) return 'text-green-700 font-semibold'
  if (score === 2) return 'text-orange-600 font-semibold'
  return 'text-red-600 font-bold'
}

export default function CriteresEvaluationTable({ criteres = [], onChange }) {
  const update = (idx, field, val) => {
    const next = criteres.map((c, i) => {
      if (i !== idx) return c
      const updated = { ...c, [field]: val }
      if (field === 'satisfaction') {
        const opt = SATISFACTION_OPTIONS.find(o => o.value === val)
        updated.score = opt?.score ?? null
      }
      return updated
    })
    onChange(next)
  }

  const nonNA  = criteres.filter(c => c.satisfaction && c.satisfaction !== 'na' && c.score !== null)
  const total  = nonNA.reduce((sum, c) => sum + (c.score || 0), 0)
  const maxPts = nonNA.length * 4
  const pct    = maxPts > 0 ? Math.round((total / maxPts) * 100) : 0

  return (
    <div>
      <div className="overflow-x-auto rounded border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 border-b">Catégorie</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 border-b w-8">N°</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 border-b">Critère</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 border-b">Satisfaction *</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 border-b w-16">Score</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 border-b">Commentaire</th>
            </tr>
          </thead>
          <tbody>
            {criteres.length === 0 && (
              <tr><td colSpan={6} className="text-center text-gray-400 py-4 text-xs">Aucun critère défini</td></tr>
            )}
            {criteres.map((c, idx) => (
              <tr key={idx} className="hover:bg-gray-50 border-b last:border-b-0">
                <td className="px-3 py-2 text-xs text-gray-500">{c.categorie || '—'}</td>
                <td className="px-3 py-2 text-xs text-gray-400 text-center">{idx + 1}</td>
                <td className="px-3 py-2 text-sm text-gray-800">{c.critere || '—'}</td>
                <td className="px-2 py-1.5">
                  <select value={c.satisfaction || ''} required
                    onChange={e => update(idx, 'satisfaction', e.target.value)}
                    className="border border-gray-200 rounded px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400">
                    <option value="">-- Choisir --</option>
                    {SATISFACTION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </td>
                <td className={`px-3 py-2 text-center text-sm ${scoreColor(c.score)}`}>
                  {c.score ?? '—'}
                </td>
                <td className="px-2 py-1.5">
                  <input value={c.commentaire || ''} onChange={e => update(idx, 'commentaire', e.target.value)}
                    placeholder="Commentaire…"
                    className="border border-gray-200 rounded px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Indice satisfaction */}
      <div className="mt-4 bg-green-50 border border-green-200 rounded-lg px-5 py-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-green-800">Indice de satisfaction global</span>
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold text-green-700">{pct}%</span>
          <span className="text-sm text-green-600">{total} / {maxPts} points</span>
        </div>
      </div>
    </div>
  )
}

