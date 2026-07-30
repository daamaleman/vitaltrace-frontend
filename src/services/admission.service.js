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

  async patientRelatives(patientId) {
    const { data } = await http.get(`/admission/patients/${patientId}/relatives`)
    return data.data
  },

  async addRelative(patientId, payload) {
    const { data } = await http.post(`/admission/patients/${patientId}/relatives`, payload)
    return data.data
  },

  async revokeRelative(linkId) {
    const { data } = await http.post(`/admission/relative-links/${linkId}/revoke`)
    return data.data
  },

  async assignments(params = {}) {
    const { data } = await http.get('/professional-assignments', { params })
    return data
  },

  async availableStaff() {
    const { data } = await http.get('/admission/staff')
    return data.data
  },

  async patientAssignments(patientId) {
    const { data } = await http.get(`/admission/patients/${patientId}/assignments`)
    return data.data
  },

  async createAssignment(patientId, payload) {
    const { data } = await http.post(`/admission/patients/${patientId}/assignments`, payload)
    return data.data
  },

  async finishAssignment(assignmentId, reason = null) {
    const { data } = await http.post(`/admission/assignments/${assignmentId}/finish`, { reason })
    return data.data
  },

  async corrections(params = {}) {
    const { data } = await http.get('/correction-requests', { params })
    return data
  },
}