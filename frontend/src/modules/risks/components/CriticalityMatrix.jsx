export default function CriticalityMatrix({ cells = {}, title, toggle, setToggle }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-[#0F2744]">{title}</h3>
        {toggle && (
          <button className="rounded border px-3 py-1 text-xs" onClick={() => setToggle((p) => (p === 'initial' ? 'residual' : 'initial'))}>
            {toggle === 'initial' ? 'Initial' : 'Residuel'}
          </button>
        )}
      </div>
      <div className="grid grid-cols-4 gap-1">
        {[4, 3, 2, 1].map((y) => [1, 2, 3, 4].map((x) => {
          const v = x * y
          const key = `${y}-${x}`
          const tags = cells[key] || []
          return (
            <div key={key} className="min-h-24 rounded border p-2 text-xs" style={{ background: v <= 4 ? '#DCFCE7' : v <= 8 ? '#FEF3C7' : '#FEE2E2' }}>
              <p className="mb-1 font-semibold text-slate-700">P{y}xG{x}</p>
              <div className="flex flex-wrap gap-1">{tags.map((t) => <span key={t} className="rounded bg-white/80 px-1.5 py-0.5">{t}</span>)}</div>
            </div>
          )
        }))}
      </div>
      <div className="mt-3 flex gap-3 text-xs">
        <span className="rounded px-2 py-1" style={{ background: '#DCFCE7', color: '#166534' }}>Acceptable</span>
        <span className="rounded px-2 py-1" style={{ background: '#FEF3C7', color: '#92400E' }}>A surveiller</span>
        <span className="rounded px-2 py-1" style={{ background: '#FEE2E2', color: '#991B1B' }}>Inacceptable</span>
      </div>
    </div>
  )
}
