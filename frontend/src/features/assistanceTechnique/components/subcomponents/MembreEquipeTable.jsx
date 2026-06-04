import { useState, useCallback } from 'react'

// Roles match the user DB exactly (same values used in both AT model and user model)
const ROLES = [
  { value: 'admin',           label: 'Administrateur' },
  { value: 'resp_qualite',    label: 'Responsable Qualité' },
  { value: 'chef_projet',     label: 'Chef de Projet' },
  { value: 'developpeur',     label: 'Développeur' },
  { value: 'tech_lead',       label: 'Tech Lead' },
  { value: 'ingenieur',       label: 'Ingénieur' },
  { value: 'validateur',      label: 'Validateur' },
  { value: 'charge_affaires', label: "Chargé d'Affaires" },
  { value: 'consultant',      label: 'Consultant' },
  { value: 'stagiaire',       label: 'Stagiaire' },
]

// ── Row — shows all dept users in the name dropdown ──────────────────────────
function MembreRow({ m, idx, deptUsers, onUpdate, onRemove, onMemberAdd }) {
  const [open, setOpen] = useState(false)

  const selectUser = useCallback((user) => {
    const fullName = `${user.first_name} ${user.last_name}`.trim()
    onUpdate(idx, 'nom', fullName)
    // Also sync user to the project member list
    if (user.id && onMemberAdd) onMemberAdd(user.id)
    setOpen(false)
  }, [idx, onUpdate, onMemberAdd])

  // Filter dept users by the search text for convenience
  const query   = m.nom || ''
  const options = deptUsers.filter(u => {
    const full = `${u.first_name} ${u.last_name}`.toLowerCase()
    return !query || full.includes(query.toLowerCase())
  })

  return (
    <tr className="hover:bg-gray-50 border-b last:border-b-0">
      <td className="px-2 py-1.5">
        <select value={m.role} onChange={e => onUpdate(idx, 'role', e.target.value)}
          className="border border-gray-200 rounded px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400">
          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </td>
      <td className="px-2 py-1.5 relative min-w-[180px]">
        <div className="relative">
          <input
            value={m.nom}
            required
            onChange={e => onUpdate(idx, 'nom', e.target.value)}
            onFocus={() => setOpen(deptUsers.length > 0)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder="Nom complet *"
            className="border border-gray-200 rounded px-3 py-1.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
          {open && options.length > 0 && (
            <ul className="absolute z-50 left-0 right-0 top-full mt-0.5 bg-white border border-gray-200 rounded shadow-lg max-h-52 overflow-y-auto text-sm">
              {options.map(u => (
                <li key={u.id}
                  onMouseDown={() => selectUser(u)}
                  className="px-3 py-2 cursor-pointer hover:bg-blue-50 flex flex-col">
                  <span className="font-medium">{u.first_name} {u.last_name}</span>
                  <span className="text-xs text-gray-400">{u.role_display || u.role} — {u.email}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </td>
      <td className="px-2 py-1.5">
        <input value={m.responsabilites} onChange={e => onUpdate(idx, 'responsabilites', e.target.value)}
          placeholder="Responsabilités"
          className="border border-gray-200 rounded px-3 py-1.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400" />
      </td>
      <td className="px-2 py-1.5 text-center">
        <button type="button" onClick={() => onRemove(idx)} className="text-red-400 hover:text-red-600 text-xs px-2">✕</button>
      </td>
    </tr>
  )
}

// ── Main table ────────────────────────────────────────────────────────────────
export default function MembreEquipeTable({ membres = [], onChange, deptUsers = [], onMemberAdd }) {
  const update = useCallback((idx, field, value) => {
    onChange(membres.map((m, i) => i === idx ? { ...m, [field]: value } : m))
  }, [membres, onChange])

  const add    = () => onChange([...membres, { role: 'developpeur', nom: '', responsabilites: '', email: '', telephone: '' }])
  const remove = useCallback((idx) => onChange(membres.filter((_, i) => i !== idx)), [membres, onChange])

  return (
    <div>
      <div className="overflow-x-auto rounded border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Rôle *', 'Nom *', 'Responsabilités', ''].map(h => (
                <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-600 border-b">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {membres.length === 0 && (
              <tr><td colSpan={4} className="text-center text-gray-400 py-4 text-xs">Aucun membre — cliquez sur + Ajouter</td></tr>
            )}
            {membres.map((m, idx) => (
              <MembreRow key={idx} m={m} idx={idx} deptUsers={deptUsers} onUpdate={update} onRemove={remove} onMemberAdd={onMemberAdd} />
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" onClick={add}
        className="mt-2 border border-gray-300 text-sm px-3 py-1.5 rounded hover:bg-gray-50 flex items-center gap-1 text-gray-600">
        <span className="text-base leading-none">+</span> Ajouter un membre
      </button>
    </div>
  )
}

