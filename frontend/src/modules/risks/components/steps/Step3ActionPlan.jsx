const inputCls = 'w-full rounded border border-slate-300 bg-white p-2 text-sm focus:border-[#2563EB] focus:outline-none'

const Field = ({ label, required, children }) => (
  <div>
    <label className="mb-1 block text-sm font-medium text-slate-700">
      {label}{required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
    {children}
  </div>
)

const AP_STATUS_OPTIONS = [
  { value: 'IDLE',        label: 'Non démarré' },
  { value: 'In Progress', label: 'En cours' },
  { value: 'Blocked',     label: 'Bloqué' },
  { value: 'Done',        label: 'Terminé' },
]

export default function Step3ActionPlan({ form, setForm, members = [] }) {
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  return (
    <div className="space-y-4">

      {/* Action à mener */}
      <Field label="Action à mener" required>
        <textarea className={inputCls} rows={2} value={form.action || ''} onChange={(e) => set('action', e.target.value)} />
      </Field>

      {/* Responsable */}
      <Field label="Responsable" required>
        <select className={inputCls} value={form.responsible || ''} onChange={(e) => set('responsible', e.target.value)}>
          <option value="">-- Choisir un membre --</option>
          {members.map((m) => (
            <option key={m.id || m.value} value={m.id || m.value}>
              {m.name || m.label || m.email}
            </option>
          ))}
        </select>
      </Field>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date planifiée" required>
          <input type="date" className={inputCls} value={form.planned_date || ''} onChange={(e) => set('planned_date', e.target.value)} />
        </Field>
        <Field label="Date réelle">
          <input type="date" className={inputCls} value={form.actual_date || ''} onChange={(e) => set('actual_date', e.target.value)} />
        </Field>
      </div>

      {/* Statut plan d'action */}
      <Field label="Statut">
        <div className="grid grid-cols-4 gap-2">
          {AP_STATUS_OPTIONS.map((s) => {
            const active = (form.ap_status || 'IDLE') === s.value
            return (
              <button key={s.value} type="button"
                className={`rounded-lg border-2 py-2 text-center text-xs font-medium transition-all ${active ? 'border-[#2563EB] bg-blue-50 text-[#2563EB]' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                onClick={() => set('ap_status', s.value)}>
                {s.label}
              </button>
            )
          })}
        </div>
      </Field>

      {/* Avancement */}
      <Field label={`Avancement : ${form.progress || 0}%`}>
        <input type="range" min="0" max="100" step="5"
          className="w-full accent-[#2563EB]"
          value={form.progress || 0}
          onChange={(e) => set('progress', Number(e.target.value))} />
        <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
          <span>0%</span><span>50%</span><span>100%</span>
        </div>
      </Field>

      {/* Critères d'efficacité */}
      <Field label="Critères d'efficacité">
        <textarea className={inputCls} rows={2} value={form.effectiveness_criteria || ''} onChange={(e) => set('effectiveness_criteria', e.target.value)} />
      </Field>

      {/* Efficacité */}
      <Field label="Efficacité ">
        <textarea className={inputCls} rows={2} value={form.efficacite || ''} onChange={(e) => set('efficacite', e.target.value)} />
      </Field>

      {/* Commentaire */}
      <Field label="Commentaire">
        <textarea className={inputCls} rows={2} value={form.comment || ''} onChange={(e) => set('comment', e.target.value)} />
      </Field>
    </div>
  )
}
