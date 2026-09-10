import { useState, useEffect, useCallback, useRef } from 'react'
import ATWorkflowStepper from '../ATWorkflowStepper'
import { fetchCurrentUser, uploadATAttachment, fetchDeptUsers } from '../../api/assistanceTechniqueApi'
import { exportPVLiberationPDF } from '../../utils/atPdfExport'

// ── Shared styles ─────────────────────────────────────────────────────────────
const INPUT    = 'border border-gray-200 rounded px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400'
const TEXTAREA = 'border border-gray-200 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none'
const BTN_ADD  = 'mt-2 border border-dashed border-gray-300 text-sm px-3 py-1.5 rounded hover:bg-gray-50 flex items-center gap-1 text-gray-500'

// ── Shared Section wrapper ────────────────────────────────────────────────────
function Section({ title, children, accent = 'blue' }) {
  const colors = {
    blue:   'border-l-4 border-blue-400 bg-white',
    green:  'border-l-4 border-green-400 bg-white',
    purple: 'border-l-4 border-purple-400 bg-white',
    amber:  'border-l-4 border-amber-400 bg-white',
  }
  return (
    <div className={`rounded-lg shadow-sm p-5 border border-gray-100 ${colors[accent] || colors.blue}`}>
      <h3 className="text-sm font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">{title}</h3>
      {children}
    </div>
  )
}

// ── Member selector ───────────────────────────────────────────────────────────
function MemberSelect({ value, members, onChange, placeholder = '— Choisir —' }) {
  if (!members?.length) return (
    <input value={value || ''} onChange={e => onChange(e.target.value)} className={INPUT} placeholder={placeholder} />
  )
  return (
    <select value={value || ''} onChange={e => onChange(e.target.value)} className={INPUT + ' bg-white cursor-pointer'}>
      <option value="">{placeholder}</option>
      {members.map((m, i) => {
        const name = `${m.first_name} ${m.last_name}`.trim() || m.email
        return <option key={i} value={name}>{name} — {m.role}</option>
      })}
    </select>
  )
}

