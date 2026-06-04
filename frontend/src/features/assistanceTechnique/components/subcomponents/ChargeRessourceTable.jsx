export default function ChargeRessourceTable({ charges = [], onChange }) {
  const update = (idx, field, val) => {
    const next = charges.map((c, i) => {
      if (i !== idx) return c
      const updated = { ...c, [field]: val }
      updated.total = (parseFloat(updated.semaine_1) || 0) + (parseFloat(updated.semaine_2) || 0)
        + (parseFloat(updated.semaine_3) || 0) + (parseFloat(updated.semaine_4) || 0)
      return updated
    })
    onChange(next)
  }
  const add    = () => onChange([...charges, { nom_ressource: '', role: '', semaine_1: '', semaine_2: '', semaine_3: '', semaine_4: '', total: 0 }])
  const remove = (idx) => onChange(charges.filter((_, i) => i !== idx))

  const grandTotal = charges.reduce((sum, c) => sum + (parseFloat(c.total) || 0), 0)

  return (
    <div>
      <div className="overflow-x-auto rounded border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Ressource *', 'Rôle', 'Semaine 1', 'Semaine 2', 'Semaine 3', 'Semaine 4', 'Total (h)', ''].map(h => (
                <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-600 border-b">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {charges.length === 0 && (
              <tr><td colSpan={8} className="text-center text-gray-400 py-4 text-xs">Aucune ressource ajoutée</td></tr>
            )}
            {charges.map((c, idx) => (
              <tr key={idx} className="hover:bg-gray-50 border-b last:border-b-0">
                <td className="px-2 py-1.5">
                  <input value={c.nom_ressource || ''} onChange={e => update(idx, 'nom_ressource', e.target.value)}
                    placeholder="Nom complet *"
                    className="border border-gray-200 rounded px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400" />
                </td>
                <td className="px-2 py-1.5">
                  <input value={c.role || ''} onChange={e => update(idx, 'role', e.target.value)}
                    placeholder="Rôle"
                    className="border border-gray-200 rounded px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400" />
                </td>
                {['semaine_1', 'semaine_2', 'semaine_3', 'semaine_4'].map(week => (
                  <td key={week} className="px-2 py-1.5">
                    <input type="number" min="0" value={c[week] || ''} onChange={e => update(idx, week, e.target.value)}
                      placeholder="0"
                      className="border border-gray-200 rounded px-2 py-1.5 text-sm w-20 focus:outline-none focus:ring-1 focus:ring-blue-400" />
                  </td>
                ))}
                <td className="px-3 py-1.5">
                  <span className="font-bold text-blue-700 text-sm">{c.total || 0} h</span>
                </td>
                <td className="px-2 py-1.5 text-center">
                  <button type="button" onClick={() => remove(idx)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                </td>
              </tr>
            ))}
          </tbody>
          {charges.length > 0 && (
            <tfoot className="bg-blue-50">
              <tr>
                <td colSpan={6} className="px-3 py-2 text-xs font-semibold text-blue-700 text-right">Total général :</td>
                <td className="px-3 py-2 font-bold text-blue-800 text-sm">{grandTotal} h</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      <button type="button" onClick={add}
        className="mt-2 border border-gray-300 text-sm px-3 py-1.5 rounded hover:bg-gray-50 flex items-center gap-1 text-gray-600">
        <span className="text-base leading-none">+</span> Ajouter une ressource
      </button>
    </div>
  )
}

