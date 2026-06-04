import { useState, useRef } from 'react'
import { uploadATAttachment } from '../../api/assistanceTechniqueApi'

const FIXED_TYPES = [
  { value: 'technique', label: 'Réunion technique',  color: 'bg-blue-100 text-blue-800' },
  { value: 'pilotage',  label: 'Réunion de pilotage', color: 'bg-purple-100 text-purple-800' },
]

const INPUT = 'border border-gray-200 rounded px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400'

// ── Single member selector (select one responsable) ──────────────────────────
function MemberSelector({ value, projectMembers, onChange, placeholder = 'Choisir…' }) {
  if (!projectMembers?.length) {
    return (
      <input value={value || ''} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} className={INPUT} />
    )
  }
  return (
    <select value={value || ''} onChange={e => onChange(e.target.value)}
      className={INPUT + ' bg-white cursor-pointer'}>
      <option value="">{placeholder}</option>
      {projectMembers.map((m, i) => {
        const name = `${m.first_name} ${m.last_name}`.trim() || m.email
        return <option key={i} value={name}>{name} — {m.role}</option>
      })}
    </select>
  )
}

// ── Multi-participant selector (checkboxes) ───────────────────────────────────
function ParticipantsSelector({ participants, projectMembers, onToggle }) {
  const [open, setOpen] = useState(false)
  const selected = participants ? participants.split(',').map(s => s.trim()).filter(Boolean) : []

  if (!projectMembers?.length) {
    return (
      <input value={participants} onChange={e => onToggle(e.target.value)}
        placeholder="Noms des participants..."
        className={INPUT} />
    )
  }

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full text-left border border-gray-200 rounded px-2 py-1.5 text-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 flex items-center justify-between gap-1">
        <span className="truncate text-gray-700">
          {selected.length === 0
            ? <span className="text-gray-400">Sélectionner les participants…</span>
            : selected.join(', ')}
        </span>
        <span className="text-gray-400 shrink-0">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="absolute z-50 left-0 right-0 top-full mt-0.5 bg-white border border-gray-200 rounded shadow-lg max-h-52 overflow-y-auto text-sm">
          {projectMembers.map((m, i) => {
            const name = `${m.first_name} ${m.last_name}`.trim() || m.email
            const checked = selected.includes(name)
            return (
              <label key={i} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-blue-50">
                <input type="checkbox" checked={checked}
                  onChange={() => {
                    const next = checked
                      ? selected.filter(n => n !== name)
                      : [...selected, name]
                    onToggle(next.join(', '))
                  }}
                  className="accent-blue-600" />
                <div className="flex flex-col">
                  <span className="font-medium">{name}</span>
                  <span className="text-xs text-gray-400">{m.role}</span>
                </div>
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── File upload cell for élément de sortie ────────────────────────────────────
function ElementSortieCell({ value, atId, onUpdate }) {
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  const isUrl = value && (value.startsWith('http://') || value.startsWith('https://'))

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !atId) return
    setUploading(true)
    try {
      const result = await uploadATAttachment(atId, file)
      onUpdate(result.url)
    } catch {
      alert('Erreur lors du téléversement du fichier.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-1">
      {isUrl ? (
        <div className="flex items-center gap-1">
          <a href={value} target="_blank" rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline truncate max-w-[120px]"
            title={value}>
            📎 {decodeURIComponent(value.split('/').pop())}
          </a>
          <button type="button" onClick={() => onUpdate('')}
            className="text-red-400 hover:text-red-600 text-xs shrink-0" title="Supprimer">✕</button>
        </div>
      ) : (
        <input value={value || ''} onChange={e => onUpdate(e.target.value)}
          placeholder="Nom du document…" className={INPUT} />
      )}
      <div className="flex items-center gap-1">
        <button type="button" onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded hover:bg-blue-100 disabled:opacity-50 whitespace-nowrap">
          {uploading ? '⏳' : '📂'} {uploading ? 'Envoi…' : 'Importer fichier'}
        </button>
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFile} />
      </div>
    </div>
  )
}

const EMPTY_ROW = { type_reunion: '', objectif: '', frequence: '', date_prevue: '', responsable: '', participants: '', element_sortie: '' }

export default function CommunicationPlanTable({ plan = [], onChange, projectMembers = [], atId }) {
  const ensureRows = (data) => {
    const result = [...data]
    FIXED_TYPES.forEach(t => {
      if (!result.find(r => r.type_reunion === t.value)) {
        result.push({ ...EMPTY_ROW, type_reunion: t.value })
      }
    })
    return result
  }

  const rows = ensureRows(plan)

  const update = (type, field, val) => {
    const next = rows.map(r => r.type_reunion === type ? { ...r, [field]: val } : r)
    onChange(next)
  }

  return (
    <div className="overflow-x-auto rounded border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {['Type de réunion', 'Objectif', 'Fréquence', 'Date prévue', 'Responsable', 'Participants', 'Élément de sortie'].map(h => (
              <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-600 border-b">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {FIXED_TYPES.map(t => {
            const row = rows.find(r => r.type_reunion === t.value) || { ...EMPTY_ROW, type_reunion: t.value }
            return (
              <tr key={t.value} className="hover:bg-gray-50 border-b last:border-b-0 align-top">
                <td className="px-3 py-2 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${t.color}`}>
                    {t.label}
                  </span>
                </td>
                <td className="px-2 py-1.5 min-w-[130px]">
                  <input value={row.objectif} onChange={e => update(t.value, 'objectif', e.target.value)}
                    placeholder="Objectif…" className={INPUT} />
                </td>
                <td className="px-2 py-1.5 min-w-[90px]">
                  <input value={row.frequence} onChange={e => update(t.value, 'frequence', e.target.value)}
                    placeholder="ex: Hebdo" className={INPUT} />
                </td>
                <td className="px-2 py-1.5 min-w-[130px]">
                  <input type="date" value={row.date_prevue || ''} onChange={e => update(t.value, 'date_prevue', e.target.value)}
                    className={INPUT} />
                </td>
                <td className="px-2 py-1.5 min-w-[160px]">
                  <MemberSelector
                    value={row.responsable}
                    projectMembers={projectMembers}
                    onChange={val => update(t.value, 'responsable', val)}
                    placeholder="Choisir responsable…"
                  />
                </td>
                <td className="px-2 py-1.5 min-w-[190px]">
                  <ParticipantsSelector
                    participants={row.participants}
                    projectMembers={projectMembers}
                    onToggle={val => update(t.value, 'participants', val)}
                  />
                </td>
                <td className="px-2 py-1.5 min-w-[160px]">
                  <ElementSortieCell
                    value={row.element_sortie}
                    atId={atId}
                    onUpdate={val => update(t.value, 'element_sortie', val)}
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

