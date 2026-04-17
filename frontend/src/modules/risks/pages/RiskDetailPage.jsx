import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getRiskFull, getRiskAuditLogs } from '../api/risks.api'
import CriticalityBadge from '../components/CriticalityBadge'
import ExportDropdown from '../components/ExportDropdown'
import { criticality, reductionPct } from '../utils/criticality'
import { exportRiskDetail } from '../utils/exportUtils'
import { RiskProvider, useRiskUi } from '../context/RiskContext'

// ─── Helpers ────────────────────────────────────────────────────────────────

function initials(name = '') {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

// Extrait le nom complet depuis responsible_detail (objet UserSerializer)
function getResponsibleName(ap) {
  const d = ap?.responsible_detail
  if (!d) return '—'
  const full = `${d.first_name || ''} ${d.last_name || ''}`.trim()
  return full || d.email || '—'
}

const STATUS_STYLES = {
  'Ouvert':   { bg: '#FEE2E2', color: '#991B1B' },
  'Atténué':  { bg: '#FEF3C7', color: '#92400E' },
  'Clôturé':  { bg: '#DCFCE7', color: '#166534' },
}

const AP_STATUS_STYLES = {
  'IDLE':        { bg: '#F1F5F9', color: '#475569', label: 'Non démarré' },
  'In Progress': { bg: '#DBEAFE', color: '#1D4ED8', label: 'En cours' },
  'Blocked':     { bg: '#FEE2E2', color: '#991B1B', label: 'Bloqué' },
  'Done':        { bg: '#DCFCE7', color: '#166534', label: 'Terminé' },
}

function InfoRow({ label, value }) {
  return (
    <div>
      <div className="text-xs text-slate-400">{label}</div>
      <div className="text-sm font-semibold text-slate-800">{value || '—'}</div>
    </div>
  )
}

// ─── Onglet Vue d'ensemble ───────────────────────────────────────────────────

function TabOverview({ risk }) {
  const eval_ = risk.evaluation || {}
  const residual = risk.residual || {}
  const ap = risk.action_plan || {}

  const initC = criticality(eval_.probability, eval_.severity)
  const resC = criticality(residual.probability, residual.severity)
  const red = resC ? reductionPct(initC, resC) : null

  const statusStyle = STATUS_STYLES[risk.status] || {}
  const apStyle = AP_STATUS_STYLES[ap.status] || AP_STATUS_STYLES['IDLE']
  const responsibleName = getResponsibleName(ap)

  return (
    <div className="space-y-4">
      {/* Cards criticité */}
      <div className="grid grid-cols-3 gap-4">
        {/* Criticité initiale */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-sm font-medium text-slate-500 mb-3">Criticité Initiale</div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl text-2xl font-bold"
              style={{ background: initC <= 4 ? '#DCFCE7' : initC <= 8 ? '#FEF3C7' : '#FEE2E2', color: initC <= 4 ? '#166534' : initC <= 8 ? '#92400E' : '#991B1B' }}>
              {initC || '—'}
            </div>
            <div className="text-xs text-slate-500 text-center">
              Probabilité: {eval_.probability || '—'} × Gravité: {eval_.severity || '—'}
            </div>
            <CriticalityBadge value={initC} />
          </div>
        </div>

        {/* Criticité résiduelle */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-sm font-medium text-slate-500 mb-3">Criticité Résiduelle</div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl text-2xl font-bold"
              style={{ background: resC <= 4 ? '#DCFCE7' : resC <= 8 ? '#FEF3C7' : '#FEE2E2', color: resC <= 4 ? '#166534' : resC <= 8 ? '#92400E' : '#991B1B' }}>
              {resC || '—'}
            </div>
            <div className="text-xs text-slate-500 text-center">
              Probabilité: {residual.probability || '—'} × Gravité: {residual.severity || '—'}
            </div>
            <CriticalityBadge value={resC} />
          </div>
        </div>

        {/* Réduction */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-sm font-medium text-slate-500 mb-3">Réduction</div>
          <div className="flex flex-col items-center gap-3">
            <div className={`text-3xl font-bold ${red > 0 ? 'text-green-600' : red < 0 ? 'text-red-600' : 'text-slate-400'}`}>
              {red !== null ? `${Math.abs(red)}%` : '—'}
            </div>
            {/* Barre de progression */}
            {red !== null && (
              <div className="w-full">
                <div className="h-2 w-full rounded-full bg-slate-100">
                  <div className="h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.abs(red))}%`, background: red > 0 ? '#2563EB' : '#DC2626' }} />
                </div>
                <div className="mt-1 text-xs text-slate-400 text-center">De {initC} à {resC}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Informations + Décision */}
      <div className="grid grid-cols-2 gap-4">
        {/* Informations générales */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
          <div className="text-sm font-semibold text-slate-800 mb-1">Informations générales</div>
          <InfoRow label="Processus" value={risk.process} />
          <InfoRow label="Activité" value={risk.activity} />
          <InfoRow label="Type" value={risk.risk_type} />
          <InfoRow label="Origine" value={risk.origin} />
          {/* Responsable */}
          <div>
            <div className="text-xs text-slate-400 mb-1">Responsable</div>
            {responsibleName !== '—' ? (
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2563EB] text-white text-[10px] font-bold">
                  {initials(responsibleName)}
                </div>
                <span className="text-sm font-semibold text-slate-800">{responsibleName}</span>
              </div>
            ) : <span className="text-sm text-slate-500">—</span>}
          </div>
          {/* État */}
          <div>
            <div className="text-xs text-slate-400 mb-1">État</div>
            <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={statusStyle}>
              {risk.status || '—'}
            </span>
          </div>
        </div>

        {/* Décision et mesures */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
          <div className="text-sm font-semibold text-slate-800 mb-1">Décision et mesures</div>
          <div>
            <div className="text-xs text-slate-400 mb-1">Décision</div>
            {eval_.decision ? (
              <span className="rounded-full bg-[#2563EB] px-3 py-1 text-xs font-semibold text-white">
                {eval_.decision}
              </span>
            ) : <span className="text-sm text-slate-500">—</span>}
          </div>
          <InfoRow label="Mesures actuelles" value={risk.existing_measures} />
          <div>
            <div className="text-xs text-slate-400 mb-1">Actions en cours</div>
            <div className="text-sm font-semibold text-slate-800">
              {ap.action ? '1 action' : '0 action'}
            </div>
          </div>
          {ap.action && (
            <div>
              <div className="text-xs text-slate-400 mb-1">Statut du plan</div>
              <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: apStyle.bg, color: apStyle.color }}>
                {apStyle.label}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Onglet Analyse ──────────────────────────────────────────────────────────

function TabAnalyse({ risk }) {
  const eval_ = risk.evaluation || {}
  const residual = risk.residual || {}
  const initC = criticality(eval_.probability, eval_.severity)
  const resC = criticality(residual.probability, residual.severity)

  const CELL_COLOR = (v) => v <= 4 ? '#DCFCE7' : v <= 8 ? '#FEF3C7' : '#FEE2E2'
  const CELL_TEXT  = (v) => v <= 4 ? '#166534' : v <= 8 ? '#92400E' : '#991B1B'

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-5">
      <div className="text-sm font-semibold text-slate-800">Analyse détaillée</div>

      <div>
        <div className="text-sm font-semibold text-slate-700 mb-1">Identification du risque</div>
        <p className="text-sm text-slate-600">{risk.title || '—'}</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="text-sm font-semibold text-slate-700 mb-1">Causes (Ishikawa)</div>
          <p className="text-sm text-slate-600">{risk.causes || '—'}</p>
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-700 mb-1">Conséquences</div>
          <p className="text-sm text-slate-600">{risk.consequences || '—'}</p>
        </div>
      </div>

      {/* Matrice 4×4 */}
      <div>
        <div className="text-sm font-semibold text-slate-700 mb-3">Matrice de criticité</div>
        <div className="inline-block">
          <div className="mb-1 grid grid-cols-5 gap-1 text-center text-xs text-slate-400">
            <div />
            {['G1','G2','G3','G4'].map((g) => <div key={g}>{g}</div>)}
          </div>
          {[4, 3, 2, 1].map((yy) => (
            <div key={yy} className="grid grid-cols-5 gap-1 mb-1">
              <div className="flex items-center justify-center text-xs text-slate-400 w-8">P{yy}</div>
              {[1, 2, 3, 4].map((xx) => {
                const v = xx * yy
                const isInit = xx === eval_.severity && yy === eval_.probability
                const isRes  = xx === residual.severity && yy === residual.probability
                return (
                  <div key={xx}
                    className="flex h-10 w-10 items-center justify-center rounded text-xs font-semibold relative"
                    style={{ background: CELL_COLOR(v), color: CELL_TEXT(v) }}>
                    {v}
                    {isInit && <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full border border-white bg-red-500" />}
                    {isRes  && <span className="absolute -bottom-0.5 -left-0.5 h-2 w-2 rounded-full border border-white bg-green-500" />}
                  </div>
                )
              })}
            </div>
          ))}
          <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> Criticité initiale</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" /> Criticité résiduelle</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Onglet Plan d'action ────────────────────────────────────────────────────

function TabActionPlan({ risk }) {
  const ap = risk.action_plan
  if (!ap) return (
    <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-400 text-sm">
      Aucun plan d'action défini
    </div>
  )

  const apStyle = AP_STATUS_STYLES[ap.status] || AP_STATUS_STYLES['IDLE']
  const responsibleName = getResponsibleName(ap)
  const progress = Number(ap.progress || 0)

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="text-sm font-semibold text-slate-800 mb-4">Plan d'action</div>
      <div className="space-y-4">
        <div className="rounded-lg border border-slate-100 p-4 space-y-3">
          {/* Titre action + statut */}
          <div className="flex items-start justify-between">
            <div className="text-sm font-semibold text-slate-800">{ap.action}</div>
            <span className="rounded-full px-2.5 py-0.5 text-xs font-medium ml-2 shrink-0"
              style={{ background: apStyle.bg, color: apStyle.color }}>
              {apStyle.label}
            </span>
          </div>

          {/* Responsable */}
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2563EB] text-white text-[10px] font-bold shrink-0">
              {initials(responsibleName)}
            </div>
            <span className="text-sm text-slate-600">{responsibleName}</span>
          </div>

          {/* Progression */}
          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Progression</span>
              <span className="font-semibold text-slate-700">{progress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-[#2563EB] transition-all"
                style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Dates */}
          <div className="flex gap-4 text-xs text-slate-500">
            {ap.planned_date && <span>Date planifiée : <span className="font-medium text-slate-700">{ap.planned_date}</span></span>}
            {ap.actual_date && <span>Date réelle : <span className="font-medium text-slate-700">{ap.actual_date}</span></span>}
          </div>

          {/* Critères d'efficacité */}
          {ap.effectiveness_criteria && (
            <div className="rounded bg-slate-50 px-3 py-2 text-xs text-slate-600">
              <span className="font-medium">Critère : </span>{ap.effectiveness_criteria}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Onglet Historique ───────────────────────────────────────────────────────

const ACTION_META = {
  RISK_CREATE:     { color: '#16a34a', label: 'Risque créé' },
  RISK_UPDATE:     { color: '#2563EB', label: 'Risque modifié' },
  RISK_DELETE:     { color: '#dc2626', label: 'Risque supprimé' },
  RISK_EVAL:       { color: '#7c3aed', label: 'Évaluation mise à jour' },
  ACTION_CREATE:   { color: '#0891b2', label: "Plan d'action créé" },
  ACTION_UPDATE:   { color: '#0891b2', label: "Plan d'action mis à jour" },
  RESIDUAL_CREATE: { color: '#059669', label: 'Risque résiduel créé' },
  RESIDUAL_UPDATE: { color: '#059669', label: 'Risque résiduel mis à jour' },
}

const fmtDate = (d) => {
  if (!d) return ''
  try {
    return new Date(d).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return d }
}

function ChangesDetail({ oldValues, newValues }) {
  if (!newValues) return null
  const keys = Object.keys(newValues).filter(
    k => !['id', 'created_at', 'updated_at', 'risk'].includes(k)
      && JSON.stringify(oldValues?.[k]) !== JSON.stringify(newValues[k])
  )
  if (!keys.length) return null
  return (
    <div className="mt-2 rounded-lg border border-slate-100 bg-slate-50 divide-y divide-slate-100">
      {keys.map(k => (
        <div key={k} className="flex items-start gap-2 px-3 py-1.5 text-xs">
          <span className="shrink-0 font-medium text-slate-600 w-28 truncate">{k}</span>
          {oldValues?.[k] !== undefined && oldValues[k] !== null && (
            <span className="line-through text-red-400 truncate max-w-[100px]">
              {String(oldValues[k])}
            </span>
          )}
          {oldValues?.[k] !== undefined && <span className="text-slate-400">→</span>}
          <span className="text-slate-700 truncate max-w-[120px]">{String(newValues[k] ?? '—')}</span>
        </div>
      ))}
    </div>
  )
}

function TabHistorique({ risk }) {
  const [logs, setLogs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [expanded, setExpanded] = useState({})

  useEffect(() => {
    if (!risk?.id) return
    setLoading(true)
    getRiskAuditLogs(risk.id)
      .then(res => setLogs(res.results || []))
      .catch(() => setError('Impossible de charger l\'historique.'))
      .finally(() => setLoading(false))
  }, [risk?.id])

  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  if (loading) return (
    <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
      Chargement de l'historique…
    </div>
  )

  if (error) return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
      {error}
    </div>
  )

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="text-sm font-semibold text-slate-800">Journal d'audit — {risk.code}</div>
        <span className="text-xs text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">{logs.length} entrée{logs.length !== 1 ? 's' : ''}</span>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-8 text-sm text-slate-400">
          Aucune entrée d'audit pour ce risque.
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            const meta = ACTION_META[log.action] || { color: '#94a3b8', label: log.action_label || log.action }
            const hasChanges = log.new_values && Object.keys(log.new_values).length > 0
            const isOpen = expanded[log.id]
            return (
              <div key={log.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-start gap-3">
                  {/* Dot */}
                  <div className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: meta.color }} />
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-800">{meta.label}</span>
                      <span className="text-[11px] text-slate-400 shrink-0">{fmtDate(log.timestamp)}</span>
                    </div>
                    {/* Sub info */}
                    <div className="text-xs text-slate-500 mt-0.5 truncate">{log.object_repr}</div>
                    <div className="text-xs text-slate-400 mt-1">
                      Par <span className="font-medium text-slate-600">{log.user_fullname || log.user_email || 'Système'}</span>
                      {log.ip_address && <span className="ml-2 text-slate-300">· {log.ip_address}</span>}
                    </div>
                    {/* Changes toggle */}
                    {hasChanges && (
                      <button
                        onClick={() => toggle(log.id)}
                        className="mt-1.5 text-[11px] font-medium text-blue-600 hover:text-blue-800"
                      >
                        {isOpen ? '▲ Masquer les détails' : '▼ Voir les modifications'}
                      </button>
                    )}
                    {isOpen && (
                      <ChangesDetail oldValues={log.old_values} newValues={log.new_values} />
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Page principale ─────────────────────────────────────────────────────────

const TABS = ['Vue d\'ensemble', 'Analyse', 'Plan d\'action', 'Historique']

function RiskDetailInner() {
  const { projectId, riskId } = useParams()
  const navigate = useNavigate()
  const { showToast } = useRiskUi()
  const [risk, setRisk] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(0)

  useEffect(() => {
    const load = async () => {
      try {
        const full = await getRiskFull(riskId)
        setRisk(full)
      } catch {
        showToast('error', 'Impossible de charger ce risque.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [riskId, showToast])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] p-6 space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-white" />)}
      </div>
    )
  }

  if (!risk) return (
    <div className="min-h-screen bg-[#F4F6F9] p-6">
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 text-sm">Risque introuvable.</div>
    </div>
  )

  const initC = criticality(risk.evaluation?.probability, risk.evaluation?.severity)
  const badgeStyle = initC <= 4
    ? { bg: '#DCFCE7', color: '#166534', label: 'Acceptable' }
    : initC <= 8
    ? { bg: '#FEF3C7', color: '#92400E', label: 'À surveiller' }
    : { bg: '#FEE2E2', color: '#991B1B', label: 'Inacceptable' }

  return (
    <div className="min-h-screen bg-[#F4F6F9]">
      {/* Top bar */}
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <button
              className="text-slate-400 hover:text-slate-600 transition-colors mr-1"
              onClick={() => navigate(`/projects/${projectId}/risks`)}
            >
              ←
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#0F2744]">
                  Risque {risk.code || `R${risk.id}`}
                </h1>
                <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  style={{ background: badgeStyle.bg, color: badgeStyle.color }}>
                  {badgeStyle.label}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">{risk.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ExportDropdown
              onExport={(fmt) => exportRiskDetail(risk, fmt)}
              label="Exporter"
              variant="ghost"
            />
            <button
              className="flex items-center gap-1.5 rounded-lg bg-[#2563EB] px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
              onClick={() => navigate(`/projects/${projectId}/risks`, { state: { editRiskId: risk.id } })}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z" />
              </svg>
              Modifier
            </button>
          </div>
        </div>

        {/* Onglets */}
        <div className="mt-4 flex gap-1">
          {TABS.map((t, i) => (
            <button
              key={t}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === i
                  ? 'bg-slate-100 text-slate-800'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => setActiveTab(i)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Contenu de l'onglet */}
      <div className="p-6">
        {activeTab === 0 && <TabOverview risk={risk} />}
        {activeTab === 1 && <TabAnalyse risk={risk} />}
        {activeTab === 2 && <TabActionPlan risk={risk} />}
        {activeTab === 3 && <TabHistorique risk={risk} />}
      </div>
    </div>
  )
}

export default function RiskDetailPage() {
  return <RiskProvider><RiskDetailInner /></RiskProvider>
}
