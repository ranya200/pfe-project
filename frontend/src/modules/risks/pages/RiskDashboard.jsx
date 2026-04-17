import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import useDashboard from '../hooks/useDashboard'
import CriticalityMatrix from '../components/CriticalityMatrix'
import RiskRadarChart from '../components/RiskRadarChart'
import ExportDropdown from '../components/ExportDropdown'
import { exportDashboard } from '../utils/exportUtils'

const bucket = (rows, type = 'initial') => {
  const out = {}
  rows.forEach((r) => {
    const p = type === 'initial' ? Number(r.probabilite || 1) : Number(r.probabilite_residuelle || 1)
    const g = type === 'initial' ? Number(r.gravite || 1) : Number(r.gravite_residuelle || 1)
    const key = `${p}-${g}`
    if (!out[key]) out[key] = []
    out[key].push(r.code || `R${r.id}`)
  })
  return out
}

export default function RiskDashboard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, loading, error } = useDashboard(id)
  const [mode, setMode] = useState('initial')
  const rows = data?.risks || data?.rows || []
  const radarRaw = data?.radar || []
  const heatRaw = data?.heatmap || {}

  const radarRows = useMemo(() => {
    if (radarRaw.length) {
      return radarRaw.map((r) => ({ code: r.code, initiale: Number(r.initial || 0), residuelle: Number(r.residual || 0) }))
    }
    return rows.map((r) => ({
      code: r.code || `R${r.id}`,
      initiale: Number(r?.evaluation?.criticality || 0),
      residuelle: Number(r?.residual?.criticality || 0),
    }))
  }, [rows, radarRaw])

  return (
    <div className="min-h-screen bg-[#F4F6F9] p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#0F2744]">Dashboard Risques</h1>
        <div className="flex gap-2">
          <ExportDropdown onExport={(fmt) => exportDashboard(radarRows, rows, id, fmt)} />
          <button className="rounded border bg-white px-3 py-2 text-sm" onClick={() => navigate(`/projects/${id}/risks`)}>Retour cartographie</button>
        </div>
      </div>
      {loading && <div className="h-56 animate-pulse rounded-xl bg-white" />}
      {error && <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {!loading && !error && (
        <div className="space-y-4">
          <CriticalityMatrix
            title="Matrice de criticite 4x4"
            cells={mode === 'initial' ? (heatRaw.initial || bucket(rows, mode)) : (heatRaw.residual || bucket(rows, mode))}
            toggle={mode}
            setToggle={setMode}
          />
          <RiskRadarChart rows={radarRows} />
          <div className="overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr><th className="px-3 py-2">Code</th><th className="px-3 py-2">Identification</th><th className="px-3 py-2">Initiale</th><th className="px-3 py-2">Residuelle</th><th className="px-3 py-2">Evolution</th></tr>
              </thead>
              <tbody>
                {radarRows.map((r) => {
                  const diff = r.residuelle - r.initiale
                  return (
                    <tr key={r.code} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-semibold">{r.code}</td>
                      <td className="px-3 py-2">{rows.find((x) => (x.code || `R${x.id}`) === r.code)?.identification || '-'}</td>
                      <td className="px-3 py-2">{r.initiale}</td>
                      <td className="px-3 py-2">{r.residuelle}</td>
                      <td className="px-3 py-2" style={{ color: diff <= 0 ? '#16A34A' : '#DC2626' }}>{diff <= 0 ? '↓ Reduction' : '↑ Aggravation'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
