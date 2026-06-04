import { useState, useEffect, useCallback, useRef } from 'react'
import ATWorkflowStepper from '../ATWorkflowStepper'
import MembreEquipeTable from '../subcomponents/MembreEquipeTable'
import ContactsTable from '../subcomponents/ContactsTable'
import FormationTable from '../subcomponents/FormationTable'
import CommunicationPlanTable from '../subcomponents/CommunicationPlanTable'
import RisquesTable from '../subcomponents/RisquesTable'
import PointsOuvertsTable from '../subcomponents/PointsOuvertsTable'
import { exportStep1PDF } from '../../utils/atPdfExport'
import { fetchCurrentUser, fetchProjectRisks, fetchAllProjectRisks, fetchDeptUsers, updateProjectMembers } from '../../api/assistanceTechniqueApi'

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
      <h3 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">{title}</h3>
      {children}
    </div>
  )
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

const INPUT = 'border border-gray-200 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400'
const TEXTAREA = INPUT + ' resize-none'

// Role label mapping (DB role → display label)
const ROLE_LABELS = {
  admin: 'Administrateur', resp_qualite: 'Responsable Qualité', chef_projet: 'Chef de Projet',
  developpeur: 'Développeur', tech_lead: 'Tech Lead', ingenieur: 'Ingénieur',
  validateur: 'Validateur', charge_affaires: "Chargé d'Affaires",
  consultant: 'Consultant', stagiaire: 'Stagiaire',
}

