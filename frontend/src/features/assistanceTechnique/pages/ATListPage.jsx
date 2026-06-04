import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getATList, createAT } from '../api/assistanceTechniqueApi'
import AxiosInstance from '../../../components/AxiosInstance'

const TYPE_OPTIONS = [
  'Développement logiciel',
  'Intégration système',
  'Conseil & expertise',
  'Support technique',
  'Formation',
  'Audit technique',
  'Autre',
]

// Retourne le nom complet du premier membre resp_qualite ou chef_projet
function getDirecteur(membres) {
  if (!membres?.length) return ''
  const DA_ROLES = ['resp_qualite', 'chef_projet']
  const found = membres.find(m => DA_ROLES.includes(m.role))
  if (!found) return ''
  return `${found.first_name} ${found.last_name}`.trim()
}

export default function ATListPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [list, setList]       = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]       = useState({ type_prestation: '', client: '', directeur_activite: '' })
  const [creating, setCreating] = useState(false)
  const [error, setError]     = useState(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      AxiosInstance.get(`projects/${projectId}/`).then(r => r.data),
      getATList(projectId),
    ])
      .then(([proj, ats]) => {
        setProject(proj)
        setList(ats)
        // Pré-remplir le formulaire avec les données du projet
        setForm({
          type_prestation: '',
          client: proj.client || '',
          directeur_activite: getDirecteur(proj.membres_details),
        })
      })
      .catch(e => setError(e?.detail || 'Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [projectId])

  const handleCreate = async (e) => {
    e.preventDefault()
    setCreating(true)
    try {
      const at = await createAT({ ...form, project: projectId })
      navigate(`/projects/${projectId}/assistance-technique/${at.id}`)
    } catch (e) {
      setError(e?.detail || 'Erreur lors de la création')
    } finally {
      setCreating(false)
    }
  }

  const statusBadge = (status) => status === 'terminee'
    ? <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Terminée</span>
    : <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">En cours</span>

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Assistances Techniques</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestion des prestations d'assistance technique</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow flex items-center gap-2">
          + Nouvelle AT
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm mb-4">{error}</div>
      )}

      {/* Create form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Nouvelle Assistance Technique</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Type de prestation *</label>
                <select required value={form.type_prestation}
                  onChange={e => setForm(f => ({ ...f, type_prestation: e.target.value }))}
                  className="border border-gray-200 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400">
                  <option value="">-- Sélectionner --</option>
                  {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Client *
                  <span className="ml-1.5 text-xs text-blue-500 font-normal">(issu du projet)</span>
                </label>
                <div className="flex items-center gap-2 border border-blue-100 bg-blue-50 rounded px-3 py-2 text-sm text-gray-800">
                  <span className="text-blue-400">🏢</span>
                  <span className="font-medium">{form.client || '—'}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Directeur d'activité
                  <span className="ml-1.5 text-xs text-blue-500 font-normal">(resp. qualité / chef de projet)</span>
                </label>
                <div className="flex items-center gap-2 border border-blue-100 bg-blue-50 rounded px-3 py-2 text-sm text-gray-800">
                  <span className="text-blue-400">👤</span>
                  <span className="font-medium">{form.directeur_activite || <span className="text-gray-400 italic">Aucun resp_qualite / chef_projet assigné</span>}</span>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                  Annuler
                </button>
                <button type="submit" disabled={creating}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg disabled:opacity-60">
                  {creating ? 'Création…' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="bg-gray-100 rounded-lg h-20 animate-pulse" />)}
        </div>
      ) : list.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-12 text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-gray-500 text-sm">Aucune assistance technique pour ce projet.</p>
          <button onClick={() => setShowForm(true)} className="mt-4 text-blue-600 text-sm hover:underline">
            + Créer la première AT
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map(at => (
            <div key={at.id}
              onClick={() => navigate(`/projects/${projectId}/assistance-technique/${at.id}`)}
              className="bg-white rounded-lg border border-gray-100 shadow-sm p-5 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-900">{at.type_prestation}</span>
                  {statusBadge(at.status)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Client : {at.client} · Étape {at.current_step}/4
                  {at.directeur_activite && ` · DA : ${at.directeur_activite}`}
                </p>
              </div>
              <span className="text-gray-300 text-lg">›</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

