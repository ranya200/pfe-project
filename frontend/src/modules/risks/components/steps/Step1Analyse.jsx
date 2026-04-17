import { PROCESS_OPTIONS } from '../../utils/criticality'

const DEPARTMENT_OPTIONS = [
  { value: 'MEDIA',     label: 'Média & Énergie' },
  { value: 'SPACE',     label: 'Space' },
  { value: 'BE',        label: 'BE Electronique' },
  { value: 'MONETIQUE', label: 'Monétique' },
  { value: 'SI',        label: 'SI' },
  { value: 'TELECOM',   label: 'Télécom' },
  { value: 'RH',        label: 'RH' },
  { value: 'QUALITE',   label: 'Qualité' },
  { value: 'ADMIN',     label: 'Admin' },
]

const Field = ({ label, required, children }) => (
  <div>
    <label className="mb-1 block text-sm font-medium text-slate-700">
      {label}{required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
    {children}
  </div>
)

const inputCls = "w-full rounded border border-slate-300 bg-white p-2 text-sm focus:border-[#2563EB] focus:outline-none"

export default function Step1Analyse({ form, setForm }) {
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  return (
    <div className="space-y-4">
      {/* Processus + Département */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Processus" required>
          <select className={inputCls} value={form.process || ''} onChange={(e) => set('process', e.target.value)}>
            <option value="">-- Choisir --</option>
            {PROCESS_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="Activité / Département" required>
          <select className={inputCls} value={form.activity || ''} onChange={(e) => set('activity', e.target.value)}>
            <option value="">-- Choisir --</option>
            {DEPARTMENT_OPTIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </Field>
      </div>

      {/* Identification du risque */}
      <Field label="Identification du risque" required>
        <textarea className={inputCls} rows={2} value={form.title || ''} onChange={(e) => set('title', e.target.value)} />
      </Field>

      {/* Type + Origine */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Type de risque" required>
          <select className={inputCls} value={form.risk_type || 'Interne'} onChange={(e) => set('risk_type', e.target.value)}>
            <option value="Interne">Interne</option>
            <option value="Externe">Externe</option>
          </select>
        </Field>
        <Field label="Origine" required>
          <select className={inputCls} value={form.origin || 'Telnet'} onChange={(e) => set('origin', e.target.value)}>
            <option value="Telnet">Telnet</option>
            <option value="Client">Client</option>
          </select>
        </Field>
      </div>

      {/* Causes */}
      <Field label="Causes" required>
        <textarea className={inputCls} rows={2} value={form.causes || ''} onChange={(e) => set('causes', e.target.value)} />
      </Field>

      {/* Conséquences */}
      <Field label="Conséquences" required>
        <textarea className={inputCls} rows={2} value={form.consequences || ''} onChange={(e) => set('consequences', e.target.value)} />
      </Field>

      {/* Mesures existantes */}
      <Field label="Mesures existantes">
        <textarea className={inputCls} rows={2} value={form.existing_measures || ''} onChange={(e) => set('existing_measures', e.target.value)} />
      </Field>

      
    </div>
  )
}
