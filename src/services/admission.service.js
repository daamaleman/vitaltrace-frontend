import http from './http'

/**
 * Admission operations (AdmissionService, §11): people, patients,
 * relatives, activations, assignments and corrections.
 */
export const admissionService = {
  async patients(params = {}) {
    const { data } = await http.get('/patients', { params })
    return data
  },

  async createPatient(payload) {
    const { data } = await http.post('/patients', payload)
    return data.data
  },

  async relatives(params = {}) {
    const { data } = await http.get('/relatives', { params })
    return data
  },

  async assignments(params = {}) {
    const { data } = await http.get('/professional-assignments', { params })
    return data
  },

  async corrections(params = {}) {
    const { data } = await http.get('/correction-requests', { params })
    return data
  },
}