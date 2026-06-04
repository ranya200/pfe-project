const STATUTS = [
  { value: 'en_cours',    label: 'En cours',    color: 'bg-blue-100 text-blue-800' },
  { value: 'disponible',  label: 'Disponible',  color: 'bg-green-100 text-green-800' },
  { value: 'maintenance', label: 'Maintenance', color: 'bg-orange-100 text-orange-800' },
]

export default function ECMETable({ equipements = [], onChange }) {
  const update = (idx, field, val) =>
    onChange(equipements.map((e, i) => (i === idx ? { ...e, [field]: val } : e)))
  const add    = () => onChange([...equipements, { ecme_id: '', designation: '', type_ecme: '', fournisseur: '', statut: 'disponible' }])
  const remove = (idx) => onChange(equipements.filter((_, i) => i !== idx))

  return (
    <div>
      <div className="overflow-x-auto rounded border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['ID ECME', 'Désignation *', 'Type', 'Fournisseur', 'Statut', ''].map(h => (
                <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-600 border-b">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {equipements.length === 0 && (
              <tr><td colSpan={6} className="text-center text-gray-400 py-4 text-xs">Aucun équipement ajouté</td></tr>
            )}
            {equipements.map((e, idx) => {
              const statut = STATUTS.find(s => s.value === e.statut) || STATUTS[1]
              return (
                <tr key={idx} className="hover:bg-gray-50 border-b last:border-b-0">
                  <td className="px-2 py-1.5">
                    <input value={e.ecme_id || ''} onChange={ev => update(idx, 'ecme_id', ev.target.value)}
                      placeholder="ex: ECME-001"
                      className="border border-gray-200 rounded px-2 py-1.5 text-sm w-28 text-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-400" />
                  </td>
                  <td className="px-2 py-1.5">
                    <input value={e.designation || ''} onChange={ev => update(idx, 'designation', ev.target.value)}
                      placeholder="Désignation *"
                      className="border border-gray-200 rounded px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400" />
                  </td>
                  <td className="px-2 py-1.5">
                    <input value={e.type_ecme || ''} onChange={ev => update(idx, 'type_ecme', ev.target.value)}
                      placeholder="Type"
                      className="border border-gray-200 rounded px-2 py-1.5 text-sm w-28 focus:outline-none focus:ring-1 focus:ring-blue-400" />
                  </td>
                  <td className="px-2 py-1.5">
                    <input value={e.fournisseur} onChange={ev => update(idx, 'fournisseur', ev.target.value)}
                      placeholder="Fournisseur"
                      className="border border-gray-200 rounded px-2 py-1.5 text-sm w-36 focus:outline-none focus:ring-1 focus:ring-blue-400" />
                  </td>
                  <td className="px-2 py-1.5">
                    <select value={e.statut} onChange={ev => update(idx, 'statut', ev.target.value)}
                      className={`rounded-full px-3 py-1 text-xs font-medium border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-400 ${statut.color}`}>
                      {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <button type="button" onClick={() => remove(idx)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <button type="button" onClick={add}
        className="mt-2 border border-gray-300 text-sm px-3 py-1.5 rounded hover:bg-gray-50 flex items-center gap-1 text-gray-600">
        <span className="text-base leading-none">+</span> Ajouter un équipement
      </button>
    </div>
  )
}

