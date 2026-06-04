import AxiosInstance from '../../../components/AxiosInstance'

const BASE = 'assistance-technique'

// ── AT CRUD ───────────────────────────────────────────────────────────────────
export const getATList      = (project) => AxiosInstance.get(`${BASE}/`, { params: { project } }).then(r => r.data)
export const getAT          = (id)      => AxiosInstance.get(`${BASE}/${id}/`).then(r => r.data)
export const createAT       = (payload) => AxiosInstance.post(`${BASE}/`, payload).then(r => r.data)
export const updateAT       = (id, payload) => AxiosInstance.patch(`${BASE}/${id}/`, payload).then(r => r.data)
export const deleteAT       = (id)      => AxiosInstance.delete(`${BASE}/${id}/`)

// ── Step navigation ───────────────────────────────────────────────────────────
export const advanceStep    = (id) => AxiosInstance.post(`${BASE}/${id}/advance_step/`).then(r => r.data)
export const goBackStep     = (id) => AxiosInstance.post(`${BASE}/${id}/go_back_step/`).then(r => r.data)

// ── Steps data ────────────────────────────────────────────────────────────────
export const getStep1       = (id) => AxiosInstance.get(`${BASE}/${id}/step1/`).then(r => r.data)
export const saveStep1      = (id, payload) => AxiosInstance.patch(`${BASE}/${id}/step1/`, payload).then(r => r.data)

export const getStep2       = (id) => AxiosInstance.get(`${BASE}/${id}/step2/`).then(r => r.data)
export const saveStep2      = (id, payload) => AxiosInstance.patch(`${BASE}/${id}/step2/`, payload).then(r => r.data)

export const getStep3       = (id) => AxiosInstance.get(`${BASE}/${id}/step3/`).then(r => r.data)
export const saveStep3      = (id, payload) => AxiosInstance.patch(`${BASE}/${id}/step3/`, payload).then(r => r.data)

export const getStep4       = (id) => AxiosInstance.get(`${BASE}/${id}/step4/`).then(r => r.data)
export const saveStep4      = (id, payload) => AxiosInstance.patch(`${BASE}/${id}/step4/`, payload).then(r => r.data)

// ── User autocomplete ─────────────────────────────────────────────────────────
export const fetchUsersAutocomplete = ({ q = '', role = '' } = {}) =>
  AxiosInstance.get('users/autocomplete/', { params: { q, role } }).then(r => r.data)

// ── Current user profile ──────────────────────────────────────────────────────
export const fetchCurrentUser = () =>
  AxiosInstance.get('me/').then(r => r.data)

// ── Project risks (open risks for AT import into risques table) ───────────────
export const fetchProjectRisks = (projectId) =>
  AxiosInstance.get('risks/', { params: { project: projectId, status: 'Ouvert' } }).then(r => r.data)

// ── All project risks (for formation detection — all statuses) ────────────────
export const fetchAllProjectRisks = (projectId) =>
  AxiosInstance.get('risks/', { params: { project: projectId } }).then(r => r.data)

// ── Project members ───────────────────────────────────────────────────────────
export const fetchProjectMembers = (projectId) =>
  AxiosInstance.get('risks/project-members/', { params: { project: projectId } }).then(r => r.data)

// ── All users from a given department ─────────────────────────────────────────
export const fetchDeptUsers = (dept) =>
  dept ? AxiosInstance.get(`users-by-dept/${dept}/`).then(r => r.data) : Promise.resolve([])

// ── Update the project's member list (add/remove) ─────────────────────────────
export const updateProjectMembers = (projectId, memberIds) =>
  AxiosInstance.patch(`projects/${projectId}/`, { membres: memberIds }).then(r => r.data)

// ── File upload (for plan_communication element_sortie) ───────────────────────
export const uploadATAttachment = (atId, file) => {
  const formData = new FormData()
  formData.append('file', file)
  return AxiosInstance.post(`${BASE}/${atId}/upload_attachment/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data)
}
  // ── Reunion compte rendu (file upload) ────────────────────────────────────────
export const saveReunion = (reunion) => {
  const hasFile = reunion.compte_rendu instanceof File

  if (hasFile) {
    const formData = new FormData()
    Object.entries(reunion).forEach(([key, val]) => {
      if (val !== null && val !== undefined) formData.append(key, val)
    })
    return AxiosInstance.patch(`at-reunions/${reunion.id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  } else {
    return AxiosInstance.patch(`at-reunions/${reunion.id}/`, reunion).then(r => r.data)
  }
}


