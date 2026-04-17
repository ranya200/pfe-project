import { Radar, RadarChart, PolarGrid, PolarAngleAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function RiskRadarChart({ rows = [] }) {
  return (
    <div className="h-[420px] rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-2 text-base font-semibold text-[#0F2744]">Radar criticite initiale vs residuelle</h3>
      <ResponsiveContainer width="100%" height="92%">
        <RadarChart data={rows}>
          <PolarGrid />
          <PolarAngleAxis dataKey="code" />
          <Tooltip />
          <Legend />
          <Radar name="Initiale" dataKey="initiale" stroke="#2563EB" fill="#2563EB" fillOpacity={0.35} />
          <Radar name="Residuelle" dataKey="residuelle" stroke="#DC2626" fill="#DC2626" fillOpacity={0.15} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
