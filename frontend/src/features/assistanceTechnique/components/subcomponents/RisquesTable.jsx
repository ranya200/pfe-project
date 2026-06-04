export default function RisquesTable({ risques = [], onChange }) {
  const update = (idx, field, val) =>
    onChange(risques.map((r, i) => (i === idx ? { ...r, [field]: val } : r)))
  const add    = () => onChange([...risques, { description_risque: '', approche_attenuation: '' }])
  const remove = (idx) => onChange(risques.filter((_, i) => i !== idx))

  return (
    <div>
      <div className="overflow-x-auto rounded border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 border-b w-8">#</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 border-b">Description du risque *</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 border-b">Mesure d'atténuation</th>
              <th className="px-3 py-2 border-b w-8"></th>
            </tr>
          </thead>
          <tbody>
            {risques.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-gray-400 py-4 text-xs">
                  Aucun risque identifié — cliquez sur + Ajouter
                </td>
              </tr>
            )}
            {risques.map((r, idx) => (
              <tr key={idx} className="hover:bg-gray-50 border-b last:border-b-0">
                <td className="px-3 py-2 text-gray-400 text-xs font-medium">{idx + 1}</td>
                <td className="px-2 py-1.5">
                  <textarea
                    value={r.description_risque || ''}
                    onChange={e => update(idx, 'description_risque', e.target.value)}
                    placeholder="Décrire le risque identifié *"
                    rows={2}
                    className="border border-gray-200 rounded px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <textarea
                    value={r.approche_attenuation || ''}
                    onChange={e => update(idx, 'approche_attenuation', e.target.value)}
                    placeholder="Action d'atténuation prévue"
                    rows={2}
                    className="border border-gray-200 rounded px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
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
        <span className="text-base leading-none">+</span> Ajouter un risque
      </button>
    </div>
  )
}

