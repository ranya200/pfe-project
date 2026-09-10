import AxiosInstance from '../../../components/AxiosInstance'

const BASE = 'projects'

export const analyzeProjectRisk = (projectId) =>
  AxiosInstance.post(`${BASE}/${projectId}/analyze/`).then(r => r.data)

export const getProjectRiskResult = (projectId) =>
  AxiosInstance.get(`${BASE}/${projectId}/result/`).then(r => r.data)

export const getProjectRiskHistory = (projectId) =>
  AxiosInstance.get(`${BASE}/${projectId}/history/`).then(r => r.data)

export const getProjectAlerts = (projectId) =>
  AxiosInstance.get(`${BASE}/${projectId}/alerts/`).then(r => r.data)

export const acknowledgeAlert = (alertId) =>
  AxiosInstance.post(`ai/alerts/${alertId}/acknowledge/`).then(r => r.data)