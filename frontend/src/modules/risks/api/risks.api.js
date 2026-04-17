import AxiosInstance from '../../../components/AxiosInstance'

export const getRisks = async (project) => {
  const { data } = await AxiosInstance.get('risks/', { params: { project } })
  return data
}

export const createRisk = async (payload) => {
  const { data } = await AxiosInstance.post('risks/', payload)
  return data
}

export const updateRisk = async (id, payload) => {
  const { data } = await AxiosInstance.patch(`risks/${id}/`, payload)
  return data
}

export const deleteRisk = async (id) => AxiosInstance.delete(`risks/${id}/`)

export const upsertEvaluation = async (id, payload) => {
  const { data } = await AxiosInstance.put(`risks/${id}/evaluation/`, payload)
  return data
}

export const upsertActionPlan = async (id, payload) => {
  const { data } = await AxiosInstance.put(`risks/${id}/action-plan/`, payload)
  return data
}

export const upsertResidual = async (id, payload) => {
  const { data } = await AxiosInstance.put(`risks/${id}/residual/`, payload)
  return data
}

export const getRiskFull = async (id) => {
  const { data } = await AxiosInstance.get(`risks/${id}/full/`)
  return data
}

export const getRiskDashboard = async (project) => {
  const { data } = await AxiosInstance.get('risks/dashboard/', { params: { project } })
  return data
}

export const getProjectMembers = async (project) => {
  const { data } = await AxiosInstance.get('risks/project-members/', { params: { project } })
  return data
}

export const getActionPlans = async (project) => {
  const { data } = await AxiosInstance.get('action-plans/', { params: { project } })
  return data
}

export const patchActionPlan = async (id, payload) => {
  const { data } = await AxiosInstance.patch(`action-plans/${id}/`, payload)
  return data
}

export const getRiskAuditLogs = async (riskId, params = {}) => {
  const { data } = await AxiosInstance.get(`risks/${riskId}/audit-logs/`, { params })
  return data
}

export const bulkFromGuide = async (payload) => {
  const { data } = await AxiosInstance.post('risks/bulk-from-guide/', payload)
  return data
}
