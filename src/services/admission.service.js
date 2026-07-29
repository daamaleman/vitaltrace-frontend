import http from './http'

/**
 * Admission operations (AdmissionService, §11): people, patients,
 * relatives, activations, assignments and corrections.
 */
export const admissionService = {
  async patients(params = {}) {
    const { data } = await http.get('/admission/patients', { params })
    return data
  },

  async patient(patientId) {
    const { data } = await http.get(`/admission/patients/${patientId}`)
    return data.data
  },

  async createPatient(payload) {
    const { data } = await http.post('/admission/patients', payload)
    return data.data
  },

  async updatePatient(patientId, payload) {
    const { data } = await http.put(`/admission/patients/${patientId}`, payload)
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