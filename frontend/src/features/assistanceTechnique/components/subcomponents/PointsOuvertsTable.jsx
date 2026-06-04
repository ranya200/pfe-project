const INPUT = 'border border-gray-200 rounded px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400'

// ── Single-select member dropdown (with free-text fallback) ───────────────────
function MemberSelector({ value, projectMembers, onChange }) {
  if (!projectMembers?.length) {
    return (
      <input value={value || ''} onChange={e => onChange(e.target.value)}
        placeholder="Nom du responsable"
        className={INPUT} />
    )
  }
  return (
    <select value={value || ''} onChange={e => onChange(e.target.value)}
      className={INPUT + ' bg-white cursor-pointer'}>
      <option value="">— Choisir —</option>
      {projectMembers.map((m, i) => {
        const name = `${m.first_name} ${m.last_name}`.trim() || m.email
        return <option key={i} value={name}>{name} ({m.role})</option>
      })}
    </select>
  )
}

export default function PointsOuvertsTable({ points = [], onChange, projectMembers = [] }) {
  const update = (idx, field, val) =>
    onChange(points.map((p, i) => (i === idx ? { ...p, [field]: val } : p)))
  const add    = () => onChange([...points, { description: '', responsable: '', delai: '' }])
  const remove = (idx) => onChange(points.filter((_, i) => i !== idx))

  return (
    <div>
      <div className="overflow-x-auto rounded border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 border-b w-8">#</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 border-b">Description / Action *</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 border-b">Responsable</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 border-b">Délai</th>
              <th className="px-3 py-2 border-b w-8"></th>
            </tr>
          </thead>
          <tbody>
            {points.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-gray-400 py-4 text-xs">
                  Aucun point ouvert — cliquez sur + Ajouter
                </td>
              </tr>
            )}
            {points.map((p, idx) => (
              <tr key={idx} className="hover:bg-gray-50 border-b last:border-b-0">
                <td className="px-3 py-2 text-gray-400 text-xs font-medium">{idx + 1}</td>
                <td className="px-2 py-1.5">
                  <input
                    value={p.description}
                    required
                    onChange={e => update(idx, 'description', e.target.value)}
                    placeholder="Description de l'action *"
                    className={INPUT}
                  />
                </td>
                <td className="px-2 py-1.5 min-w-[180px]">
                  <MemberSelector
                    value={p.responsable}
                    projectMembers={projectMembers}
                    onChange={val => update(idx, 'responsable', val)}
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    type="date"
                    value={p.delai}
                    onChange={e => update(idx, 'delai', e.target.value)}
                    className={INPUT}
                  />
                </td>
                <td className="px-2 py-1.5 text-center">
                  <button type="button" onClick={() => remove(idx)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        onClick={add}
        className="mt-2 border border-gray-300 text-sm px-3 py-1.5 rounded hover:bg-gray-50 flex items-center gap-1 text-gray-600"
      >
        <span className="text-base leading-none">+</span> Ajouter un point ouvert
      </button>
    </div>
  )
}