// ── Generic JSON table ────────────────────────────────────────────────────────
function JsonTable({ rows = [], columns, onAdd, onUpdate, onRemove, emptyMsg = 'Aucune entrée' }) {
  return (
    <div>
      <div className="overflow-x-auto rounded border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500 border-b w-7">#</th>
              {columns.map(c => (
                <th key={c.key} className="px-2 py-2 text-left text-xs font-semibold text-gray-500 border-b">{c.label}</th>
              ))}
              <th className="px-2 py-2 border-b w-7"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={columns.length + 2} className="text-center text-gray-400 py-4 text-xs">{emptyMsg}</td></tr>
            )}
            {rows.map((row, idx) => (
              <tr key={idx} className="border-b last:border-b-0 hover:bg-gray-50 align-top">
                <td className="px-2 py-1.5 text-gray-400 text-xs font-medium">{idx + 1}</td>
                {columns.map(c => (
                  <td key={c.key} className="px-1 py-1.5" style={{ minWidth: c.width || 120 }}>
                    {c.type === 'select' ? (
                      <select value={row[c.key] || ''} onChange={e => onUpdate(idx, c.key, e.target.value)}
                        className={INPUT + ' bg-white'}>
                        <option value="">—</option>
                        {c.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    ) : c.type === 'date' ? (
                      <input type="date" value={row[c.key] || ''} onChange={e => onUpdate(idx, c.key, e.target.value)} className={INPUT} />
                    ) : c.type === 'textarea' ? (
                      <textarea value={row[c.key] || ''} onChange={e => onUpdate(idx, c.key, e.target.value)}
                        rows={2} placeholder={c.placeholder || ''} className={INPUT + ' resize-none'} />
                    ) : c.type === 'member' ? (
                      <MemberSelect value={row[c.key]} members={c.members} onChange={v => onUpdate(idx, c.key, v)} placeholder={c.placeholder} />
                    ) : c.type === 'render' ? (
                      c.render(row[c.key], v => onUpdate(idx, c.key, v), row, idx)
                    ) : c.type === 'readonly' ? (
                      <span className="inline-block px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-xs font-mono font-semibold">
                        {row[c.key] || '—'}
                      </span>
                    ) : (
                      <input value={row[c.key] || ''} onChange={e => onUpdate(idx, c.key, e.target.value)}
                        placeholder={c.placeholder || ''} className={INPUT} />
                    )}
                  </td>
                ))}
                <td className="px-1 py-1.5 text-center">
                  <button type="button" onClick={() => onRemove(idx)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" onClick={onAdd} className={BTN_ADD}>
        <span className="text-base leading-none">+</span> Ajouter une ligne
      </button>
    </div>
  )
}

// ── Checkbox cell for skills matrix ──────────────────────────────────────────
function CheckCell({ checked, onChange }) {
  return (
    <td className="px-2 py-1.5 text-center border-l border-gray-100">
      <input type="checkbox" checked={!!checked} onChange={e => onChange(e.target.checked)}
        className="w-4 h-4 accent-blue-500 cursor-pointer" />
    </td>
  )
}

// ── File upload cell (org chart, lifecycle, livrables) ────────────────────────
function FileUploadCell({ atId, value, onChange, label = '📂 Importer fichier' }) {
  const fileRef   = useRef(null)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !atId) return
    setUploading(true)
    try {
      const data = await uploadATAttachment(atId, file)
      onChange(data.url)
    } catch (err) {
      console.error('Upload failed', err)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  if (value) {
    const fileName = value.split('/').pop()
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <a href={value} target="_blank" rel="noopener noreferrer"
          className="text-blue-600 hover:underline text-xs truncate max-w-[200px]">
          📎 {fileName}
        </a>
        <button type="button" onClick={() => onChange('')} className="text-red-400 hover:text-red-600 text-xs">✕</button>
      </div>
    )
  }
  return (
    <>
      <input type="file" ref={fileRef} className="hidden" onChange={handleUpload} />
      <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
        className="text-xs px-3 py-1.5 border border-dashed border-blue-300 text-blue-600 rounded hover:bg-blue-50 whitespace-nowrap transition-colors">
        {uploading ? '⏳ Upload…' : label}
      </button>
    </>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 1 — Plan de Qualité
// ══════════════════════════════════════════════════════════════════════════════
function PlanQualite({ form, onChange, members, deptUsers = [], atId }) {
  // Only users with role 'validateur' from the department
  const validatorsOnly = deptUsers.filter(u => u.role === 'validateur')
  const tbl = (field, emptyRow) => ({
    add:    () => onChange(field, [...(form[field] || []), { ...emptyRow }]),
    update: (i, k, v) => onChange(field, (form[field] || []).map((r, idx) => idx === i ? { ...r, [k]: v } : r)),
    remove: (i) => onChange(field, (form[field] || []).filter((_, idx) => idx !== i)),
  })

  const orgcli = tbl('pq_org_client',       { role: '', nom_complet: '', email: '', telephone: '' })
  const equip  = tbl('pq_membres_equipe_pq', { role: '', nom: '', responsabilites: '' })
  const valid  = tbl('pq_equipe_validation', { role: 'Validateur', nom: '' })
  const fmts   = tbl('pq_formations',        { formation: '', stagiaires: '', formateur: '', date_prevue: '', type_formation: '' })
  const comms  = tbl('pq_communication_pq',  { sujet: '', parties_prenantes: '', moyen: '' })
  const reuns  = tbl('pq_reunions_pq',       { type_reunion: '', objectif: '', resultats: '', pilote: '', participants: '', frequence: '', date_prevue: '' })
  const phases = tbl('pq_phases',            { phase: '', entrees_client: '', sorties_telnet: '', document_url: '' })
  const mats   = tbl('pq_materiels',         { nom: '', usage: '', date_reception: '' })
  const outs   = tbl('pq_outils',            { nom: '', version: '', usage: '', date_acquisition: '', proprietaire: '' })
  const devs   = tbl('pq_env_dev',           { nom_logiciel: '', version: '', usage: '' })
  const tsts   = tbl('pq_env_test',          { nom_logiciel: '', version: '', usage: '' })
  const incs = {
    add:    () => {
      const current = form.pq_incidents_secu || []
      const nextId  = `INC-${String(current.length + 1).padStart(2, '0')}`
      onChange('pq_incidents_secu', [...current, { ref_evenement: nextId, evenement: '', description: '', nature: '', date: '', statut_changement: '', risques: '', commentaires: '' }])
    },
    update: (i, k, v) => onChange('pq_incidents_secu', (form.pq_incidents_secu || []).map((r, idx) => idx === i ? { ...r, [k]: v } : r)),
    remove: (i) => onChange('pq_incidents_secu', (form.pq_incidents_secu || []).filter((_, idx) => idx !== i)),
  }

  // Skills matrix rows — columns are now the actual members of the team (section 4a),
  // not fixed generic roles. Each row stores which team members have that competence.
  const equipeMembres = (form.pq_membres_equipe_pq || []).filter(m => (m.nom || '').trim() !== '')
  const skillRows = form.pq_competences || []
  const updateSkill = (i, k, v) => onChange('pq_competences', skillRows.map((r, idx) => idx === i ? { ...r, [k]: v } : r))
  const toggleSkillMembre = (i, nomMembre, v) => onChange('pq_competences', skillRows.map((r, idx) => {
    if (idx !== i) return r
    const membres = { ...(r.membres || {}) }
    if (v) membres[nomMembre] = true
    else delete membres[nomMembre]
    return { ...r, membres }
  }))
  const addSkill    = () => onChange('pq_competences', [...skillRows, { competence: '', membres: {} }])
  const removeSkill = (i) => onChange('pq_competences', skillRows.filter((_, idx) => idx !== i))

  // Jalons (editable but fixed M0-M4 ids)
  const jalonRows = form.pq_jalons || []
  const updateJalon = (i, k, v) => onChange('pq_jalons', jalonRows.map((r, idx) => idx === i ? { ...r, [k]: v } : r))

  return (
    <div className="space-y-5">

      {/* 1. Informations générales */}
      <Section title="1. Informations générales" accent="blue">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Version</label>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1.5 rounded text-sm font-semibold border ${form.pq_version_num > 0 ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>
                {form.pq_version_num > 0 ? `v${form.pq_version_num}.0` : 'Non sauvegardé'}
              </span>
              <span className="text-xs text-gray-400">auto</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
            <input type="date" value={form.pq_date || ''} onChange={e => onChange('pq_date', e.target.value)} className={INPUT} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Auteur <span className="text-blue-500">👤 connecté</span></label>
            <input value={form.pq_auteur || ''} onChange={e => onChange('pq_auteur', e.target.value)} className={INPUT} placeholder="Chargement…" />
          </div>
        </div>
        <div className="mt-3">
          <label className="block text-xs font-medium text-gray-600 mb-1">Objectif du PQ</label>
          <textarea value={form.pq_objectif || ''} onChange={e => onChange('pq_objectif', e.target.value)} rows={2} className={TEXTAREA} placeholder="Objectif du plan de qualité…" />
        </div>
      </Section>

      {/* 2. Présentation du projet */}
      <Section title="2. Présentation du projet" accent="green">
        <textarea value={form.pq_presentation_projet || ''} onChange={e => onChange('pq_presentation_projet', e.target.value)}
          rows={4} className={TEXTAREA} placeholder="Décrire le contexte et les objectifs du projet…" />
      </Section>

      {/* 3. Organisation Client */}
      <Section title="3. Organisation Client" accent="purple">
        <div className="mb-4 flex items-center gap-3">
          <span className="text-xs font-medium text-gray-600">Organigramme client :</span>
          <FileUploadCell atId={atId} value={form.pq_org_chart_url} onChange={v => onChange('pq_org_chart_url', v)} label="📂 Importer l'organigramme" />
        </div>
        <JsonTable rows={form.pq_org_client || []} emptyMsg="Aucun contact client — cliquez sur + Ajouter"
          columns={[
            { key: 'role',        label: 'Rôle',          placeholder: 'ex: Chef de projet', width: 160 },
            { key: 'nom_complet', label: 'Nom complet',   placeholder: 'Prénom Nom',          width: 170 },
            { key: 'email',       label: 'Email',         placeholder: 'email@client.com',    width: 180 },
            { key: 'telephone',   label: 'Téléphone',     placeholder: '+216…',               width: 130 },
          ]}
          onAdd={orgcli.add} onUpdate={orgcli.update} onRemove={orgcli.remove}
        />
      </Section>

      {/* 4. Équipe projet + Équipe validation */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Section title="4a. Membres de l'équipe projet" accent="blue">
          <JsonTable rows={form.pq_membres_equipe_pq || []} emptyMsg="Aucun membre"
            columns={[
              { key: 'role',            label: 'Rôle',            placeholder: 'ex: Tech Lead', width: 130 },
              { key: 'nom',             label: 'Nom complet',     type: 'member', members: deptUsers.length ? deptUsers : members, placeholder: '— Choisir —', width: 160 },
              { key: 'responsabilites', label: 'Responsabilités', placeholder: 'Tâches…',       width: 180 },
            ]}
            onAdd={equip.add} onUpdate={equip.update} onRemove={equip.remove}
          />
        </Section>
        <Section title="4b. Équipe de validation" accent="green">
          <JsonTable rows={form.pq_equipe_validation || []} emptyMsg="Aucun validateur"
            columns={[
              { key: 'role', label: 'Rôle', type: 'readonly', width: 150 },
              { key: 'nom',  label: 'Nom complet', type: 'member', members: validatorsOnly.length ? validatorsOnly : members.filter(m => m.role === 'validateur'), placeholder: '— Choisir —', width: 170 },
            ]}
            onAdd={valid.add} onUpdate={valid.update} onRemove={valid.remove}
          />
        </Section>
      </div>

      {/* 5. Compétences requises */}
      <Section title="5. Compétences requises" accent="purple">
        {equipeMembres.length === 0 && (
          <p className="text-xs text-amber-600 mb-2">
            ⚠️ Ajoutez d'abord les membres de l'équipe dans la section « 4a. Membres de l'équipe projet » pour pouvoir leur assigner des compétences.
          </p>
        )}
        <div className="overflow-x-auto rounded border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 border-b">Compétence</th>
                {equipeMembres.map((m, i) => (
                  <th key={`${m.nom}-${i}`} className="px-3 py-2 text-center text-xs font-semibold text-gray-500 border-b border-l border-gray-100 w-20">
                    <div>{m.nom}</div>
                    {m.role && <div className="text-[10px] font-normal text-gray-400">{m.role}</div>}
                  </th>
                ))}
                <th className="w-7 border-b"></th>
              </tr>
            </thead>
            <tbody>
              {skillRows.length === 0 && (
                <tr><td colSpan={equipeMembres.length + 2} className="text-center text-gray-400 py-4 text-xs">Aucune compétence — cliquez sur + Ajouter</td></tr>
              )}
              {skillRows.map((row, i) => (
                <tr key={i} className="border-b last:border-b-0 hover:bg-gray-50">
                  <td className="px-2 py-1.5">
                    <input value={row.competence || ''} onChange={e => updateSkill(i, 'competence', e.target.value)}
                      placeholder="ex: Python, React…" className={INPUT} />
                  </td>
                  {equipeMembres.map((m, mi) => (
                    <CheckCell key={`${m.nom}-${mi}`} checked={row.membres?.[m.nom]} onChange={v => toggleSkillMembre(i, m.nom, v)} />
                  ))}
                  <td className="px-1 py-1.5 text-center">
                    <button type="button" onClick={() => removeSkill(i)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button type="button" onClick={addSkill} className={BTN_ADD}>
          <span className="text-base leading-none">+</span> Ajouter une compétence
        </button>
      </Section>

      {/* 6. Formations planifiées */}
      <Section title="6. Formations planifiées" accent="amber">
        <JsonTable rows={form.pq_formations || []} emptyMsg="Aucune formation — cliquez sur + Ajouter"
          columns={[
            { key: 'formation',      label: 'Formation',    placeholder: 'Nom de la formation', width: 160 },
            { key: 'stagiaires',     label: 'Stagiaires',   placeholder: 'Noms des stagiaires',  width: 150 },
            { key: 'formateur',      label: 'Formateur',    placeholder: 'Nom du formateur',     width: 130 },
            { key: 'date_prevue',    label: 'Date prévue',  type: 'date',  width: 120 },
            { key: 'type_formation', label: 'Type',         placeholder: 'interne / externe',    width: 110 },
          ]}
          onAdd={fmts.add} onUpdate={fmts.update} onRemove={fmts.remove}
        />
      </Section>

      {/* 7. Planning */}
      <Section title="7. Planning" accent="blue">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-gray-600">Planning de la prestation :</span>
          <FileUploadCell atId={atId} value={form.pq_planning} onChange={v => onChange('pq_planning', v)} label="📂 Importer le planning" />
        </div>
      </Section>

      {/* 8. Communication */}
      <Section title="8. Communication" accent="green">
        <JsonTable rows={form.pq_communication_pq || []} emptyMsg="Aucun élément de communication"
          columns={[
            { key: 'sujet',             label: 'Sujet',               placeholder: 'Sujet de communication…', width: 200 },
            { key: 'parties_prenantes', label: 'Parties prenantes',   placeholder: 'Destinataires…',          width: 180 },
            { key: 'moyen',             label: 'Moyen de communication', placeholder: 'ex: Email, Réunion…', width: 160 },
          ]}
          onAdd={comms.add} onUpdate={comms.update} onRemove={comms.remove}
        />
      </Section>

      {/* 9. Réunions */}
      <Section title="9. Réunions" accent="purple">
        <JsonTable rows={form.pq_reunions_pq || []} emptyMsg="Aucune réunion définie"
          columns={[
            { key: 'type_reunion', label: 'Type',           placeholder: 'ex: Pilotage / Technique', width: 140 },
            { key: 'objectif',     label: 'Objectif',       placeholder: 'Objectif…',                width: 160 },
            { key: 'resultats',    label: 'Résultats att.', placeholder: 'Résultats attendus…',       width: 150 },
            { key: 'pilote',       label: 'Responsable',    type: 'member', members: deptUsers.length ? deptUsers : members, placeholder: '— Choisir —', width: 150 },
            { key: 'participants', label: 'Participants',   placeholder: 'Noms / rôles…',            width: 160 },
            { key: 'frequence',    label: 'Fréquence',      placeholder: 'ex: Mensuel…',             width: 110 },
            { key: 'date_prevue',  label: 'Date prévue',    type: 'date',                            width: 130 },
          ]}
          onAdd={reuns.add} onUpdate={reuns.update} onRemove={reuns.remove}
        />
      </Section>

      {/* 10. Cycle de vie du projet */}
      <Section title="10. Cycle de vie du projet" accent="amber">
        <textarea value={form.pq_cycle_vie || ''} onChange={e => onChange('pq_cycle_vie', e.target.value)}
          rows={4} className={TEXTAREA} placeholder="Décrire le cycle de vie adopté (Agile, V-Model, etc.)…" />
        <div className="mt-3 flex items-center gap-3">
          <span className="text-xs font-medium text-gray-600">Diagramme (fichier) :</span>
          <FileUploadCell atId={atId} value={form.pq_cycle_vie_file} onChange={v => onChange('pq_cycle_vie_file', v)} label="📂 Importer un diagramme" />
        </div>
      </Section>

      {/* 11. Phases du projet */}
      <Section title="11. Phases du projet" accent="blue">
        <JsonTable rows={form.pq_phases || []} emptyMsg="Aucune phase — cliquez sur + Ajouter"
          columns={[
            { key: 'phase',          label: 'Phase',                       placeholder: 'ex: Analyse, Dev…', width: 160 },
            { key: 'entrees_client', label: 'Livrables entrants (Client)',  placeholder: 'CDC, specs…',       width: 200 },
            { key: 'sorties_telnet', label: 'Livrables sortants (Telnet)',  placeholder: 'Rapport, code…',    width: 200 },
            {
              key: 'document_url', label: 'Document', type: 'render', width: 160,
              render: (value, onChangeFn) => (
                <FileUploadCell atId={atId} value={value} onChange={onChangeFn} label="📎 Joindre" />
              ),
            },
          ]}
          onAdd={phases.add} onUpdate={phases.update} onRemove={phases.remove}
        />
      </Section>

      {/* 12. Critères d'acceptation */}
      <Section title="12. Critères d'acceptation" accent="green">
        <textarea value={form.pq_criteres_acceptation || ''} onChange={e => onChange('pq_criteres_acceptation', e.target.value)}
          rows={4} className={TEXTAREA} placeholder="Définir les critères de recette / acceptation des livrables…" />
      </Section>

      {/* 13. Jalons */}
      <Section title="13. Jalons (Milestones)" accent="purple">
        <div className="overflow-x-auto rounded border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 border-b w-16">Jalon</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 border-b">Description</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 border-b w-40">Référence interne</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 border-b w-32">Statut</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 border-b w-36">Date prévue</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 border-b w-36">Date réelle</th>
              </tr>
            </thead>
            <tbody>
              {jalonRows.map((row, i) => (
                <tr key={i} className="border-b last:border-b-0 hover:bg-gray-50">
                  <td className="px-3 py-1.5 font-semibold text-blue-700">{row.id_jalon}</td>
                  <td className="px-2 py-1.5">
                    <input value={row.description || ''} onChange={e => updateJalon(i, 'description', e.target.value)}
                      placeholder="Description du jalon…" className={INPUT} />
                  </td>
                  <td className="px-2 py-1.5">
                    <input value={row.reference_interne || ''} onChange={e => updateJalon(i, 'reference_interne', e.target.value)}
                      placeholder="Référence…" className={INPUT} />
                  </td>
                  <td className="px-2 py-1.5">
                    <select value={row.statut || 'prevu'} onChange={e => updateJalon(i, 'statut', e.target.value)}
                      className={INPUT}>
                      <option value="prevu">Prévu</option>
                      <option value="realise">Réalisé</option>
                    </select>
                  </td>
                  <td className="px-2 py-1.5">
                    <input type="date" value={row.date_prevue || ''} onChange={e => updateJalon(i, 'date_prevue', e.target.value)}
                      className={INPUT} />
                  </td>
                  <td className="px-2 py-1.5">
                    <input type="date" value={row.date_reelle || ''} onChange={e => updateJalon(i, 'date_reelle', e.target.value)}
                      disabled={row.statut !== 'realise'} className={INPUT} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* 14. Matériel */}
      <Section title="14. Matériel" accent="amber">
        <JsonTable rows={form.pq_materiels || []} emptyMsg="Aucun matériel — cliquez sur + Ajouter"
          columns={[
            { key: 'nom',            label: 'Nom matériel',   placeholder: 'Nom…',   width: 180 },
            { key: 'usage',          label: 'Usage',          placeholder: 'Usage…', width: 200 },
            { key: 'date_reception', label: 'Date réception', type: 'date',          width: 130 },
          ]}
          onAdd={mats.add} onUpdate={mats.update} onRemove={mats.remove}
        />
      </Section>

      {/* 15. Outils Software */}
      <Section title="15. Outils Software" accent="blue">
        <JsonTable rows={form.pq_outils || []} emptyMsg="Aucun outil — cliquez sur + Ajouter"
          columns={[
            { key: 'nom',              label: 'Outil',            placeholder: "Nom de l'outil", width: 150 },
            { key: 'version',          label: 'Version',          placeholder: 'ex: 3.2.1',      width: 100 },
            { key: 'usage',            label: 'Usage',            placeholder: 'Usage…',         width: 180 },
            { key: 'date_acquisition', label: 'Date acquisition', type: 'date',                  width: 130 },
            { key: 'proprietaire',     label: 'Propriétaire',     type: 'select', width: 110,
              options: [{ value: 'telnet', label: 'Telnet' }, { value: 'client', label: 'Client' }] },
          ]}
          onAdd={outs.add} onUpdate={outs.update} onRemove={outs.remove}
        />
      </Section>

      {/* 16-17. Environnements */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Section title="16. Environnement de développement" accent="green">
          <JsonTable rows={form.pq_env_dev || []} emptyMsg="Aucun logiciel"
            columns={[
              { key: 'nom_logiciel', label: 'Logiciel', placeholder: 'Nom…',    width: 140 },
              { key: 'version',      label: 'Version',  placeholder: 'ex: 2.x', width: 90 },
              { key: 'usage',        label: 'Usage',    placeholder: 'Usage…',  width: 130 },
            ]}
            onAdd={devs.add} onUpdate={devs.update} onRemove={devs.remove}
          />
        </Section>
        <Section title="17. Environnement de test" accent="purple">
          <JsonTable rows={form.pq_env_test || []} emptyMsg="Aucun logiciel"
            columns={[
              { key: 'nom_logiciel', label: 'Logiciel', placeholder: 'Nom…',    width: 140 },
              { key: 'version',      label: 'Version',  placeholder: 'ex: 2.x', width: 90 },
              { key: 'usage',        label: 'Usage',    placeholder: 'Usage…',  width: 130 },
            ]}
            onAdd={tsts.add} onUpdate={tsts.update} onRemove={tsts.remove}
          />
        </Section>
      </div>

      {/* 18-19. Garantie + Support */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Section title="18. Garantie" accent="amber">
          <label className="flex items-center gap-2 cursor-pointer mb-3">
            <input type="checkbox" checked={!!form.pq_has_garantie} onChange={e => onChange('pq_has_garantie', e.target.checked)}
              className="w-4 h-4 accent-amber-500 cursor-pointer" />
            <span className="text-sm font-medium text-gray-700">Garantie applicable</span>
          </label>
          {form.pq_has_garantie && (
            <textarea value={form.pq_garantie || ''} onChange={e => onChange('pq_garantie', e.target.value)}
              rows={4} className={TEXTAREA} placeholder="Conditions de garantie, durée, périmètre couvert…" />
          )}
        </Section>
        <Section title="19. Support et maintenance" accent="blue">
          <label className="flex items-center gap-2 cursor-pointer mb-3">
            <input type="checkbox" checked={!!form.pq_has_maintenance} onChange={e => onChange('pq_has_maintenance', e.target.checked)}
              className="w-4 h-4 accent-blue-500 cursor-pointer" />
            <span className="text-sm font-medium text-gray-700">Support de maintenance applicable</span>
          </label>
          {form.pq_has_maintenance && (
            <textarea value={form.pq_support_maintenance || ''} onChange={e => onChange('pq_support_maintenance', e.target.value)}
              rows={4} className={TEXTAREA} placeholder="Modalités de support, SLA, contact support…" />
          )}
        </Section>
      </div>

      {/* 20. Incidences de sécurité */}
      <Section title="20. Gestion des incidences sécurité" accent="amber">
        <JsonTable rows={form.pq_incidents_secu || []} emptyMsg="Aucune incidence sécurité enregistrée"
          columns={[
            { key: 'evenement',         label: 'Événement',         placeholder: 'Titre…',            width: 130 },
            { key: 'description',       label: 'Description',       type: 'textarea',                  width: 170 },
            { key: 'nature',            label: 'Nature',            placeholder: 'ex: Incident…',      width: 110 },
            { key: 'date',              label: 'Date',              type: 'date',                      width: 110 },
            { key: 'ref_evenement',     label: 'Réf. événement',    type: 'readonly',                  width: 120 },
            { key: 'statut_changement', label: 'Statut changement', placeholder: 'ex: Ouvert…',        width: 130 },
            { key: 'risques',           label: 'Risques',           placeholder: 'Risques associés…',  width: 140 },
            { key: 'commentaires',      label: 'Commentaires',      type: 'textarea',                  width: 160 },
          ]}
          onAdd={incs.add} onUpdate={incs.update} onRemove={incs.remove}
        />
      </Section>
    </div>
  )
}




// ══════════════════════════════════════════════════════════════════════════════
// TAB 2 — Plan de Configuration
// ══════════════════════════════════════════════════════════════════════════════
const BRANCHES_QUESTIONS = [
  { key: 'q1', label: 'Pour quels composants / applications un développement parallèle est-il applicable ?' },
  { key: 'q2', label: 'Quand une nouvelle branche est-elle créée ?' },
  { key: 'q3', label: 'Comment identifier la base source pour les branches ?' },
  { key: 'q4', label: 'Comment les différentes branches sont-elles fusionnées ?' },
  { key: 'q5', label: 'Comment les activités de fusion sont-elles contrôlées ?' },
  { key: 'q6', label: 'Qui est responsable de l\'identification, de la création et de la fusion des branches ?' },
  { key: 'q7', label: 'Quelle est la logique de nommage des branches ?' },
  { key: 'q8', label: 'Quelle est la logique de versioning des éléments de configuration dans les différentes branches ?' },
]

function PlanConfiguration({ form, onChange, members, deptUsers = [], atId }) {
  const effectiveMembers = deptUsers.length ? deptUsers : members
  const tbl = (field, emptyRow) => ({
    add:    () => onChange(field, [...(form[field] || []), emptyRow]),
    update: (i, k, v) => onChange(field, (form[field] || []).map((r, idx) => idx === i ? { ...r, [k]: v } : r)),
    remove: (i) => onChange(field, (form[field] || []).filter((_, idx) => idx !== i)),
  })
  const items    = tbl('pc_items_config',        { item: '', responsable: '', evenement: '', date: '', localisation: '' })
  const baselines = {
    add:    () => {
      const current = form.pc_baselines || []
      const nextId  = `BL-${String(current.length + 1).padStart(2, '0')}`
      onChange('pc_baselines', [...current, { id_baseline: nextId, contenu: '', date: '' }])
    },
    update: (i, k, v) => onChange('pc_baselines', (form.pc_baselines || []).map((r, idx) => idx === i ? { ...r, [k]: v } : r)),
    remove: (i) => onChange('pc_baselines', (form.pc_baselines || []).filter((_, idx) => idx !== i)),
  }
  const audits   = tbl('pc_audits',              { date_audit: '', auditeur: '', constats: '', actions: '' })
  const versDocs = tbl('pc_versioning_docs_items', { version: '', description: '', document_url: '' })
  const versSrc  = tbl('pc_versioning_src_items',  { version: '', description: '', document_url: '' })

  const qa    = form.pc_branches_qa || {}
  const setQa = (key, val) => onChange('pc_branches_qa', { ...qa, [key]: val })

  return (
    <div className="space-y-5">

      {/* Outils & Formations CM */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Section title="Outils de gestion de configuration" accent="blue">
          <textarea value={form.pc_outils_cm || ''} onChange={e => onChange('pc_outils_cm', e.target.value)}
            rows={4} className={TEXTAREA} placeholder="Décrire les outils CM utilisés (ex: Git, SVN, Nexus)…" />
        </Section>
        <Section title="Formations CM" accent="green">
          <textarea value={form.pc_formations_cm || ''} onChange={e => onChange('pc_formations_cm', e.target.value)}
            rows={4} className={TEXTAREA} placeholder="Formations sur la gestion de configuration prévues…" />
        </Section>
      </div>

      {/* Éléments de configuration */}
      <Section title="Éléments de configuration" accent="blue">
        <JsonTable rows={form.pc_items_config || []} emptyMsg="Aucun élément de configuration"
          columns={[
            { key: 'item',         label: 'Élément',      placeholder: "Nom de l'élément", width: 160 },
            { key: 'responsable',  label: 'Responsable',  type: 'member', members: effectiveMembers, placeholder: '— Choisir —', width: 160 },
            { key: 'evenement',    label: 'Événement',    placeholder: 'ex: commit, release…', width: 130 },
            { key: 'date',         label: 'Date',         type: 'date', width: 110 },
            { key: 'localisation', label: 'Localisation', placeholder: 'Dépôt / chemin…', width: 150 },
          ]}
          onAdd={items.add} onUpdate={items.update} onRemove={items.remove}
        />
      </Section>

      {/* Politiques de configuration */}
      <Section title="Politiques de configuration" accent="purple">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-gray-600">Document de politique de configuration :</span>
          <FileUploadCell atId={atId} value={form.pc_politiques} onChange={v => onChange('pc_politiques', v)} label="📂 Importer la politique de configuration" />
        </div>
      </Section>

      {/* Gestion des branches — explication + Q&R */}
      <Section title="Gestion des branches" accent="amber">
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-600 mb-1">Explication générale</label>
          <textarea value={form.pc_gestion_branches || ''} onChange={e => onChange('pc_gestion_branches', e.target.value)}
            rows={3} className={TEXTAREA} placeholder="Stratégie de branches (main, develop, feature, release)…" />
        </div>
        <div className="space-y-3">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Questions à répondre</p>
          {BRANCHES_QUESTIONS.map(({ key, label }) => (
            <div key={key} className="bg-amber-50 border border-amber-100 rounded-lg p-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <span className="inline-block bg-amber-200 text-amber-800 rounded-full px-2 py-0.5 text-[10px] font-bold mr-2">
                  {key.toUpperCase()}
                </span>
                {label}
              </label>
              <textarea
                value={qa[key] || ''}
                onChange={e => setQa(key, e.target.value)}
                rows={2}
                className={TEXTAREA}
                placeholder="Votre réponse…"
              />
            </div>
          ))}
        </div>
      </Section>

      {/* Baselines */}
      <Section title="Baselines" accent="green">
        <JsonTable rows={form.pc_baselines || []} emptyMsg="Aucune baseline définie"
          columns={[
            { key: 'id_baseline', label: 'ID Baseline', type: 'readonly', width: 110 },
            { key: 'contenu',     label: 'Contenu',     placeholder: 'Éléments inclus…', width: 220 },
            { key: 'date',        label: 'Date',        type: 'date', width: 110 },
          ]}
          onAdd={baselines.add} onUpdate={baselines.update} onRemove={baselines.remove}
        />
      </Section>

      {/* Versioning — Documents (multi-version + upload) */}
      <Section title="Versioning — Documents" accent="purple">
        <p className="text-xs text-gray-500 mb-3">Ajoutez chaque version de document. Les versions précédentes sont conservées.</p>
        <JsonTable rows={form.pc_versioning_docs_items || []} emptyMsg="Aucune version de document — cliquez sur + Ajouter"
          columns={[
            { key: 'version',     label: 'Version',     placeholder: 'ex: v1.0, v2.0…', width: 110 },
            { key: 'description', label: 'Description', placeholder: 'Convention, notes…', width: 260, type: 'textarea' },
            {
              key: 'document_url', label: 'Document', type: 'render', width: 160,
              render: (value, onChangeFn) => (
                <FileUploadCell atId={atId} value={value} onChange={onChangeFn} label="📎 Joindre" />
              ),
            },
          ]}
          onAdd={versDocs.add} onUpdate={versDocs.update} onRemove={versDocs.remove}
        />
      </Section>

      {/* Versioning — Code source (multi-version + upload) */}
      <Section title="Versioning — Code source" accent="amber">
        <p className="text-xs text-gray-500 mb-3">Ajoutez chaque version. Les versions précédentes sont conservées.</p>
        <JsonTable rows={form.pc_versioning_src_items || []} emptyMsg="Aucune version de code — cliquez sur + Ajouter"
          columns={[
            { key: 'version',     label: 'Version',     placeholder: 'ex: v1.0.0…', width: 110 },
            { key: 'description', label: 'Description', placeholder: 'SemVer, notes…', width: 260, type: 'textarea' },
            {
              key: 'document_url', label: 'Document', type: 'render', width: 160,
              render: (value, onChangeFn) => (
                <FileUploadCell atId={atId} value={value} onChange={onChangeFn} label="📎 Joindre" />
              ),
            },
          ]}
          onAdd={versSrc.add} onUpdate={versSrc.update} onRemove={versSrc.remove}
        />
      </Section>

      {/* Audits CM */}
      <Section title="Audits de configuration" accent="amber">
        <JsonTable rows={form.pc_audits || []} emptyMsg="Aucun audit de configuration enregistré"
          columns={[
            { key: 'date_audit', label: 'Date audit', type: 'date', width: 110 },
            { key: 'auditeur',   label: 'Auditeur',   type: 'member', members: effectiveMembers, placeholder: '— Choisir —', width: 150 },
            { key: 'constats',   label: 'Constats',   type: 'textarea', width: 200 },
            { key: 'actions',    label: 'Actions',    type: 'textarea', width: 200 },
          ]}
          onAdd={audits.add} onUpdate={audits.update} onRemove={audits.remove}
        />
      </Section>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 3 — Assets Management Plan
// ══════════════════════════════════════════════════════════════════════════════
const TYPE_ACTIF_OPTS = [
  { value: 'Information', label: 'Information' },
  { value: 'Materiel',    label: 'Matériel' },
  { value: 'Logiciel',    label: 'Logiciel' },
  { value: 'Applications',label: 'Applications' },
  { value: 'Reseaux',     label: 'Réseaux' },
]
const CLASSIFICATION_OPTS = [
  { value: 'Usage interne', label: 'Usage interne' },
  { value: 'Restreinte',    label: 'Restreinte' },
  { value: 'Confidentiel',  label: 'Confidentiel' },
  { value: 'NA',            label: 'NA' },
]
const ORIGINE_OPTS = [
  { value: 'Interne', label: 'Interne' },
  { value: 'Externe', label: 'Externe' },
]

function AssetManagementPlan({ form, onChange, members, deptUsers = [] }) {
  const effectiveMembers = deptUsers.length ? deptUsers : members
  const assets = {
    add:    () => onChange('amp_assets', [...(form.amp_assets || []), {
      type_actif: '', actif: '', details: '', responsable: '', date: '',
      emplacement: '', classification: '', proprietaire: '', droits_acces: '', origine: '',
    }]),
    update: (i, k, v) => onChange('amp_assets', (form.amp_assets || []).map((r, idx) => idx === i ? { ...r, [k]: v } : r)),
    remove: (i) => onChange('amp_assets', (form.amp_assets || []).filter((_, idx) => idx !== i)),
  }

  return (
    <div className="space-y-5">
      <Section title="Assets Management Plan" accent="blue">
        <JsonTable
          rows={form.amp_assets || []}
          emptyMsg="Aucun actif — cliquez sur + Ajouter"
          columns={[
            { key: 'type_actif',     label: 'Type Actif',              type: 'select', options: TYPE_ACTIF_OPTS,    width: 130 },
            { key: 'actif',          label: 'Actif',                   placeholder: 'Nom de l\'actif…',             width: 150 },
            { key: 'details',        label: 'Détails',                 type: 'textarea', placeholder: 'Détails…',   width: 180 },
            { key: 'responsable',    label: 'Responsable',             type: 'member', members: effectiveMembers, placeholder: '— Choisir —', width: 150 },
            { key: 'date',           label: 'Date',                    type: 'date',                                width: 110 },
            { key: 'emplacement',    label: 'Emplacement',             placeholder: 'Localisation…',                width: 140 },
            { key: 'classification', label: 'Classification',          type: 'select', options: CLASSIFICATION_OPTS, width: 130 },
            { key: 'proprietaire',   label: 'Propriétaire d\'actif',   placeholder: 'Nom du propriétaire…',         width: 160 },
            { key: 'droits_acces',   label: 'Droits d\'accès par Rôle', placeholder: 'ex: Admin, Lecture…',         width: 170 },
            { key: 'origine',        label: 'Origine d\'Actif',        type: 'select', options: ORIGINE_OPTS,       width: 110 },
          ]}
          onAdd={assets.add} onUpdate={assets.update} onRemove={assets.remove}
        />
      </Section>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 4 — Liste des Livrables
// ══════════════════════════════════════════════════════════════════════════════
const STATUT_LIV = [
  { value: 'planifie',    label: 'Planifié' },
  { value: 'en_cours',   label: 'En cours' },
  { value: 'livre',      label: 'Livré' },
  { value: 'valide',     label: 'Validé' },
  { value: 'rejete',     label: 'Rejeté' },
]

function ListeLivrables({ form, onChange, members, deptUsers = [], atId }) {
  const effectiveMembers = deptUsers.length ? deptUsers : members
  const livs = {
    add: () => {
      const current = form.livrables || []
      const nextNum  = String(current.length + 1).padStart(2, '0')
      const nextId   = `LIV-${nextNum}`
      onChange('livrables', [...current, { id_livrable: nextId, lot: '', nom: '', description: '', date_prevue: '', responsable: '', statut: 'planifie', document_url: '' }])
    },
    update: (i, k, v) => onChange('livrables', (form.livrables || []).map((r, idx) => idx === i ? { ...r, [k]: v } : r)),
    remove: (i) => onChange('livrables', (form.livrables || []).filter((_, idx) => idx !== i)),
  }
  return (
    <div className="space-y-5">
      <Section title="Liste des Livrables" accent="blue">
        <JsonTable rows={form.livrables || []} emptyMsg="Aucun livrable — cliquez sur + Ajouter"
          columns={[
            { key: 'id_livrable',  label: 'ID',           type: 'readonly',               width: 80 },
            { key: 'lot',          label: 'Lot',           placeholder: 'ex: Lot 1',        width: 90 },
            { key: 'nom',          label: 'Nom livrable',  placeholder: 'Nom du livrable…', width: 180 },
            { key: 'description',  label: 'Description',   type: 'textarea',                width: 200 },
            { key: 'date_prevue',  label: 'Date prévue',   type: 'date',                   width: 110 },
            { key: 'responsable',  label: 'Responsable',   type: 'member', members: effectiveMembers, placeholder: '— Choisir —', width: 160 },
            { key: 'statut',       label: 'Statut',        type: 'select', options: STATUT_LIV, width: 110 },
            {
              key: 'document_url', label: 'Document', type: 'render', width: 160,
              render: (value, onChangeFn) => (
                <FileUploadCell atId={atId} value={value} onChange={onChangeFn} label="📎 Joindre" />
              ),
            },
          ]}
          onAdd={livs.add} onUpdate={livs.update} onRemove={livs.remove}
        />
      </Section>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 4 — PV de Libération
// ══════════════════════════════════════════════════════════════════════════════
const DECISION_OPTS = [
  { value: 'accepte',          label: '✅ Accepté' },
  { value: 'accepte_reserves', label: '⚠️ Accepté avec réserves' },
  { value: 'rejete',           label: '❌ Rejeté' },
]
const CONFORME_OPTS = [
  { value: 'oui', label: 'OUI' },
  { value: 'non', label: 'NON' },
  { value: 'na',  label: 'N/A' },
]
const TYPE_LIVRAISON_OPTS = [
  { value: 'documents', label: '📄 Documents' },
  { value: 'logiciels', label: '💻 Logiciels' },
  { value: 'sources',   label: '🗂️ Sources' },
  { value: 'correctif', label: '🔧 Correctif' },
  { value: 'materiel',  label: '⚙️ Matériel' },
  { value: 'systeme',   label: '🖥️ Système' },
]

// Pre-defined criteria by ISO 9001 PV de Libération standard
const DEFAULT_CRITERES = [
  // Category A — Vérification des exigences clients
  { categorie: 'A', critere: 'Conformité du contenu — tout ce que le client a demandé est dans le package', preuve: '', commentaire: '', conforme: 'na' },
  { categorie: 'A', critere: 'Patch couvre toutes les corrections demandées (applicable aux correctifs)', preuve: '', commentaire: '', conforme: 'na' },
  { categorie: 'A', critere: 'Spécifications à jour et validées par le client', preuve: '', commentaire: '', conforme: 'na' },
  // Category B — Vérification du livrable
  { categorie: 'B', critere: 'Revue des work products — remarques clôturées, documents validés', preuve: '', commentaire: '', conforme: 'na' },
  { categorie: 'B', critere: 'Tests fonctionnels — taux de couverture, exécution et succès satisfaisants', preuve: '', commentaire: '', conforme: 'na' },
  { categorie: 'B', critere: 'Tests de non-régression — fonctionnalités précédentes non cassées', preuve: '', commentaire: '', conforme: 'na' },
  { categorie: 'B', critere: 'Tests en charge / robustesse (applicable logiciels et systèmes)', preuve: '', commentaire: '', conforme: 'na' },
  { categorie: 'B', critere: 'Justification des tests non passés — explication documentée + analyse de risque', preuve: '', commentaire: '', conforme: 'na' },
  { categorie: 'B', critere: 'Justification des bugs non corrigés — communiqués au client, criticité justifiée', preuve: '', commentaire: '', conforme: 'na' },
  { categorie: 'B', critere: 'Criticité des bugs résiduels — critères d\'acceptation respectés', preuve: '', commentaire: '', conforme: 'na' },
  // Category C — Maîtrise de la livraison
  { categorie: 'C', critere: 'Cohérence des versions — la version du package correspond à la baseline', preuve: '', commentaire: '', conforme: 'na' },
  { categorie: 'C', critere: 'Complétude du package — tous les fichiers requis sont présents', preuve: '', commentaire: '', conforme: 'na' },
  { categorie: 'C', critere: 'Procédure de livraison respectée — processus conforme aux procédures qualité', preuve: '', commentaire: '', conforme: 'na' },
  { categorie: 'C', critere: 'Traçabilité des éléments livrés — identification unique des éléments de configuration', preuve: '', commentaire: '', conforme: 'na' },
  { categorie: 'C', critere: 'Destinataires et moyens de livraison confirmés', preuve: '', commentaire: '', conforme: 'na' },
]

const CAT_COLORS = {
  A: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: 'A — Exigences clients' },
  B: { bg: 'bg-teal-50',   text: 'text-teal-700',   border: 'border-teal-200',   label: 'B — Vérification du livrable' },
  C: { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  label: 'C — Maîtrise de la livraison' },
}

const CONFORME_BADGE = {
  oui: 'bg-green-100 text-green-800 border-green-300',
  non: 'bg-red-100 text-red-800 border-red-300',
  na:  'bg-gray-100 text-gray-500 border-gray-300',
}

// Build the PV reference automatically: PVL.TLN.{PROJECT}.{AT_ID}.{YY} – Éd:01
function buildPVRef(at, projectName, dateRevue) {
  const proj = (projectName || at?.project_nom || at?.project_name || 'PROJ')
    .toUpperCase().replace(/\s+/g, '-').substring(0, 12)
  const atId  = String(at?.id || '000').padStart(3, '0')
  const year  = dateRevue
    ? String(new Date(dateRevue).getFullYear()).slice(-2)
    : String(new Date().getFullYear()).slice(-2)
  return `PVL.TLN.${proj}.${atId}.${year} – Éd:01`
}

function PVLiberation({ form, onChange, members, deptUsers = [], at }) {
  const effectiveMembers = deptUsers.length ? deptUsers : members
  // ── Auto-generate reference whenever key fields change ──────────────────────
  useEffect(() => {
    const computed = buildPVRef(at, form.pv_nom_projet, form.pv_date_revue)
    if (form.pv_reference !== computed) onChange('pv_reference', computed)
  }, [at, form.pv_nom_projet, form.pv_date_revue]) // eslint-disable-line react-hooks/exhaustive-deps

  const parts = {
    add:    () => onChange('pv_participants', [...(form.pv_participants || []), { role: '', nom: '', organisation: '' }]),
    update: (i, k, v) => onChange('pv_participants', (form.pv_participants || []).map((r, idx) => idx === i ? { ...r, [k]: v } : r)),
    remove: (i) => onChange('pv_participants', (form.pv_participants || []).filter((_, idx) => idx !== i)),
  }
  const acts = {
    add:    () => onChange('pv_actions', [...(form.pv_actions || []), { action: '', responsable: '', delai: '' }]),
    update: (i, k, v) => onChange('pv_actions', (form.pv_actions || []).map((r, idx) => idx === i ? { ...r, [k]: v } : r)),
    remove: (i) => onChange('pv_actions', (form.pv_actions || []).filter((_, idx) => idx !== i)),
  }
  const updateCritere = (i, k, v) =>
    onChange('pv_criteres', (form.pv_criteres || []).map((r, idx) => idx === i ? { ...r, [k]: v } : r))
  const removeCritere = (i) =>
    onChange('pv_criteres', (form.pv_criteres || []).filter((_, idx) => idx !== i))

  const loadDefaultCriteres = () => {
    if ((form.pv_criteres || []).length > 0 &&
        !window.confirm('Remplacer les critères existants par les critères standards ?')) return
    onChange('pv_criteres', DEFAULT_CRITERES.map(c => ({ ...c })))
  }

  const decisionColor = {
    accepte:          'bg-green-50 border-green-200 text-green-800',
    accepte_reserves: 'bg-amber-50 border-amber-200 text-amber-800',
    rejete:           'bg-red-50 border-red-200 text-red-800',
  }

  const criteres = form.pv_criteres || []
  const cats = ['A', 'B', 'C']
  const pvRef = buildPVRef(at, form.pv_nom_projet, form.pv_date_revue)

  return (
    <div className="space-y-5">

      {/* ── En-tête PV ── */}
      <Section title="1 — En-tête du PV de Libération" accent="blue">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nom du projet</label>
            <input value={form.pv_nom_projet || ''} onChange={e => onChange('pv_nom_projet', e.target.value)}
              className={INPUT} placeholder="ex: TRIAD3-DEV…" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Référence du PV</label>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="inline-block px-3 py-1.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-mono font-semibold tracking-wide select-all">
                {pvRef}
              </span>
              <span className="text-xs text-gray-400 italic">générée auto</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Date de revue</label>
            <input type="date" value={form.pv_date_revue || ''} onChange={e => onChange('pv_date_revue', e.target.value)} className={INPUT} />
          </div>
          <div className="col-span-2 md:col-span-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Type de livraison</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {TYPE_LIVRAISON_OPTS.map(o => (
                <button key={o.value} type="button"
                  onClick={() => onChange('pv_type_livraison', form.pv_type_livraison === o.value ? '' : o.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    form.pv_type_livraison === o.value
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                  }`}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <div className="col-span-2 md:col-span-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Objet de la livraison</label>
            <textarea value={form.pv_objet_livraison || ''} onChange={e => onChange('pv_objet_livraison', e.target.value)}
              rows={2} className={TEXTAREA} placeholder="ex: Spécification V1.0 + Annexes SPC_HW_1 à 4 — soyez précis : noms de fichiers, versions…" />
          </div>
        </div>
      </Section>

      {/* ── Participants ── */}
      <Section title="2 — Participants à la revue" accent="green">
        <p className="text-xs text-gray-500 mb-3 bg-blue-50 border-l-2 border-blue-300 px-3 py-1.5 rounded">
          Rôles attendus : <strong>PM</strong> (Chef de projet), <strong>TL</strong> (Tech Lead), <strong>CQP</strong> (Coordinateur Qualité Projet — obligatoire pour valider la libération).
        </p>
        <JsonTable rows={form.pv_participants || []} emptyMsg="Aucun participant — cliquez sur + Ajouter"
          columns={[
            { key: 'role',         label: 'Rôle',         placeholder: 'ex: PM / TL / CQP…',  width: 140 },
            { key: 'nom',          label: 'Nom',           type: 'member', members: effectiveMembers, placeholder: '— Choisir —', width: 160 },
            { key: 'organisation', label: 'Organisation',  placeholder: 'ex: Telnet / Client',  width: 130 },
          ]}
          onAdd={parts.add} onUpdate={parts.update} onRemove={parts.remove}
        />
      </Section>

      {/* ── Critères de conformité ── */}
      <Section title="3 — Critères de conformité" accent="purple">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-gray-500">Cochez <strong>OUI / NON / N/A</strong> pour chaque critère selon le type de livraison.</p>
          <button type="button" onClick={loadDefaultCriteres}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors font-medium">
            📋 Pré-remplir les critères standards
          </button>
        </div>

        {cats.map(cat => {
          const rows = criteres.filter(c => (c.categorie || 'A') === cat)
          if (!rows.length) return null
          const cc = CAT_COLORS[cat] || CAT_COLORS.A
          const globalIdx = (c) => criteres.indexOf(c)
          return (
            <div key={cat} className="mb-4">
              <div className={`text-xs font-semibold px-3 py-1.5 rounded-t border ${cc.bg} ${cc.text} ${cc.border}`}>
                {cc.label}
              </div>
              <div className={`border border-t-0 rounded-b ${cc.border} overflow-hidden`}>
                {rows.map((row, ri) => {
                  const gi = globalIdx(row)
                  return (
                    <div key={ri} className={`flex gap-2 items-start px-3 py-2 text-xs ${ri % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b last:border-b-0 border-gray-100`}>
                      <div className="flex-1 pt-0.5 text-gray-700">{row.critere}</div>
                      <input value={row.preuve || ''} onChange={e => updateCritere(gi, 'preuve', e.target.value)}
                        className="border border-gray-200 rounded px-1.5 py-1 text-xs w-36 focus:outline-none focus:ring-1 focus:ring-purple-300"
                        placeholder="Preuve / doc…" />
                      <input value={row.commentaire || ''} onChange={e => updateCritere(gi, 'commentaire', e.target.value)}
                        className="border border-gray-200 rounded px-1.5 py-1 text-xs w-36 focus:outline-none focus:ring-1 focus:ring-purple-300"
                        placeholder="Commentaire…" />
                      <div className="flex gap-1 flex-shrink-0">
                        {CONFORME_OPTS.map(o => (
                          <button key={o.value} type="button"
                            onClick={() => updateCritere(gi, 'conforme', o.value)}
                            className={`px-2 py-0.5 rounded border text-xs font-semibold transition-colors ${
                              row.conforme === o.value ? CONFORME_BADGE[o.value] : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400'
                            }`}>
                            {o.label}
                          </button>
                        ))}
                      </div>
                      <button type="button" onClick={() => removeCritere(gi)}
                        className="text-gray-300 hover:text-red-400 text-sm flex-shrink-0 pt-0.5">✕</button>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Uncategorized or empty */}
        {criteres.filter(c => !['A','B','C'].includes(c.categorie)).length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-semibold px-3 py-1.5 rounded-t border bg-gray-50 text-gray-600 border-gray-200">Autres critères</div>
            <div className="border border-t-0 rounded-b border-gray-200 overflow-hidden">
              {criteres.filter(c => !['A','B','C'].includes(c.categorie)).map((row, ri) => {
                const gi = criteres.indexOf(row)
                return (
                  <div key={ri} className={`flex gap-2 items-start px-3 py-2 text-xs ${ri % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b last:border-b-0 border-gray-100`}>
                    <div className="flex-1 pt-0.5 text-gray-700">{row.critere}</div>
                    <input value={row.preuve || ''} onChange={e => updateCritere(gi, 'preuve', e.target.value)}
                      className="border border-gray-200 rounded px-1.5 py-1 text-xs w-36" placeholder="Preuve…" />
                    <input value={row.commentaire || ''} onChange={e => updateCritere(gi, 'commentaire', e.target.value)}
                      className="border border-gray-200 rounded px-1.5 py-1 text-xs w-36" placeholder="Commentaire…" />
                    <div className="flex gap-1">
                      {CONFORME_OPTS.map(o => (
                        <button key={o.value} type="button" onClick={() => updateCritere(gi, 'conforme', o.value)}
                          className={`px-2 py-0.5 rounded border text-xs font-semibold ${row.conforme === o.value ? CONFORME_BADGE[o.value] : 'bg-white text-gray-400 border-gray-200'}`}>
                          {o.label}
                        </button>
                      ))}
                    </div>
                    <button type="button" onClick={() => removeCritere(gi)} className="text-gray-300 hover:text-red-400 text-sm">✕</button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {criteres.length === 0 && (
          <p className="text-center text-xs text-gray-400 py-4">Aucun critère — utilisez le bouton "Pré-remplir" ou ajoutez manuellement.</p>
        )}

        {/* Add custom criterion */}
        <button type="button"
          onClick={() => onChange('pv_criteres', [...criteres, { categorie: 'A', critere: '', preuve: '', commentaire: '', conforme: 'na' }])}
          className={BTN_ADD}>
          + Ajouter un critère personnalisé
        </button>
      </Section>

      {/* ── Décision ── */}
      <Section title="4 — Décision de libération" accent="blue">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Décision</label>
            <select value={form.pv_decision || ''} onChange={e => onChange('pv_decision', e.target.value)}
              className={`${INPUT} bg-white font-medium ${decisionColor[form.pv_decision] || ''}`}>
              <option value="">— Choisir —</option>
              {DECISION_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Commentaires généraux / Réserves</label>
            <textarea value={form.pv_commentaire || ''} onChange={e => onChange('pv_commentaire', e.target.value)}
              rows={3} className={TEXTAREA} placeholder="Remarques, observations, conditions de levée des réserves…" />
          </div>
        </div>
      </Section>

      {/* ── Actions ── */}
      <Section title="5 — Actions à mener" accent="amber">
        <JsonTable rows={form.pv_actions || []} emptyMsg="Aucune action — cliquez sur + Ajouter"
          columns={[
            { key: 'action',      label: 'Action',      placeholder: "Description de l'action…", width: 220 },
            { key: 'responsable', label: 'Responsable', type: 'member', members: effectiveMembers, placeholder: '— Choisir —', width: 160 },
            { key: 'delai',       label: 'Délai',       type: 'date', width: 110 },
          ]}
          onAdd={acts.add} onUpdate={acts.update} onRemove={acts.remove}
        />
      </Section>

      {/* ── Export PDF ── */}
      <div className="flex justify-end">
        <button type="button" onClick={() => exportPVLiberationPDF(form, at)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors shadow-sm">
          📄 Exporter PV de Libération (PDF)
        </button>
      </div>
    </div>
  )
}



// ══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT — Step 2 Réalisation
// ══════════════════════════════════════════════════════════════════════════════
const TABS = [
  { id: 'pq',   label: '📋 Plan de Qualité' },
  { id: 'pc',   label: '⚙️ Plan de Configuration' },
  { id: 'amp',  label: '🗂️ Assets Management Plan' },
  { id: 'liv',  label: '📦 Liste des Livrables' },
  { id: 'pv',   label: '✅ PV de Libération' },
]

const DEFAULT_JALONS = [
  { id_jalon: 'M0', description: 'Démarrage du projet (Go)', reference_interne: '', statut: 'prevu', date_prevue: '', date_reelle: '' },
  { id_jalon: 'M1', description: '',                          reference_interne: '', statut: 'prevu', date_prevue: '', date_reelle: '' },
  { id_jalon: 'M2', description: '',                          reference_interne: '', statut: 'prevu', date_prevue: '', date_reelle: '' },
  { id_jalon: 'M3', description: '',                          reference_interne: '', statut: 'prevu', date_prevue: '', date_reelle: '' },
  { id_jalon: 'M4', description: 'Clôture / Livraison finale', reference_interne: '', statut: 'prevu', date_prevue: '', date_reelle: '' },
]

const EMPTY_FORM = {
  // PQ — général
  pq_nom_projet: '', pq_reference_doc: '', pq_date: '', pq_auteur: '',
  pq_version: '', pq_objectif: '', pq_domaine: '', pq_documents_ref: '',
  // PQ — nouvelles sections
  pq_presentation_projet: '',
  pq_org_client: [],
  pq_membres_equipe_pq: [],
  pq_equipe_validation: [],
  pq_competences: [],
  pq_formations: [],
  pq_planning: '',
  pq_communication_pq: [],
  pq_reunions_pq: [],
  pq_cycle_vie: '',
  pq_phases: [],
  pq_criteres_acceptation: '',
  pq_jalons: DEFAULT_JALONS,
  pq_materiels: [], pq_outils: [],
  pq_env_dev: [], pq_env_test: [],
  pq_garantie: '',
  pq_has_garantie: false,
  pq_support_maintenance: '',
  pq_has_maintenance: false,
  pq_incidents_secu: [],
  pq_org_chart_url: '',
  pq_cycle_vie_file: '',
  pq_version_num: 0,
  // PC
  pc_outils_cm: '', pc_formations_cm: '', pc_politiques: '', pc_gestion_branches: '',
  pc_branches_qa: { q1: '', q2: '', q3: '', q4: '', q5: '', q6: '', q7: '', q8: '' },
  pc_items_config: [], pc_baselines: [],
  pc_versioning_docs: '', pc_versioning_docs_items: [],
  pc_versioning_src: '',  pc_versioning_src_items: [],
  pc_audits: [],
  // Assets Management Plan
  amp_assets: [],
  // Livrables
  livrables: [],
  // PV
  pv_nom_projet: '', pv_reference: '', pv_objet_livraison: '', pv_perimetre: '',
  pv_type_livraison: '', pv_date_revue: '', pv_decision: '',
  pv_commentaire: '', pv_participants: [], pv_criteres: [], pv_actions: [],
}

export default function Step2Realisation({ at, step1Data, step2Data, saving, onSave, onAdvance, onBack }) {
  const [activeTab, setActiveTab] = useState('pq')
  const [form, setForm]           = useState({ ...EMPTY_FORM })
  const [isDirty, setIsDirty]     = useState(false)
  const [deptUsers, setDeptUsers] = useState([])
  const initialized               = useRef(false)

  // Use project members already embedded in the AT object by the serializer (fallback)
  const members = Array.isArray(at?.project_membres) ? at.project_membres : []

  // Fetch all users from the project's department for member selectors
  useEffect(() => {
    const dept = at?.project_departement
    if (!dept) return
    fetchDeptUsers(dept).then(setDeptUsers).catch(() => setDeptUsers([]))
  }, [at?.project_departement])

  // ── Initialize form from saved data + auto-fill from Step1 / project ──────
  useEffect(() => {
    if (isDirty) return
    // Wait until step1Data has actually loaded before initializing
    if (!step1Data) return
    initialized.current = true

    async function init() {
      const today       = new Date().toISOString().split('T')[0]
      const base        = { ...EMPTY_FORM, ...(step2Data || {}) }
      const projectName = at?.project_nom || at?.project_name || ''
      const projMembers = Array.isArray(at?.project_membres) ? at.project_membres : []

      // ── PQ — General ───────────────────────────────────────────────────────
      if (!base.pq_nom_projet && projectName) base.pq_nom_projet = projectName
      if (!base.pq_reference_doc && at?.project_ref) base.pq_reference_doc = at.project_ref
      if (!base.pq_date) base.pq_date = today

      // Auteur = utilisateur connecté (API)
      if (!base.pq_auteur) {
        try {
          const user = await fetchCurrentUser()
          const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || ''
          if (fullName) base.pq_auteur = fullName
        } catch (_) {}
      }

      // ── PQ — Objectif (from step1) ─────────────────────────────────────────
      if (!base.pq_objectif && step1Data?.objectifs_principaux) {
        base.pq_objectif = step1Data.objectifs_principaux
      }

      // ── PQ — Organisation client (from project client info in DB) ──────────
      if ((!base.pq_org_client || base.pq_org_client.length === 0) && at?.project_client_info) {
        const ci = at.project_client_info
        base.pq_org_client = [{
          role: 'Client', nom_complet: ci.nom || '', email: ci.email || '', telephone: ci.telephone || '',
        }]
      }

      // ── PQ — Membres équipe projet (from step1 membres + responsabilites) ──
      if (!base.pq_membres_equipe_pq || base.pq_membres_equipe_pq.length === 0) {
        const step1Membres = step1Data?.membres || []
        if (step1Membres.length > 0) {
          base.pq_membres_equipe_pq = step1Membres.map(m => ({
            role: m.role || '', nom: m.nom || '', responsabilites: m.responsabilites || '',
          }))
        } else if (projMembers.length > 0) {
          base.pq_membres_equipe_pq = projMembers.map(m => ({
            role: m.role || '',
            nom: `${m.first_name || ''} ${m.last_name || ''}`.trim() || m.email || '',
            responsabilites: '',
          }))
        }
      }

      // ── PQ — Compétences (from project competences) ─────────────────────────
      if ((!base.pq_competences || base.pq_competences.length === 0) && at?.project_competences?.length > 0) {
        base.pq_competences = at.project_competences.map(c => ({
          competence: c, membres: {},
        }))
      }

      // ── PQ — Formations (from step1 formations) ─────────────────────────────
      if ((!base.pq_formations || base.pq_formations.length === 0) && step1Data) {
        const fmts = step1Data.formations || []
        if (fmts.length > 0) {
          base.pq_formations = fmts.map(f => ({
            formation: f.formation || '', stagiaires: f.ressources || '',
            formateur: '', date_prevue: f.dates || '', type_formation: '',
          }))
        }
      }

      // ── PQ — Réunions (from step1 plan_communication) ──────────────────────
      if ((!base.pq_communication_pq || base.pq_communication_pq.length === 0) && step1Data) {
        const comms = step1Data.plan_communication || []
        if (comms.length > 0) {
          base.pq_communication_pq = comms.map(c => ({
            sujet: c.objectif || '', parties_prenantes: c.participants || '', moyen: c.element_sortie || '',
          }))
          base.pq_reunions_pq = comms.map(c => ({
            type_reunion: c.type_reunion === 'pilotage' ? 'Réunion de pilotage' : 'Réunion technique',
            objectif: c.objectif || '', resultats: c.element_sortie || '',
            pilote: c.responsable || '', participants: c.participants || '',
            frequence: c.frequence || '', date_prevue: c.date_prevue || '',
          }))
        }
      }

      // ── PQ — Jalons (pre-populate M0-M4 if empty) ──────────────────────────
      if (!base.pq_jalons || base.pq_jalons.length === 0) {
        base.pq_jalons = DEFAULT_JALONS.map(j => ({ ...j }))
      }

      // ── PV — General ───────────────────────────────────────────────────────
      if (!base.pv_nom_projet && projectName) base.pv_nom_projet = projectName
      if (!base.pv_date_revue) base.pv_date_revue = today
      // Always (re)compute reference from project data
      base.pv_reference = buildPVRef(at, base.pv_nom_projet || projectName, base.pv_date_revue || today)

      // ── PV — Participants (from project members) ────────────────────────────
      if ((!base.pv_participants || base.pv_participants.length === 0) && projMembers.length > 0) {
        base.pv_participants = projMembers.map(m => ({
          role: m.role || '',
          nom: `${m.first_name || ''} ${m.last_name || ''}`.trim() || m.email || '',
          organisation: 'Telnet',
        }))
      }

      setForm(base)
    }

    init()
  }, [step2Data, step1Data, at, isDirty])

  const handleChange = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setIsDirty(true)
  }, [])

  const handleSave = useCallback(async () => {
    const newVersionNum = (form.pq_version_num || 0) + 1
    const payload = { ...form, pq_version_num: newVersionNum, pq_version: `${newVersionNum}.0` }
    await onSave(payload)
    setForm(prev => ({ ...prev, pq_version_num: newVersionNum, pq_version: `${newVersionNum}.0` }))
    setIsDirty(false)
  }, [form, onSave])

  // Save any pending changes before advancing, so clicking "Passer à l'étape
  // suivante" never silently discards unsaved edits.
  const handleAdvanceClick = useCallback(async () => {
    if (isDirty) await handleSave()
    onAdvance()
  }, [isDirty, handleSave, onAdvance])

  const completedSteps = Array.from({ length: (at?.current_step || 2) - 1 }, (_, i) => i + 1)

  return (
    <div className="space-y-4">
      {/* Stepper */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
        <ATWorkflowStepper currentStep={at?.current_step || 2} completedSteps={completedSteps} />
      </div>

      {/* Dirty banner */}
      {isDirty && !saving && (
        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200">
          ⚠️ Modifications non sauvegardées
        </div>
      )}

      {/* Tab bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 flex overflow-x-auto">
        {TABS.map(tab => (
          <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
              ${activeTab === tab.id
                ? 'border-blue-500 text-blue-700 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'pq'  && <PlanQualite         form={form} onChange={handleChange} members={members} deptUsers={deptUsers} atId={at?.id} />}
        {activeTab === 'pc'  && <PlanConfiguration  form={form} onChange={handleChange} members={members} deptUsers={deptUsers} atId={at?.id} />}
        {activeTab === 'amp' && <AssetManagementPlan form={form} onChange={handleChange} members={members} deptUsers={deptUsers} />}
        {activeTab === 'liv' && <ListeLivrables      form={form} onChange={handleChange} members={members} deptUsers={deptUsers} atId={at?.id} />}
        {activeTab === 'pv'  && <PVLiberation        form={form} onChange={handleChange} members={members} deptUsers={deptUsers} at={at} />}
      </div>

      {/* Navigation bar */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 flex items-center justify-between">
        <button type="button" onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          ← Retour à l'étape 1
        </button>
        <div className="flex items-center gap-3">
          <button type="button" onClick={handleSave} disabled={saving || !isDirty}
            className={`flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg shadow transition-colors
              ${isDirty && !saving ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
            {saving ? (
              <><svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg> Sauvegarde…</>
            ) : '💾 Sauvegarder'}
          </button>
          <button type="button" onClick={handleAdvanceClick}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow transition-colors">
            Passer à l'étape 3 →
          </button>
        </div>
      </div>
    </div>
  )
}