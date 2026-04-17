import CriticalityBadge from './CriticalityBadge'
import { criticality } from '../utils/criticality'
import { getCompletedSteps } from './RiskDrawer'

const STATUS_STYLES = {
  'Ouvert':   { bg: '#FEE2E2', color: '#991B1B' },
  'Atténué':  { bg: '#FEF3C7', color: '#92400E' },
  'Clôturé':  { bg: '#DCFCE7', color: '#166534' },
}

export default function RiskTable({ rows, onEdit, onDelete, onViewDetail }) {
  return (
    <div className="overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {['Code', 'Identification du risque', 'Processus', 'P', 'G', 'Criticité', 'Décision', 'État', 'Actions'].map((h) => (
              <th key={h} className="px-3 py-3 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const c = criticality(r?.evaluation?.probability, r?.evaluation?.severity)
            const completed = getCompletedSteps(r)
            const isComplete = completed === 4
            const statusStyle = STATUS_STYLES[r.status] || {}

            return (
              <tr
                key={r.id}
                className="border-t border-slate-100 hover:bg-slate-50 transition-colors"
              >
                {/* Code */}
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#0F2744]">{r.code || `R${r.id}`}</span>
                    {/* Badge brouillon si incomplet */}
                    {!isComplete && (
                      <span className="rounded-full bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[10px] font-medium text-amber-600">
                        {completed}/4
                      </span>
                    )}
                  </div>
                </td>

                {/* Titre — cliquable si complet */}
                <td
                  className={`px-3 py-2.5 max-w-[220px] ${isComplete ? 'cursor-pointer text-[#2563EB] hover:underline' : 'text-slate-700'}`}
                  onClick={() => isComplete ? onViewDetail?.(r.id) : onEdit(r.id)}
                  title={isComplete ? 'Voir le détail du risque' : 'Compléter le risque'}
                >
                  <span className="line-clamp-2">{r.title}</span>
                </td>

                <td className="px-3 py-2.5 text-slate-600">{r.process || '—'}</td>
                <td className="px-3 py-2.5 text-slate-600">{r?.evaluation?.probability || '—'}</td>
                <td className="px-3 py-2.5 text-slate-600">{r?.evaluation?.severity || '—'}</td>
                <td className="px-3 py-2.5"><CriticalityBadge value={c || 0} /></td>
                <td className="px-3 py-2.5 text-slate-600">{r?.evaluation?.decision || '—'}</td>

                {/* État badge */}
                <td className="px-3 py-2.5">
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={statusStyle}
                  >
                    {r.status || '—'}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1">
                    {/* Bouton détail (uniquement si complet) */}
                    {isComplete && onViewDetail && (
                      <button
                        title="Voir le détail"
                        className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                        onClick={(e) => { e.stopPropagation(); onViewDetail(r.id) }}
                      >
                        {/* Icône œil */}
                        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    )}

                    {/* Bouton modifier (toujours disponible) */}
                    <button
                      title="Modifier"
                      className="rounded p-1.5 text-[#2563EB] hover:bg-blue-50 transition-colors"
                      onClick={(e) => { e.stopPropagation(); onEdit(r.id) }}
                    >
                      {/* Icône crayon */}
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z" />
                      </svg>
                    </button>

                    {/* Bouton supprimer */}
                    <button
                      title="Supprimer"
                      className="rounded p-1.5 text-red-400 hover:bg-red-50 transition-colors"
                      onClick={(e) => { e.stopPropagation(); onDelete(r.id) }}
                    >
                      {/* Icône poubelle */}
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0a1 1 0 00-1-1h-4a1 1 0 00-1 1m-4 0h10" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}

          {rows.length === 0 && (
            <tr>
              <td className="px-3 py-12 text-center text-slate-400" colSpan={9}>
                <div className="flex flex-col items-center gap-2">
                  <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="text-slate-300">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Aucun risque pour ce projet</span>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
