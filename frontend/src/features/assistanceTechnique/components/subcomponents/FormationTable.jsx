export default function FormationTable({ formations = [], onChange }) {
  const update = (idx, field, val) =>
    onChange(formations.map((f, i) => (i === idx ? { ...f, [field]: val } : f)))
  const add    = () => onChange([...formations, { formation: '', dates: '', ressources: '' }])
  const remove = (idx) => onChange(formations.filter((_, i) => i !== idx))

  return (
    <div>
      <div className="overflow-x-auto rounded border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Formation *', 'Dates prévues', 'Ressources', ''].map(h => (
                <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-600 border-b">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {formations.length === 0 && (
              <tr><td colSpan={4} className="text-center text-gray-400 py-4 text-xs">Aucune formation planifiée</td></tr>
            )}
            {formations.map((f, idx) => (
              <tr key={idx} className="hover:bg-gray-50 border-b last:border-b-0">
                <td className="px-2 py-1.5">
                  <input value={f.formation} required onChange={e => update(idx, 'formation', e.target.value)}
                    placeholder="Titre de la formation *"
                    className="border border-gray-200 rounded px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400" />
                </td>
                <td className="px-2 py-1.5">
                  <input value={f.dates} onChange={e => update(idx, 'dates', e.target.value)}
                    placeholder="ex: Jan 2025"
                    className="border border-gray-200 rounded px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400" />
                </td>
                <td className="px-2 py-1.5">
                  <input value={f.ressources} onChange={e => update(idx, 'ressources', e.target.value)}
                    placeholder="Formateur, budget..."
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
        <span className="text-base leading-none">+</span> Ajouter une formation
      </button>
    </div>
  )
}

