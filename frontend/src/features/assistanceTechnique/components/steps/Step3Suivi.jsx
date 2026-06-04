import { useState, useEffect, useCallback, useRef } from 'react'
import ATWorkflowStepper from '../ATWorkflowStepper'
import { fetchProjectRisks } from '../../api/assistanceTechniqueApi'
import { saveReunion } from '../../api/assistanceTechniqueApi'
 
// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUT_OPTIONS = ['Planifiée', 'Tenue', 'Reportée', 'Annulée']
 
const SEVERITY_COLOR = (level) => {
  if (!level) return 'bg-gray-100 text-gray-600'
  if (level === 'Inacceptable') return 'bg-red-100 text-red-700'
  if (level === 'Surveiller') return 'bg-amber-100 text-amber-700'
  return 'bg-green-100 text-green-700'
}
 
const STATUS_COLOR = (s) => {
  if (s === 'Tenue')    return 'bg-green-100 text-green-700'
  if (s === 'Reportée') return 'bg-amber-100 text-amber-700'
  if (s === 'Annulée')  return 'bg-red-100 text-red-700'
  return 'bg-blue-100 text-blue-700'
}
 
const RISK_STATUS_COLOR = (s) => {
  if (s === 'Clôturé')  return 'bg-green-100 text-green-700'
  if (s === 'Atténué')  return 'bg-amber-100 text-amber-700'
  return 'bg-red-100 text-red-700'
}
 
// ── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'reunions',   label: '📋 Réunions de suivi' },
  { id: 'risques',    label: '⚠️ Risques' },
  { id: 'dashboard',  label: '📊 Dashboard' },
]
 
// ── Tab: Réunions de suivi ────────────────────────────────────────────────────
const SOURCE_COLOR = (src) => {
  if (src === 'Étape 1') return 'bg-green-100 text-green-700 border-green-200'
  if (src === 'Étape 2') return 'bg-indigo-100 text-indigo-700 border-indigo-200'
  return 'bg-gray-100 text-gray-500 border-gray-200'
}
 
