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

  async classifyAlert(alertId, payload) {
    const { data } = await http.post(`/alerts/${alertId}/classify`, payload)
    return data.data
  },

  async escalateAlert(alertId, payload) {
    const { data } = await http.post(`/alerts/${alertId}/escalate`, payload)
    return data.data
  },

  async closeAlert(alertId, payload) {
    const { data } = await http.post(`/alerts/${alertId}/close`, payload)
    return data.data
  },

  async appointments(params = {}) {
    const { data } = await http.get('/appointments', { params })
    return data
  },

  async diagnoses(params = {}) {
    const { data } = await http.get('/diagnoses', { params })
    return data
  },
}
