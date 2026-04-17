export default function ActionPlanTable({ rows, onPatch }) {
  return (
    <div className="overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="px-3 py-2">Code risque</th>
            <th className="px-3 py-2">Action</th>
            <th className="px-3 py-2">Responsable</th>
            <th className="px-3 py-2">Date fin planifiee</th>
            <th className="px-3 py-2">Date fin actualisee</th>
            <th className="px-3 py-2">% Realisation</th>
            <th className="px-3 py-2">Statut</th>
            <th className="px-3 py-2">Commentaire</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const late = r.actual_date && r.status !== 'Done' && new Date(r.actual_date) < new Date()
            return (
              <tr key={r.id} className="border-t border-slate-100" style={{ background: late ? '#fef2f2' : '#fff' }}>
                <td className="px-3 py-2 font-semibold">{r.risk_code || `R${r.id}`}</td>
                <td className="px-3 py-2">{r.action}</td>
                <td className="px-3 py-2">{r.responsible_name || '-'}</td>
                <td className="px-3 py-2">{r.planned_date || '-'}</td>
                <td className="px-3 py-2">{r.actual_date || '-'}</td>
                <td className="px-3 py-2">
                  <div className="h-2 w-24 rounded bg-slate-100">
                    <div className="h-2 rounded bg-[#2563EB]" style={{ width: `${r.progress || 0}%` }} />
                  </div>
                </td>
                <td className="px-3 py-2">
                  <select className="rounded border p-1 text-xs" value={r.status || 'IDLE'} onChange={(e) => onPatch(r.id, { status: e.target.value })}>
                    {['IDLE', 'Blocked', 'In Progress', 'Done'].map((s) => <option key={s}>{s}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2">{r.comment || '-'}</td>
              </tr>
            )
          })}
          {rows.length === 0 && <tr><td className="px-3 py-8 text-center text-slate-500" colSpan={8}>Aucune action</td></tr>}
        </tbody>
      </table>
    </div>
  )
}