function ReunionsSuiviTab({ rows, onChange, onResync }) {
  const update = (i, field, val) =>
    onChange(rows.map((r, idx) => idx === i ? { ...r, [field]: val } : r))
 
  if (!rows.length) {
    return (
      <div className="text-center py-12 text-gray-400">
        <div className="text-4xl mb-3">📋</div>
        <p className="text-sm">Aucune réunion planifiée trouvée dans les étapes précédentes.</p>
        <p className="text-xs mt-1">Ajoutez des réunions dans "Plan de communication" (Étape 1) ou "Réunions PQ" (Étape 2).</p>
        {onResync && (
          <button type="button" onClick={onResync}
            className="mt-4 flex items-center gap-1.5 mx-auto text-xs px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors font-medium">
            🔄 Synchroniser maintenant
          </button>
        )}
      </div>
    )
  }
 
  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-500">
          <strong>{rows.length}</strong> réunion(s) synchronisée(s) depuis les étapes précédentes.
          <span className="ml-2 gap-1 inline-flex flex-wrap">
            <span className={`inline-block px-1.5 py-0.5 text-[10px] font-semibold rounded border ${SOURCE_COLOR('Étape 1')}`}>Étape 1</span>
            <span className="text-gray-400">Plan de communication</span>
            <span className="text-gray-300 mx-1">|</span>
            <span className={`inline-block px-1.5 py-0.5 text-[10px] font-semibold rounded border ${SOURCE_COLOR('Étape 2')}`}>Étape 2</span>
            <span className="text-gray-400">Réunions PQ</span>
          </span>
        </p>
        {onResync && (
          <button type="button" onClick={onResync}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors font-medium whitespace-nowrap">
            🔄 Re-synchroniser
          </button>
        )}
      </div>
 
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-blue-50">
              {['Type de réunion', 'Pilote', 'Fréquence', 'Participants', 'Date tenue', 'Statut', 'Compte-rendu', 'Commentaire'].map(h => (
                <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-blue-800 border border-blue-100 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b hover:bg-gray-50">
                <td className="px-3 py-2 border border-gray-100 font-medium text-gray-700">
                  <div>{r.type_reunion || '—'}</div>
                  {r.source && (
                    <span className={`inline-block mt-1 px-1.5 py-0.5 text-[10px] font-semibold rounded border ${SOURCE_COLOR(r.source)}`}>
                      {r.source}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 border border-gray-100 text-gray-600 whitespace-nowrap">{r.pilote || '—'}</td>
                <td className="px-3 py-2 border border-gray-100 text-gray-600 whitespace-nowrap">{r.frequence || '—'}</td>
                <td className="px-3 py-2 border border-gray-100 text-gray-500 text-xs max-w-[140px]">{r.participants || '—'}</td>
                <td className="px-2 py-1.5 border border-gray-100">
                  <input type="date" value={r.date_tenue || ''}
                    onChange={e => update(i, 'date_tenue', e.target.value)}
                    className="border border-gray-200 rounded px-2 py-1 text-xs w-full focus:outline-none focus:ring-1 focus:ring-blue-400" />
                </td>
                <td className="px-2 py-1.5 border border-gray-100">
                  <select value={r.statut || 'Planifiée'} onChange={e => update(i, 'statut', e.target.value)}
                    className="border border-gray-200 rounded px-2 py-1 text-xs w-full focus:outline-none focus:ring-1 focus:ring-blue-400">
                    {STATUT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
 
                {/* ── Compte-rendu : import fichier ── */}
                <td className="px-2 py-1.5 border border-gray-100">
                  <div className="flex flex-col gap-1 min-w-[130px]">
 
                    {/* Fichier déjà sauvegardé côté serveur (URL string) */}
                    {r.compte_rendu && typeof r.compte_rendu === 'string' && (
                      <a
                        href={r.compte_rendu}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-blue-600 hover:underline truncate max-w-[130px]"
                        title="Voir le compte rendu"
                      >
                        📄 Voir le fichier
                      </a>
                    )}
 
                    {/* Fichier sélectionné localement (pas encore sauvegardé) */}
                    {r.compte_rendu && typeof r.compte_rendu === 'object' && (
                      <span
                        className="text-xs text-green-600 truncate max-w-[130px]"
                        title={r.compte_rendu.name}
                      >
                        📎 {r.compte_rendu.name}
                      </span>
                    )}
 
                    {/* Bouton import */}
                    <label className="cursor-pointer inline-block">
                      <span className="border border-gray-200 rounded px-2 py-1 text-xs bg-white hover:bg-gray-50 text-gray-600 whitespace-nowrap transition-colors">
                        {r.compte_rendu ? '🔄 Changer' : '📎 Importer'}
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.odt,.xls,.xlsx"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files[0]
                          if (file) update(i, 'compte_rendu', file)
                        }}
                      />
                    </label>
 
                  </div>
                </td>
 
                <td className="px-2 py-1.5 border border-gray-100">
                  <textarea value={r.commentaire || ''} onChange={e => update(i, 'commentaire', e.target.value)}
                    placeholder="Commentaire" rows={2}
                    className="border border-gray-200 rounded px-2 py-1 text-xs w-full focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 flex flex-wrap gap-3">
          {STATUT_OPTIONS.map(s => (
            <span key={s} className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOR(s)}`}>
              {s}: {rows.filter(r => (r.statut || 'Planifiée') === s).length}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
 
// ── Tab: Risques ──────────────────────────────────────────────────────────────
function RisquesTab({ projectId, navigate }) {
  const [risks, setRisks]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
 
  useEffect(() => {
    if (!projectId) return
    setLoading(true)
    fetchProjectRisks(projectId)
      .then(data => { setRisks(Array.isArray(data) ? data : []); setError(null) })
      .catch(() => setError('Impossible de charger les risques.'))
      .finally(() => setLoading(false))
  }, [projectId])
 
  const goToRisks = () => navigate(`/projects/${projectId}/risks`)
 
  if (loading) return (
    <div className="flex items-center justify-center py-16 text-gray-400">
      <svg className="animate-spin w-6 h-6 mr-3 text-blue-500" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
      Chargement des risques…
    </div>
  )
 
  if (error) return (
    <div className="text-center py-12 text-red-500">
      <div className="text-3xl mb-2">⚠️</div>
      <p className="text-sm">{error}</p>
    </div>
  )
 
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-3">
          {['Ouvert', 'Atténué', 'Clôturé'].map(s => (
            <span key={s} className={`text-xs px-3 py-1 rounded-full font-medium ${RISK_STATUS_COLOR(s)}`}>
              {s}: {risks.filter(r => r.status === s).length}
            </span>
          ))}
        </div>
        <button onClick={() => window.open(`/projects/${projectId}/risks`, '_blank')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow transition-colors">
          🔗 Ouvrir Gestion des Risques →
        </button>
      </div>
 
      {!risks.length ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-3">✅</div>
          <p className="text-sm">Aucun risque ouvert pour ce projet.</p>
          <button onClick={() => window.open(`/projects/${projectId}/risks`, '_blank')} className="mt-3 text-blue-600 hover:underline text-xs">
            Gérer les risques →
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-red-50">
                {['Code', 'Titre', 'Processus', 'Prob.', 'Grav.', 'Criticité', 'Niveau', 'Statut', 'Plan d\'action', 'Action'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-red-800 border border-red-100 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {risks.map(r => (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="px-3 py-2 border border-gray-100 font-mono text-xs font-bold text-gray-700">{r.code}</td>
                  <td className="px-3 py-2 border border-gray-100 font-medium text-gray-800 max-w-[200px]">{r.title}</td>
                  <td className="px-3 py-2 border border-gray-100 text-gray-500 text-xs whitespace-nowrap">{r.process}</td>
                  <td className="px-3 py-2 border border-gray-100 text-center font-bold">{r.evaluation?.probability ?? '—'}</td>
                  <td className="px-3 py-2 border border-gray-100 text-center font-bold">{r.evaluation?.severity ?? '—'}</td>
                  <td className="px-3 py-2 border border-gray-100 text-center font-bold">{r.evaluation?.criticality ?? '—'}</td>
                  <td className="px-3 py-2 border border-gray-100">
                    {r.evaluation?.level
                      ? <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SEVERITY_COLOR(r.evaluation.level)}`}>{r.evaluation.level}</span>
                      : '—'}
                  </td>
                  <td className="px-3 py-2 border border-gray-100">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${RISK_STATUS_COLOR(r.status)}`}>{r.status}</span>
                  </td>
                  <td className="px-3 py-2 border border-gray-100 text-gray-600 text-xs max-w-[200px]">
                    {r.action_plan?.action || <span className="text-gray-400 italic">Aucun plan</span>}
                  </td>
                  <td className="px-3 py-2 border border-gray-100 text-center">
                    <button onClick={() => window.open(`/projects/${projectId}/risks/${r.id}`, '_blank')}
                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline whitespace-nowrap font-medium">
                      Voir détail ↗
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
 
// ── Tab: Dashboard ────────────────────────────────────────────────────────────
const ROLE_LABELS = {
  admin: 'Administrateur', resp_qualite: 'Responsable Qualité', chef_projet: 'Chef de Projet',
  developpeur: 'Développeur', tech_lead: 'Tech Lead', ingenieur: 'Ingénieur',
  validateur: 'Validateur', charge_affaires: "Chargé d'Affaires",
  consultant: 'Consultant', stagiaire: 'Stagiaire',
}
const ROLE_COLORS = {
  chef_projet: 'bg-blue-600', resp_qualite: 'bg-purple-600', tech_lead: 'bg-indigo-600',
  developpeur: 'bg-green-600', validateur: 'bg-amber-600', ingenieur: 'bg-teal-600',
}
const avatarColor = (role) => ROLE_COLORS[role] || 'bg-gray-500'
 
function MiniDonut({ pct, color = '#3b82f6' }) {
  const r = 28, cx = 34, cy = 34, circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <svg width="68" height="68" viewBox="0 0 68 68">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`} />
      <text x={cx} y={cy + 5} textAnchor="middle" fontSize="12" fontWeight="bold" fill={color}>{pct}%</text>
    </svg>
  )
}
 
function StatBar({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-20 shrink-0 truncate">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-6 text-right">{count}</span>
    </div>
  )
}
 
function DashboardTab({ at, step1Data, step2Data, reunions }) {
  const membres   = Array.isArray(at?.project_membres) ? at.project_membres : []
  const livrables = Array.isArray(step2Data?.livrables) ? step2Data.livrables : []
  const jalons    = Array.isArray(step2Data?.pq_jalons)  ? step2Data.pq_jalons  : []
 
  const respQ = membres.find(m => m.role === 'resp_qualite')
  const chefP = membres.find(m => m.role === 'chef_projet')
  const fullName = (m) => m ? [m.first_name, m.last_name].filter(Boolean).join(' ') || m.email || '—' : '—'
 
  const nomProjet = step1Data?.nom_projet || at?.project_nom || '—'
  const refDoc    = step1Data?.reference_document || at?.project_ref || '—'
  const client    = at?.project_client_info?.nom || at?.project_name || '—'
 
  const livStats = {
    total:    livrables.length,
    planifie: livrables.filter(l => l.statut === 'planifié').length,
    en_cours: livrables.filter(l => l.statut === 'en_cours').length,
    livre:    livrables.filter(l => l.statut === 'livré').length,
    valide:   livrables.filter(l => l.statut === 'validé').length,
    rejete:   livrables.filter(l => l.statut === 'rejeté').length,
  }
  const reuStats = {
    total:    reunions.length,
    tenues:   reunions.filter(r => r.statut === 'Tenue').length,
    reportes: reunions.filter(r => r.statut === 'Reportée').length,
    annules:  reunions.filter(r => r.statut === 'Annulée').length,
    planned:  reunions.filter(r => r.statut === 'Planifiée').length,
  }
  const livPct = livStats.total > 0 ? Math.round(((livStats.livre + livStats.valide) / livStats.total) * 100) : 0
  const reuPct = reuStats.total > 0 ? Math.round((reuStats.tenues / reuStats.total) * 100) : 0
 
  const STEP_LABELS = [
    { label: 'Lancement', icon: '🚀' }, { label: 'Réalisation', icon: '⚙️' },
    { label: 'Suivi', icon: '📋' }, { label: 'Évaluation', icon: '✅' },
  ]
  const currentStep = at?.current_step || 3
 
  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-r from-blue-700 to-blue-500 rounded-xl p-5 text-white shadow-md">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <p className="text-blue-200 text-xs font-medium uppercase tracking-wider mb-1">Projet AT</p>
            <h2 className="text-xl font-bold">{nomProjet}</h2>
            <p className="text-blue-100 text-sm mt-1">Réf : {refDoc}</p>
          </div>
          <div className="text-right">
            <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-semibold
              ${at?.status === 'en_cours' ? 'bg-green-400/30 text-green-100' : 'bg-gray-400/30 text-gray-100'}`}>
              {at?.status === 'en_cours' ? '● En cours' : '✓ Terminé'}
            </span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          {[
            { icon: '🏢', label: 'Client', value: client },
            { icon: '👷', label: 'Chef de projet', value: fullName(chefP) },
            { icon: '🔍', label: 'Resp. Qualité', value: fullName(respQ) },
            { icon: '📅', label: 'Durée planifiée', value: step1Data?.duree_planifiee || '—' },
          ].map(item => (
            <div key={item.label} className="bg-white/10 rounded-lg px-3 py-2">
              <p className="text-blue-200 text-xs">{item.icon} {item.label}</p>
              <p className="text-white font-semibold text-xs mt-0.5 truncate">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
 
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Progression du workflow</p>
        <div className="flex items-center">
          {STEP_LABELS.map(({ label, icon }, idx) => {
            const stepNum = idx + 1
            const done    = stepNum < currentStep
            const active  = stepNum === currentStep
            return (
              <div key={idx} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center min-w-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow
                    ${done ? 'bg-green-500 text-white' : active ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-gray-100 text-gray-400'}`}>
                    {done ? '✓' : icon}
                  </div>
                  <span className={`text-xs mt-1.5 font-medium text-center ${active ? 'text-blue-600' : done ? 'text-green-600' : 'text-gray-400'}`}>
                    {label}
                  </span>
                </div>
                {idx < STEP_LABELS.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 rounded-full ${done ? 'bg-green-400' : 'bg-gray-100'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>
 
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Membres équipe', value: membres.length, icon: '👥', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-100' },
          { label: 'Livrables',      value: livStats.total, icon: '📦', color: 'text-green-700', bg: 'bg-green-50 border-green-100', sub: `${livStats.livre + livStats.valide} livrés/validés` },
          { label: 'Réunions',       value: `${reuStats.tenues}/${reuStats.total}`, icon: '🤝', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-100', sub: 'tenues' },
          { label: 'Jalons',         value: jalons.length, icon: '🏁', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-100' },
        ].map(c => (
          <div key={c.label} className={`border rounded-xl p-4 text-center shadow-sm ${c.bg}`}>
            <div className="text-2xl mb-1">{c.icon}</div>
            <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
            <div className={`text-xs font-medium mt-0.5 ${c.color}`}>{c.label}</div>
            {c.sub && <div className="text-xs text-gray-500 mt-0.5">{c.sub}</div>}
          </div>
        ))}
      </div>
 
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">📦 Avancement livrables</p>
          {livStats.total > 0 ? (
            <div className="flex items-center gap-5">
              <MiniDonut pct={livPct} color="#3b82f6" />
              <div className="flex-1 space-y-2">
                <StatBar label="Planifié"  count={livStats.planifie} total={livStats.total} color="bg-gray-300" />
                <StatBar label="En cours"  count={livStats.en_cours} total={livStats.total} color="bg-blue-400" />
                <StatBar label="Livré"     count={livStats.livre}    total={livStats.total} color="bg-indigo-500" />
                <StatBar label="Validé"    count={livStats.valide}   total={livStats.total} color="bg-green-500" />
                <StatBar label="Rejeté"    count={livStats.rejete}   total={livStats.total} color="bg-red-400" />
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">Aucun livrable défini dans l'étape 2</p>
          )}
        </div>
 
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">🤝 Suivi des réunions</p>
          {reuStats.total > 0 ? (
            <div className="flex items-center gap-5">
              <MiniDonut pct={reuPct} color="#8b5cf6" />
              <div className="flex-1 space-y-2">
                <StatBar label="Planifiée"  count={reuStats.planned}  total={reuStats.total} color="bg-blue-400" />
                <StatBar label="Tenue"      count={reuStats.tenues}   total={reuStats.total} color="bg-green-500" />
                <StatBar label="Reportée"   count={reuStats.reportes} total={reuStats.total} color="bg-amber-400" />
                <StatBar label="Annulée"    count={reuStats.annules}  total={reuStats.total} color="bg-red-400" />
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">Aucune réunion importée depuis l'étape 2</p>
          )}
        </div>
      </div>
 
      {membres.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">👥 Équipe projet</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {membres.map((m, i) => {
              const name = [m.first_name, m.last_name].filter(Boolean).join(' ') || m.email || '—'
              const initial = (m.first_name?.[0] || m.last_name?.[0] || '?').toUpperCase()
              return (
                <div key={i} className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-3 py-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${avatarColor(m.role)}`}>
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{name}</p>
                    <p className="text-xs text-gray-500">{ROLE_LABELS[m.role] || m.role}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
 
      {jalons.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">🏁 Jalons</p>
          <div className="flex flex-wrap gap-2">
            {jalons.map((j, i) => (
              <div key={i} className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs">
                <span className="font-bold text-amber-700">{j.jalon}</span>
                {j.date && <span className="text-gray-500 ml-2">— {j.date}</span>}
                {j.description && <span className="text-gray-600 ml-1">: {j.description}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
 
// ── Meeting normalization helpers ─────────────────────────────────────────────
function normStep1Meeting(c) {
  return {
    type_reunion: c.type_reunion === 'pilotage' ? 'Réunion de pilotage' : 'Réunion technique',
    objectif:     c.objectif || '',
    pilote:       c.responsable || '',
    frequence:    c.frequence || '',
    participants: c.participants || '',
    source:       'Étape 1',
    statut:       'Planifiée',
    date_tenue:   c.date_prevue || '',
    compte_rendu: null,
    commentaire:  '',
  }
}

function normStep2Meeting(p) {
  return {
    type_reunion: p.type_reunion || '',
    objectif:     p.objectif || '',
    pilote:       p.pilote || p.responsable || '',
    frequence:    p.frequence || '',
    participants: p.participants || '',
    source:       'Étape 2',
    statut:       'Planifiée',
    date_tenue:   p.date_prevue || '',
    compte_rendu: null,
    commentaire:  '',
  }
}

/** Merge Step 1 + Step 2 meetings, Step 2 takes priority on duplicates */
function mergeAllMeetings(step1Data, step2Data) {
  const s2 = Array.isArray(step2Data?.pq_reunions_pq)
    ? step2Data.pq_reunions_pq.map(normStep2Meeting)
    : []
  const s2Types = new Set(s2.map(r => r.type_reunion))
  const s1 = Array.isArray(step1Data?.plan_communication)
    ? step1Data.plan_communication.map(normStep1Meeting).filter(r => !s2Types.has(r.type_reunion))
    : []
  return [...s2, ...s1]
}

/**
 * Build a map: type_reunion → date_prevue from step1 plan_communication + step2 pq_reunions_pq.
 * Used to patch existing reunions whose date_tenue is empty but the source step now has a date.
 */
function buildPlanDateMap(step1Data, step2Data) {
  const map = {}
  // Step 2 takes priority
  if (Array.isArray(step2Data?.pq_reunions_pq)) {
    step2Data.pq_reunions_pq.forEach(p => {
      if (p.type_reunion && p.date_prevue) map[p.type_reunion] = p.date_prevue
    })
  }
  // Step 1 fills in if not already covered
  if (Array.isArray(step1Data?.plan_communication)) {
    step1Data.plan_communication.forEach(c => {
      const key = c.type_reunion === 'pilotage' ? 'Réunion de pilotage' : 'Réunion technique'
      if (!map[key] && c.date_prevue) map[key] = c.date_prevue
    })
  }
  return map
}

/**
 * For reunions that already exist in step3 but have an empty date_tenue,
 * fill it from the plan date map (step1/step2 source of truth).
 */
function patchMissingDates(existing, planDateMap) {
  return existing.map(r => {
    if (!r.date_tenue && planDateMap[r.type_reunion]) {
      return { ...r, date_tenue: planDateMap[r.type_reunion] }
    }
    return r
  })
}
 
// ── Main Export ───────────────────────────────────────────────────────────────
export default function Step3Suivi({ at, step3Data, step2Data, step1Data, saving, onSave, onAdvance, onBack }) {
  const [activeTab, setActiveTab] = useState('reunions')
  const [reunions, setReunions]   = useState([])
  const [isDirty, setIsDirty]     = useState(false)
  // Track the last step3Data id we initialized from, so we re-init when data reloads from API
  const lastInitKey               = useRef(null)
 
  useEffect(() => {
    // Wait until we have at least step3Data (can be empty object) from the API
    if (step3Data === null) return

    // Build a key from the data to detect real changes (id + reunion count)
    const currentKey = `${step3Data?.id || 'none'}-${(step3Data?.suivi_reunions || []).length}`
    // Only re-initialize if the backend data actually changed (new load or different content)
    if (lastInitKey.current === currentKey && isDirty) return
    lastInitKey.current = currentKey

    const allPlanned  = mergeAllMeetings(step1Data, step2Data)
    const planDateMap = buildPlanDateMap(step1Data, step2Data)
    const existing    = Array.isArray(step3Data?.suivi_reunions) ? step3Data.suivi_reunions : []

    if (existing.length > 0) {
      // Restore saved data — fill date_tenue if empty but step1/step2 now has a date
      const patched       = patchMissingDates(existing, planDateMap)
      const existingTypes = new Set(patched.map(r => r.type_reunion))
      const newOnes       = allPlanned.filter(p => !existingTypes.has(p.type_reunion))
      setReunions([...patched, ...newOnes])
    } else {
      setReunions(allPlanned)
    }
    setIsDirty(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step3Data, step1Data, step2Data])

  const handleResync = useCallback(() => {
    const allPlanned  = mergeAllMeetings(step1Data, step2Data)
    const planDateMap = buildPlanDateMap(step1Data, step2Data)
    setReunions(prev => {
      // Always patch dates on existing reunions that have empty date_tenue
      const patched       = patchMissingDates(prev, planDateMap)
      const existingTypes = new Set(patched.map(r => r.type_reunion))
      const newOnes       = allPlanned.filter(p => !existingTypes.has(p.type_reunion))
      if (newOnes.length === 0 && JSON.stringify(patched) === JSON.stringify(prev)) {
        alert('Toutes les réunions sont déjà synchronisées et les dates sont à jour.')
        return prev
      }
      setIsDirty(true)
      return [...patched, ...newOnes]
    })
  }, [step1Data, step2Data])
 
  const handleReunionsChange = useCallback((val) => {
    setReunions(val)
    setIsDirty(true)
  }, [])
 
  const handleSave = useCallback(async () => {
    // 1. Sauvegarder individuellement les réunions qui ont un nouveau fichier
    const reunionsAvecFichier = reunions.filter(r => r.compte_rendu instanceof File && r.id)
    if (reunionsAvecFichier.length > 0) {
      await Promise.all(reunionsAvecFichier.map(r => saveReunion(r)))
    }
    // 2. Sauvegarder le reste normalement (step3 complet)
    await onSave({ suivi_reunions: reunions })
    setIsDirty(false)
  }, [reunions, onSave])
 
  const completedSteps = Array.from({ length: (at?.current_step || 3) - 1 }, (_, i) => i + 1)
 
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
        <ATWorkflowStepper currentStep={at?.current_step || 3} completedSteps={completedSteps} />
      </div>
 
      {isDirty && !saving && (
        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200">
          ⚠️ Modifications non sauvegardées — pensez à sauvegarder
        </div>
      )}
 
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="flex border-b border-gray-100">
          {TABS.map(tab => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-600 text-blue-700 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
 
        <div className="p-6">
          {activeTab === 'reunions' && (
            <ReunionsSuiviTab rows={reunions} onChange={handleReunionsChange} onResync={handleResync} />
          )}
          {activeTab === 'risques' && (
            <RisquesTab projectId={at?.project} />
          )}
          {activeTab === 'dashboard' && (
            <DashboardTab at={at} step1Data={step1Data} step2Data={step2Data} reunions={reunions} />
          )}
        </div>
      </div>
 
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 flex items-center justify-between">
        <button type="button" onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          ← Retour à l'étape 2
        </button>
        <div className="flex items-center gap-3">
          <button type="button" onClick={handleSave} disabled={saving || !isDirty}
            className={`flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg shadow transition-colors
              ${isDirty && !saving ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
            {saving ? (
              <><svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg> Sauvegarde…</>
            ) : '💾 Sauvegarder'}
          </button>
          <button type="button" onClick={onAdvance}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow transition-colors">
            Passer à l'étape 4 →
          </button>
        </div>
      </div>
    </div>
  )
}