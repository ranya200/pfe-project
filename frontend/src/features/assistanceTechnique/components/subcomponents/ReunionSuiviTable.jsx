const TYPES = [
  { value: 'kick_off', label: 'Kick-off' },
  { value: 'hebdo',    label: 'Hebdomadaire' },
  { value: 'autre',    label: 'Autre' },
]

export default function ReunionSuiviTable({ reunions = [], onChange }) {
  const update = (idx, field, val) =>
    onChange(reunions.map((r, i) => (i === idx ? { ...r, [field]: val } : r)))
  const add    = () => onChange([...reunions, { date: '', type_reunion: 'hebdo', participants: '', actions: '', compte_rendu_url: '' }])
  const remove = (idx) => onChange(reunions.filter((_, i) => i !== idx))

  return (
    <div>
      <div className="overflow-x-auto rounded border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Date', 'Type', 'Participants', 'Actions décidées', 'Compte rendu', ''].map(h => (
                <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-600 border-b">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reunions.length === 0 && (
              <tr><td colSpan={6} className="text-center text-gray-400 py-4 text-xs">Aucune réunion enregistrée</td></tr>
            )}
            {reunions.map((r, idx) => (
              <tr key={idx} className="hover:bg-gray-50 border-b last:border-b-0">
                <td className="px-2 py-1.5">
                  <input type="date" value={r.date} onChange={e => update(idx, 'date', e.target.value)}
                    className="border border-gray-200 rounded px-2 py-1.5 text-sm w-36 focus:outline-none focus:ring-1 focus:ring-blue-400" />
                </td>
                <td className="px-2 py-1.5">
                  <select value={r.type_reunion || 'hebdo'} onChange={e => update(idx, 'type_reunion', e.target.value)}
                    className="border border-gray-200 rounded px-2 py-1.5 text-sm w-36 focus:outline-none focus:ring-1 focus:ring-blue-400">
                    {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </td>
                <td className="px-2 py-1.5">
                  <input value={r.participants} onChange={e => update(idx, 'participants', e.target.value)}
                    placeholder="Noms des participants"
                    className="border border-gray-200 rounded px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400" />
                </td>
                <td className="px-2 py-1.5">
                  <input value={r.actions} onChange={e => update(idx, 'actions', e.target.value)}
                    placeholder="Actions décidées"
                    className="border border-gray-200 rounded px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400" />
                </td>
                <td className="px-2 py-1.5">
                  <input value={r.compte_rendu_url || ''} onChange={e => update(idx, 'compte_rendu_url', e.target.value)}
                    placeholder="Lien ou référence"
                    className="border border-gray-200 rounded px-2 py-1.5 text-sm w-36 text-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-400" />
                </td>
                <td className="px-2 py-1.5 text-center">
                  <button type="button" onClick={() => remove(idx)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" onClick={add}
        className="mt-2 border border-gray-300 text-sm px-3 py-1.5 rounded hover:bg-gray-50 flex items-center gap-1 text-gray-600">
        <span className="text-base leading-none">+</span> Ajouter une réunion
      </button>
    </div>
  )
}

