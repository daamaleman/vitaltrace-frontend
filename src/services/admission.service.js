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

  async patientsWithTeam() {
    const patients = await this.patients()
    const list = Array.isArray(patients) ? patients : (patients?.data ?? [])
    const withTeam = await Promise.all(
      list.map(async (patient) => {
        try {
          const assignments = await this.patientAssignments(patient.id)
          return { ...patient, assignments: assignments ?? [] }
        } catch {
          return { ...patient, assignments: [] }
        }
      }),
    )
    return withTeam
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
    const { data } = await http.get('/admission/corrections', { params })
    return data.data
  },

  async approveCorrection(id, response = null) {
    const { data } = await http.post(`/admission/corrections/${id}/approve`, { response })
    return data.data
  },

  async rejectCorrection(id, response) {
    const { data } = await http.post(`/admission/corrections/${id}/reject`, { response })
    return data.data
  },

  async accounts() {
    const { data } = await http.get('/admission/accounts')
    return data.data
  },

  async peopleWithoutAccount() {
    const { data } = await http.get('/admission/accounts/available-people')
    return data.data
  },

  async createAccount(payload) {
    const { data } = await http.post('/admission/accounts', payload)
    return data.data
  },

  async resendCode(userId) {
    const { data } = await http.post(`/admission/accounts/${userId}/resend`)
    return data
  },

  async blockAccount(userId) {
    const { data } = await http.post(`/admission/accounts/${userId}/block`)
    return data.data
  },

  async unblockAccount(userId) {
    const { data } = await http.post(`/admission/accounts/${userId}/unblock`)
    return data.data
  },

  async appointments(params = {}) {
    const { data } = await http.get('/admission/appointments', { params })
    return data.data
  },
  async createAppointment(payload) {
    const { data } = await http.post('/admission/appointments', payload)
    return data.data
  },
  async rescheduleAppointment(appointmentId, payload) {
    const { data } = await http.put(`/admission/appointments/${appointmentId}`, payload)
    return data.data
  },
  async setAppointmentStatus(appointmentId, status) {
    const { data } = await http.post(`/admission/appointments/${appointmentId}/status`, { status })
    return data.data
  },
}