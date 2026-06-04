const ACTION_TYPES = [
  { value: 'corrective',  label: 'Corrective' },
  { value: 'preventive',  label: 'Préventive' },
  { value: 'amelioration', label: 'Amélioration' },
]

export default function ActionsBilanTable({ actions = [], onChange }) {
  const update = (idx, field, val) =>
    onChange(actions.map((a, i) => (i === idx ? { ...a, [field]: val } : a)))
  const add    = () => onChange([...actions, { action_id: '', type_action: 'corrective', action: '', due_date: '', responsable: '' }])
  const remove = (idx) => onChange(actions.filter((_, i) => i !== idx))

  return (
    <div>
      <div className="overflow-x-auto rounded border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['ID', 'Type', 'Action *', 'Échéance', 'Responsable', ''].map(h => (
                <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-600 border-b">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {actions.length === 0 && (
              <tr><td colSpan={6} className="text-center text-gray-400 py-4 text-xs">Aucune action définie</td></tr>
            )}
            {actions.map((a, idx) => (
              <tr key={idx} className="hover:bg-gray-50 border-b last:border-b-0">
                <td className="px-2 py-1.5">
                  <input value={a.action_id || ''} onChange={e => update(idx, 'action_id', e.target.value)}
                    placeholder="A-001"
                    className="border border-gray-200 rounded px-2 py-1.5 text-sm w-20 focus:outline-none focus:ring-1 focus:ring-blue-400" />
                </td>
                <td className="px-2 py-1.5">
                  <select value={a.type_action || 'corrective'} onChange={e => update(idx, 'type_action', e.target.value)}
                    className="border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400">
                    {ACTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </td>
                <td className="px-2 py-1.5">
                  <input value={a.action || ''} onChange={e => update(idx, 'action', e.target.value)}
                    placeholder="Décrire l'action *"
                    className="border border-gray-200 rounded px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400" />
                </td>
                <td className="px-2 py-1.5">
                  <input type="date" value={a.due_date} onChange={e => update(idx, 'due_date', e.target.value)}
                    className="border border-gray-200 rounded px-2 py-1.5 text-sm w-36 focus:outline-none focus:ring-1 focus:ring-blue-400" />
                </td>
                <td className="px-2 py-1.5">
                  <input value={a.responsable} onChange={e => update(idx, 'responsable', e.target.value)}
                    placeholder="Responsable"
                    className="border border-gray-200 rounded px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400" />
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
        <span className="text-base leading-none">+</span> Ajouter une action
      </button>
    </div>
  )
}

