import http from './http'

/**
 * Doctor operations (DoctorService, §11): assigned patients, alerts,
 * measurements, clinical follow-up and appointments.
 */
export const doctorService = {
  async alerts(params = {}) {
    const { data } = await http.get('/alerts', { params })
    return data
  },

  async alert(alertId) {
    const { data } = await http.get(`/alerts/${alertId}`)
    return data.data
  },

  async alertHistory(params = {}) {
    const { data } = await http.get('/alert-history', { params })
    return data
  },

  async classifyAlert(alertId, payload = {}) {
    const { data } = await http.post(`/alerts/${alertId}/classify`, payload)
    return data.data
  },

  async escalateAlert(alertId, payload = {}) {
    const { data } = await http.post(`/alerts/${alertId}/escalate`, payload)
    return data.data
  },

  async closeAlert(alertId, payload = {}) {
    const { data } = await http.post(`/alerts/${alertId}/close`, payload)
    return data.data
  },

  async patients(params = {}) {
    const { data } = await http.get('/clinical/patients', { params })
    return data
  },

  async patient(patientId) {
    const { data } = await http.get(`/clinical/patients/${patientId}`)
    return data.data
  },

  async patientSummary(patientId) {
    const { data } = await http.get(`/clinical/patients/${patientId}/summary`)
    return data.data
  },

  async appointments() {
    const { data } = await http.get('/clinical/appointments')
    return data.data
  },

  async diagnoses(params = {}) {
    const { data } = await http.get('/diagnoses', { params })
    return data
  },

  async addEvolution(patientId, payload) {
    const { data } = await http.post(`/clinical/patients/${patientId}/evolutions`, payload)
    return data.data
  },
}
