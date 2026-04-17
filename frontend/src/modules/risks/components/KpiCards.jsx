const Card = ({ title, value, color = '#0F2744' }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <p className="text-xs font-medium text-slate-500">{title}</p>
    <p className="mt-2 text-2xl font-bold" style={{ color }}>{value}</p>
  </div>
)

export default function KpiCards({ kpi }) {
  return (
    <div className="grid grid-cols-6 gap-3">
      <Card title="Total Risques" value={kpi.total || 0} />
      <Card title="Acceptables" value={kpi.acceptable || 0} color="#16A34A" />
      <Card title="A surveiller" value={kpi.watch || 0} color="#D97706" />
      <Card title="Inacceptables" value={kpi.bad || 0} color="#DC2626" />
      <Card title="Actions en retard" value={kpi.late || 0} color="#DC2626" />
      <Card title="Taux de cloture %" value={`${kpi.closeRate || 0}%`} color="#2563EB" />
    </div>
  )
}
