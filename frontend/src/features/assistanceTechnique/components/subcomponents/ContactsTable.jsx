import { useState, useRef, useCallback } from 'react'
import { fetchUsersAutocomplete } from '../../api/assistanceTechniqueApi'

// ── Autocomplete input for Nom field ─────────────────────────────────────────
function NomAutocomplete({ value, onChange, onSelectUser, placeholder }) {
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const debounceRef = useRef(null)

  const handleInput = useCallback((e) => {
    const q = e.target.value
    onChange(q)
    clearTimeout(debounceRef.current)
    if (q.length < 2) { setSuggestions([]); setOpen(false); return }
    debounceRef.current = setTimeout(async () => {
      try {
        const users = await fetchUsersAutocomplete({ q })
        setSuggestions(users)
        setOpen(users.length > 0)
      } catch { setSuggestions([]); setOpen(false) }
    }, 300)
  }, [onChange])

  const select = (user) => {
    onSelectUser(user)
    setSuggestions([])
    setOpen(false)
  }

  return (
    <div className="relative">
      <input
        value={value}
        onChange={handleInput}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        className="border border-gray-200 rounded px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
      />
      {open && (
        <ul className="absolute z-50 left-0 right-0 top-full mt-0.5 bg-white border border-gray-200 rounded shadow-lg max-h-44 overflow-y-auto text-sm">
          {suggestions.map(u => (
            <li key={u.id}
              onMouseDown={() => select(u)}
              className="px-3 py-2 cursor-pointer hover:bg-blue-50 flex flex-col">
              <span className="font-medium">{u.first_name} {u.last_name}</span>
              <span className="text-xs text-gray-400">{u.email} · {u.phone_number}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ── ContactSection ────────────────────────────────────────────────────────────
function ContactSection({ title, partie, rows, onChange }) {
  const update = (idx, field, val) =>
    onChange(rows.map((r, i) => (i === idx ? { ...r, [field]: val } : r)))

  const selectUser = (idx, user) =>
    onChange(rows.map((r, i) => i === idx ? {
      ...r,
      nom: `${user.first_name} ${user.last_name}`,
      email: user.email,
      telephone: user.phone_number,
    } : r))

  const add    = () => onChange([...rows, { partie, nom: '', role: '', email: '', telephone: '' }])
  const remove = (idx) => onChange(rows.filter((_, i) => i !== idx))

  return (
    <div className="mb-4">
      <h4 className={`text-xs font-bold uppercase tracking-wider mb-2
        ${partie === 'telnet' ? 'text-blue-600' : 'text-purple-600'}`}>
        {title}
      </h4>
      <div className="overflow-x-auto rounded border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Nom *', 'Rôle', 'Email', 'Téléphone', ''].map(h => (
                <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-600 border-b">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={5} className="text-center text-gray-400 py-3 text-xs">Aucun contact</td></tr>
            )}
            {rows.map((r, idx) => (
              <tr key={idx} className="hover:bg-gray-50 border-b last:border-b-0">
                <td className="px-2 py-1.5 min-w-[160px]">
                  <NomAutocomplete
                    value={r.nom}
                    onChange={v => update(idx, 'nom', v)}
                    onSelectUser={user => selectUser(idx, user)}
                    placeholder="Nom *"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input value={r.role} onChange={e => update(idx, 'role', e.target.value)}
                    placeholder="Rôle"
                    className="border border-gray-200 rounded px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400" />
                </td>
                <td className="px-2 py-1.5">
                  <input value={r.email} type="email" onChange={e => update(idx, 'email', e.target.value)}
                    placeholder="email@exemple.com"
                    className="border border-gray-200 rounded px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400" />
                </td>
                <td className="px-2 py-1.5">
                  <input value={r.telephone} onChange={e => update(idx, 'telephone', e.target.value)}
                    placeholder="+216..."
                    className="border border-gray-200 rounded px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400" />
                </td>
                <td className="px-2 py-1.5 text-center">
                  <button type="button" onClick={() => remove(idx)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" onClick={add}
        className="mt-2 border border-gray-300 text-sm px-3 py-1.5 rounded hover:bg-gray-50 flex items-center gap-1 text-gray-600">
        <span className="text-base leading-none">+</span> Ajouter un contact {title.split(' ')[0].toLowerCase()}
      </button>
    </div>
  )
}

export default function ContactsTable({ contacts = [], onChange }) {
  const telnet = contacts.filter(c => c.partie === 'telnet')
  const client = contacts.filter(c => c.partie === 'client')

  const merge = (partie, updated) =>
    onChange([...contacts.filter(c => c.partie !== partie), ...updated])

  return (
    <div className="space-y-4">
      <ContactSection title="Contacts TELNET" partie="telnet" rows={telnet} onChange={v => merge('telnet', v)} />
      <ContactSection title="Contacts Client"  partie="client" rows={client} onChange={v => merge('client', v)} />
    </div>
  )
}

