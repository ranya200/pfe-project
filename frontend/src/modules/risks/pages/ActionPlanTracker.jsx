import { useParams, useNavigate } from 'react-router-dom'
import useActionPlans from '../hooks/useActionPlans'
import ActionPlanTable from '../components/ActionPlanTable'
import ExportDropdown from '../components/ExportDropdown'
import { patchActionPlan } from '../api/risks.api'
import { RiskProvider, useRiskUi } from '../context/RiskContext'
import { exportActionPlans } from '../utils/exportUtils'

function TrackerInner() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, loading, error, refresh } = useActionPlans(id)
  const { showToast } = useRiskUi()

  const onPatch = async (planId, payload) => {
    try {
      await patchActionPlan(planId, payload)
      showToast('success', 'Action mise a jour.')
      refresh()
    } catch {
      showToast('error', 'Mise a jour impossible.')
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9] p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#0F2744]">Suivi du Plan d'Action</h1>
        <div className="flex gap-2">
          <ExportDropdown onExport={(fmt) => exportActionPlans(data, id, fmt)} />
          <button className="rounded border bg-white px-3 py-2 text-sm" onClick={() => navigate(`/projects/${id}/risks`)}>Retour cartographie</button>
        </div>
      </div>
      {loading && <div className="h-56 animate-pulse rounded-xl bg-white" />}
      {error && <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {!loading && !error && <ActionPlanTable rows={data} onPatch={onPatch} />}
    </div>
  )
}

export default function ActionPlanTracker() {
  return <RiskProvider><TrackerInner /></RiskProvider>
}
