import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import useRisks from '../hooks/useRisks'
import KpiCards from '../components/KpiCards'
import RiskTable from '../components/RiskTable'
import RiskDrawer from '../components/RiskDrawer'
import ExportDropdown from '../components/ExportDropdown'
import { RiskProvider, useRiskUi } from '../context/RiskContext'
import { deleteRisk } from '../api/risks.api'
import { criticality, PROCESS_OPTIONS } from '../utils/criticality'
import { exportRisks } from '../utils/exportUtils'

function RiskMapInner() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { data, loading, refresh } = useRisks(id)
  const { showToast } = useRiskUi()
  const [selectedRiskId, setSelectedRiskId] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [processFilter, setProcessFilter] = useState('')
  const [critFilter, setCritFilter] = useState('')
  const [stateFilter, setStateFilter] = useState('')

  // Ouvrir le drawer automatiquement si on revient depuis la page détail avec editRiskId
  useEffect(() => {
    if (location.state?.editRiskId) {
      setSelectedRiskId(location.state.editRiskId)
      setDrawerOpen(true)
      // Nettoyer le state pour éviter de re-ouvrir au prochain render
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  const filtered = useMemo(() => data.filter((r) => {
    const c = criticality(r?.evaluation?.probability, r?.evaluation?.severity)
    const level = c <= 4 ? 'Acceptable' : c <= 8 ? 'A surveiller' : 'Inacceptable'
    return (
      (!processFilter || r.process === processFilter) &&
      (!critFilter || level === critFilter) &&
      (!stateFilter || r.status === stateFilter)
    )
  }), [data, processFilter, critFilter, stateFilter])

  const kpi = useMemo(() => {
    const crits = data.map((r) => criticality(r?.evaluation?.probability, r?.evaluation?.severity))
    const total = data.length
    const acceptable = crits.filter((v) => v <= 4).length
    const watch = crits.filter((v) => v >= 5 && v <= 8).length
    const bad = crits.filter((v) => v >= 9).length
    const late = data.filter((r) =>
      r?.action_plan?.actual_date &&
      r?.action_plan?.status !== 'Done' &&
      new Date(r.action_plan.actual_date) < new Date()
    ).length
    const closeRate = total
      ? Math.round((data.filter((r) => r.status === 'Clôturé').length / total) * 100)
      : 0
    return { total, acceptable, watch, bad, late, closeRate }
  }, [data])

  const openDrawerNew = () => {
    setSelectedRiskId(null)
    setDrawerOpen(true)
  }

  const openDrawerEdit = (riskId) => {
    setSelectedRiskId(riskId)
    setDrawerOpen(true)
  }

  const openDetail = (riskId) => {
    navigate(`/projects/${id}/risks/${riskId}`)
  }

  const onDelete = async (riskId) => {
    if (!window.confirm('Supprimer ce risque ?')) return
    try {
      await deleteRisk(riskId)
      showToast('success', 'Risque supprimé.')
      refresh()
    } catch {
      showToast('error', 'Suppression impossible.')
    }
  }

  const handleExport = (format) => exportRisks(filtered, id, format)

  return (
    <div className="min-h-screen bg-[#F4F6F9] p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#0F2744]">Cartographie des risques</h1>
        <div className="flex gap-2">
          <button
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50 transition-colors"
            onClick={() => navigate(`/projects/${id}/risks/dashboard`)}
          >
            Dashboard
          </button>
          <button
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50 transition-colors"
            onClick={() => navigate(`/projects/${id}/risks/action-plans`)}
          >
            Plan d'Action
          </button>
          <ExportDropdown onExport={handleExport} />
          <button
            className="rounded-lg border border-[#2563EB] px-3 py-2 text-sm font-semibold text-[#2563EB] hover:bg-blue-50 transition-colors"
            onClick={() => navigate(`/projects/${id}/risks/guide`)}
          >
            🧭 Guide de risques
          </button>
          <button
            className="rounded-lg bg-[#2563EB] px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            onClick={openDrawerNew}
          >
            + Nouveau Risque
          </button>
        </div>
      </div>

      {/* KPIs */}
      <KpiCards kpi={kpi} />

      {/* Filtres */}
      <div className="my-4 flex gap-3">
        <select
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-[#2563EB]"
          value={processFilter}
          onChange={(e) => setProcessFilter(e.target.value)}
        >
          <option value="">Tous les processus</option>
          {PROCESS_OPTIONS.map((p) => <option key={p}>{p}</option>)}
        </select>
        <select
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-[#2563EB]"
          value={critFilter}
          onChange={(e) => setCritFilter(e.target.value)}
        >
          <option value="">Toutes criticités</option>
          <option>Acceptable</option>
          <option>A surveiller</option>
          <option>Inacceptable</option>
        </select>
        <select
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-[#2563EB]"
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
        >
          <option value="">Tous les états</option>
          <option>Ouvert</option>
          <option>Atténué</option>
          <option>Clôturé</option>
        </select>
      </div>

      {/* Tableau */}
      {loading ? (
        <div className="h-56 animate-pulse rounded-xl bg-white" />
      ) : (
        <RiskTable
          rows={filtered}
          onEdit={openDrawerEdit}
          onDelete={onDelete}
          onViewDetail={openDetail}
        />
      )}

      {/* Drawer */}
      <RiskDrawer
        open={drawerOpen}
        riskId={selectedRiskId}
        projectId={id}
        onClose={() => { setDrawerOpen(false); setSelectedRiskId(null) }}
        onSaved={refresh}
      />
    </div>
  )
}

export default function RiskMap() {
  return <RiskProvider><RiskMapInner /></RiskProvider>
}