export default function Step1Lancement({ at, step1Data, saving, onSave, onAdvance, onBack }) {
  const [form, setForm] = useState(step1Data || {})
  const [isDirty, setIsDirty] = useState(false)
  const [importing, setImporting] = useState(false)
  const [deptUsers, setDeptUsers] = useState([])
  const initialized = useRef(false)

  // Fetch all users from the project's department for member selection
  useEffect(() => {
    const dept = at?.project_departement
    if (!dept) return
    fetchDeptUsers(dept).then(setDeptUsers).catch(() => setDeptUsers([]))
  }, [at?.project_departement])

  // Sync a newly selected user to the project's member list
  const handleMemberAdd = useCallback(async (userId) => {
    const projectId = at?.project
    if (!projectId || !userId) return
    const currentIds = (at?.project_membres || []).map(m => m.id)
    if (currentIds.includes(userId)) return   // already a project member
    try {
      await updateProjectMembers(projectId, [...currentIds, userId])
    } catch {
      // silent — the AT data is the source of truth here
    }
  }, [at?.project, at?.project_membres])

  // Sync from server ONLY on first load, then auto-fill empty fields from project
  useEffect(() => {
    if (step1Data && !initialized.current) {
      initialized.current = true
      const filled = { ...step1Data }

      // 1. Auto-fill nom_projet from project if not yet set
      if (!filled.nom_projet && at?.project_nom) filled.nom_projet = at.project_nom

      // 2. Auto-fill reference_document from project ref if empty
      if (!filled.reference_document && at?.project_ref) filled.reference_document = at.project_ref

      // 3. Auto-fill today's date if empty
      if (!filled.date) filled.date = new Date().toISOString().split('T')[0]

      // 4. Ensure deplacements_prevus is always an array
      if (!Array.isArray(filled.deplacements_prevus)) {
        filled.deplacements_prevus = filled.deplacements_prevus
          ? [filled.deplacements_prevus]
          : []
      }

      // 5. Auto-fill project members into équipe if empty
      if ((!filled.membres || filled.membres.length === 0) && at?.project_membres?.length) {
        filled.membres = at.project_membres.map(m => ({
          role: m.role,
          nom: [m.first_name, m.last_name].filter(Boolean).join(' ') || m.email,
          responsabilites: '',
        }))
      }

      // 6. Auto-fill Telnet contacts (resp_qualite + chef_projet) if contacts empty
      const telnetContacts = (filled.contacts || []).filter(c => c.partie === 'telnet')
      if (telnetContacts.length === 0 && at?.project_membres?.length) {
        const telnetRoles = ['resp_qualite', 'chef_projet']
        const autoTelnet = at.project_membres
          .filter(m => telnetRoles.includes(m.role))
          .map(m => ({
            partie: 'telnet',
            nom: [m.first_name, m.last_name].filter(Boolean).join(' ') || m.email,
            role: ROLE_LABELS[m.role] || m.role,
            email: m.email,
            telephone: m.phone_number || '',
          }))
        const clientContacts = (filled.contacts || []).filter(c => c.partie === 'client')
        filled.contacts = [...autoTelnet, ...clientContacts]
      }

      // 7. Auto-fill Client contact with full details from DB if empty
      const clientContacts = (filled.contacts || []).filter(c => c.partie === 'client')
      if (clientContacts.length === 0) {
        const otherContacts = (filled.contacts || []).filter(c => c.partie !== 'client')
        const ci = at?.project_client_info
        if (ci || at?.project_name) {
          filled.contacts = [
            ...otherContacts,
            {
              partie: 'client',
              nom: ci?.nom || at?.project_name || '',
              role: 'Client',
              email: ci?.email || '',
              telephone: ci?.telephone || '',
            },
          ]
        }
      }

      // 8. Auto-fill competences from project if empty
      if (!filled.competences_requises && at?.project_competences?.length) {
        filled.competences_requises = at.project_competences.join(', ')
      }

      // 8b. Auto-fill Logiciels requis from Connaissances métier + Management
      if (!filled.software_requis) {
        const softItems = [
          ...(at?.project_metier_generique  || []),
          ...(at?.project_metier_specifique || []),
          ...(at?.project_management        || []),
        ]
        if (softItems.length) filled.software_requis = softItems.join('\n')
      }

      // 8c. Auto-fill Outils requis from OS & Outils + DevOps + Langages
      if (!filled.outils_requis) {
        const outilItems = [
          ...(at?.project_os_outils || []),
          ...(at?.project_devops    || []),
          ...(at?.project_langages  || []),
        ]
        if (outilItems.length) filled.outils_requis = outilItems.join('\n')
      }

      setForm(filled)

      // 9. Auto-fill auteur from current logged-in user if empty
      if (!filled.auteur) {
        fetchCurrentUser()
          .then(user => {
            if (user) {
              const name = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email
              setForm(prev => prev.auteur ? prev : { ...prev, auteur: name })
            }
          })
          .catch(() => {})
      }

      // 10. Auto-import open risks into risques table if empty
      if ((!filled.risques || filled.risques.length === 0) && at?.project) {
        fetchProjectRisks(at.project)
          .then(risks => {
            if (!risks?.length) return
            const converted = risks.map(r => ({
              description_risque: r.title || r.causes || '',
              approche_attenuation: r.action_plan?.action || r.existing_measures || '',
            }))
            setForm(prev => prev.risques?.length ? prev : { ...prev, risques: converted })
            setIsDirty(true)
          })
          .catch(() => {})
      }

      // 10b. Always sync formations from ALL risks (all statuses) whose action contains "formation"
      if (at?.project) {
        fetchAllProjectRisks(at.project)
          .then(allRisks => {
            if (!allRisks?.length) return
            const formationRisks = allRisks.filter(r => {
              const action = (r.action_plan?.action || '').toLowerCase()
              return action.includes('formation')
            })
            if (!formationRisks.length) return
            setForm(prev => {
              const existingFormations = prev.formations || []
              const existingTexts = new Set(existingFormations.map(f => f.formation))
              const newFormations = formationRisks
                .map(r => ({
                  formation: r.action_plan?.action || '',
                  dates: r.action_plan?.planned_date || '',
                  ressources: '',
                }))
                .filter(f => f.formation && !existingTexts.has(f.formation))
              if (!newFormations.length) return prev
              return { ...prev, formations: [...existingFormations, ...newFormations] }
            })
            setIsDirty(true)
          })
          .catch(() => {})
      }
    }
  }, [step1Data, at])

  const handleChange = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setIsDirty(true)
  }, [])

  const handleSave = useCallback(async () => {
    await onSave(form)
    setIsDirty(false)
  }, [form, onSave])

  // Import open risks into risques table + sync ALL risk formations
  const handleImportRisques = useCallback(async () => {
    if (!at?.project) return
    setImporting(true)
    try {
      // Import open risks into the risques table
      const openRisks = await fetchProjectRisks(at.project)
      if (!openRisks?.length) { alert('Aucun risque ouvert trouvé pour ce projet.'); return }
      const converted = openRisks.map(r => ({
        description_risque: r.title || r.causes || '',
        approche_attenuation: r.action_plan?.action || r.existing_measures || '',
      }))

      // Fetch ALL risks (all statuses) to find formation actions
      const allRisks = await fetchAllProjectRisks(at.project)
      const formationRisks = (allRisks || []).filter(r => {
        const action = (r.action_plan?.action || '').toLowerCase()
        return action.includes('formation')
      })

      setForm(prev => {
        // Merge open risks (no duplicates)
        const existing = prev.risques || []
        const existingDescs = new Set(existing.map(r => r.description_risque))
        const newOnes = converted.filter(r => !existingDescs.has(r.description_risque))
        let next = { ...prev, risques: [...existing, ...newOnes] }

        // Merge formations from all risks that contain "formation" (no duplicates)
        if (formationRisks.length) {
          const existingFormations = prev.formations || []
          const existingFormTexts = new Set(existingFormations.map(f => f.formation))
          const newFormations = formationRisks
            .map(r => ({
              formation: r.action_plan?.action || '',
              dates: r.action_plan?.planned_date || '',
              ressources: '',
            }))
            .filter(f => f.formation && !existingFormTexts.has(f.formation))
          if (newFormations.length) next = { ...next, formations: [...existingFormations, ...newFormations] }
        }
        return next
      })
      setIsDirty(true)
    } catch {
      alert('Erreur lors de l\'import des risques.')
    } finally {
      setImporting(false)
    }
  }, [at?.project])

  // Sync team from project members (uses DB roles directly — no API call needed)
  const handleSyncEquipe = useCallback(() => {
    const members = at?.project_membres
    if (!members?.length) { alert('Aucun membre trouvé pour ce projet.'); return }
    const converted = members.map(m => ({
      role: m.role || 'developpeur',
      nom: [m.first_name, m.last_name].filter(Boolean).join(' ') || m.email,
      responsabilites: '',
    }))
    setForm(prev => ({ ...prev, membres: converted }))
    setIsDirty(true)
  }, [at?.project_membres])

  const completedSteps = Array.from({ length: (at?.current_step || 1) - 1 }, (_, i) => i + 1)

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
        <ATWorkflowStepper currentStep={at?.current_step || 1} completedSteps={completedSteps} />
      </div>

      {/* Unsaved changes indicator */}
      {isDirty && !saving && (
        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200">
          ⚠️ Modifications non sauvegardées
        </div>
      )}

      {/* Section 1 — Informations générales */}
      <Section title="1. Informations générales">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nom du projet" required>
            <input className={INPUT} value={form.nom_projet || ''} required
              onChange={e => handleChange('nom_projet', e.target.value)} placeholder="Nom du projet" />
          </Field>
          <Field label="Référence document">
            <input className={INPUT} value={form.reference_document || ''}
              onChange={e => handleChange('reference_document', e.target.value)} placeholder="ex: AT-2025-001" />
          </Field>
          <Field label="Auteur" required>
            <input className={INPUT} value={form.auteur || ''} required
              onChange={e => handleChange('auteur', e.target.value)} placeholder="Auteur du document" />
          </Field>
          <Field label="Date">
            <input type="date" className={INPUT} value={form.date || ''}
              onChange={e => handleChange('date', e.target.value)} />
          </Field>
        </div>
      </Section>

      {/* Section 2 — Objectifs */}
      <Section title="2. Objectifs principaux du projet">
        <textarea className={TEXTAREA} rows={4} value={form.objectifs_principaux || ''}
          onChange={e => handleChange('objectifs_principaux', e.target.value)}
          placeholder="Décrire les objectifs principaux de la prestation…" />
      </Section>

      {/* Section 3 — Périmètre */}
      <Section title="3. Périmètre du projet">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Contribution Client">
            <textarea className={TEXTAREA} rows={3} value={form.contribution_client || ''}
              onChange={e => handleChange('contribution_client', e.target.value)}
              placeholder="Ce que le client fournit…" />
          </Field>
          <Field label="Contribution TELNET">
            <textarea className={TEXTAREA} rows={3} value={form.contribution_telnet || ''}
              onChange={e => handleChange('contribution_telnet', e.target.value)}
              placeholder="Ce que TELNET fournit…" />
          </Field>
        </div>
      </Section>

      {/* Section 4 — Planning */}
      <Section title="4. Planning & déplacements">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Date T0 (début)">
            <input type="date" className={INPUT} value={form.t0_date_demarrage || ''}
              onChange={e => handleChange('t0_date_demarrage', e.target.value)} />
          </Field>
          <Field label="Durée planifiée">
            <input className={INPUT} value={form.duree_planifiee || ''}
              onChange={e => handleChange('duree_planifiee', e.target.value)} placeholder="ex: 6 mois" />
          </Field>
          <Field label="Déplacements prévus">
            {/* Multi-entry: one input per location */}
            <div className="space-y-1">
              {(Array.isArray(form.deplacements_prevus) ? form.deplacements_prevus : []).map((loc, i) => (
                <div key={i} className="flex gap-1">
                  <input className={INPUT} value={loc}
                    onChange={e => {
                      const next = [...(form.deplacements_prevus || [])]
                      next[i] = e.target.value
                      handleChange('deplacements_prevus', next)
                    }}
                    placeholder="ex: Paris" />
                  <button type="button"
                    onClick={() => handleChange('deplacements_prevus', (form.deplacements_prevus || []).filter((_, j) => j !== i))}
                    className="text-red-400 hover:text-red-600 px-2 shrink-0">✕</button>
                </div>
              ))}
              <button type="button"
                onClick={() => handleChange('deplacements_prevus', [...(form.deplacements_prevus || []), ''])}
                className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1">
                + Ajouter un lieu
              </button>
            </div>
          </Field>
        </div>
      </Section>

      {/* Section 5 — Équipe */}
      <Section title="5. Organisation de l'équipe">
        <div className="flex justify-end mb-3">
          <button type="button" onClick={handleSyncEquipe} disabled={importing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50">
            {importing ? '⏳' : '🔄'} Synchroniser depuis le projet
          </button>
        </div>
        <MembreEquipeTable
          membres={form.membres || []}
          onChange={v => handleChange('membres', v)}
          deptUsers={deptUsers}
          onMemberAdd={handleMemberAdd}
        />
      </Section>

      {/* Section 6 — Contacts */}
      <Section title="6. Contacts">
        <ContactsTable
          contacts={form.contacts || []}
          onChange={v => handleChange('contacts', v)}
        />
      </Section>

      {/* Section 7 — Compétences */}
      <Section title="7. Compétences requises">
        <textarea className={TEXTAREA} rows={3} value={form.competences_requises || ''}
          onChange={e => handleChange('competences_requises', e.target.value)}
          placeholder="Lister les compétences techniques et fonctionnelles requises…" />
      </Section>

      {/* Section 8 — Formations */}
      <Section title="8. Formations planifiées">
        <FormationTable
          formations={form.formations || []}
          onChange={v => handleChange('formations', v)}
        />
      </Section>

      {/* Section 9 — Moyens */}
      <Section title="9. Moyens">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Logiciels requis">
            <textarea className={TEXTAREA} rows={3} value={form.software_requis || ''}
              onChange={e => handleChange('software_requis', e.target.value)} placeholder="ex: IntelliJ, Docker…" />
          </Field>
          <Field label="Matériel requis">
            <textarea className={TEXTAREA} rows={3} value={form.hardware_requis || ''}
              onChange={e => handleChange('hardware_requis', e.target.value)} placeholder="ex: Laptop, serveur…" />
          </Field>
          <Field label="Outils requis">
            <textarea className={TEXTAREA} rows={3} value={form.outils_requis || ''}
              onChange={e => handleChange('outils_requis', e.target.value)} placeholder="ex: Jira, Confluence…" />
          </Field>
        </div>
      </Section>

      {/* Section 10 — Plan de communication */}
      <Section title="10. Plan de communication">
        <CommunicationPlanTable
          plan={form.plan_communication || []}
          onChange={v => handleChange('plan_communication', v)}
          projectMembers={at?.project_membres || []}
          atId={at?.id}
        />
      </Section>

      {/* Section 11 — Risques */}
      <Section title="11. Risques identifiés">
        <div className="flex justify-end mb-3">
          <button type="button" onClick={handleImportRisques} disabled={importing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50">
            {importing ? '⏳' : '⚠️'} Importer risques ouverts du projet
          </button>
        </div>
        <RisquesTable
          risques={form.risques || []}
          onChange={v => handleChange('risques', v)}
        />
      </Section>

      {/* Section 12 — Points ouverts */}
      <Section title="12. Points ouverts / Actions">
        <PointsOuvertsTable
          points={form.points_ouverts || []}
          onChange={v => handleChange('points_ouverts', v)}
          projectMembers={at?.project_membres || []}
        />
      </Section>

      {/* Navigation */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 flex items-center justify-between">
        <button type="button" onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          ← Retour à la vue d'ensemble
        </button>
        <div className="flex items-center gap-3">
          <button type="button"
            onClick={() => exportStep1PDF(form, at)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            📄 Exporter PDF
          </button>
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
          <button type="button" onClick={onAdvance}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow transition-colors">
            Passer à l'étape 2 →
          </button>
        </div>
      </div>
    </div>
  )
}

