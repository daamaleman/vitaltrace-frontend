import http from './http'

/**
 * Admin panel API calls (users, audit, catalogs, roles).
 */
export const adminService = {
  // Users
  async users(params = {}) {
    const { data } = await http.get('/admin/users', { params })
    return data.data
  },
  async blockUser(userId) {
    const { data } = await http.post(`/admin/users/${userId}/block`)
    return data.data
  },
  async unblockUser(userId) {
    const { data } = await http.post(`/admin/users/${userId}/unblock`)
    return data.data
  },

  async userRoles(userId) {
    const { data } = await http.get(`/admin/users/${userId}/roles`)
    return data?.data?.data || data?.data || data || []
  },

  async assignRole(userId, roleId) {
    const { data } = await http.post(`/admin/users/${userId}/roles`, { role_id: roleId })
    return data
  },

  async revokeRole(userId, roleId) {
    const { data } = await http.delete(`/admin/users/${userId}/roles/${roleId}`)
    return data
  },

  // Audit logs
  async auditLogs() {
    const { data } = await http.get('/audit-logs')
    return data?.data?.data || data?.data || data || []
  },

  // Catalogs
  async specialties() {
    const { data } = await http.get('/specialties')
    return data?.data?.data || data?.data || data || []
  },
  async medications() {
    const { data } = await http.get('/medications')
    return data?.data?.data || data?.data || data || []
  },
  async measurementTypes() {
    const { data } = await http.get('/measurement-types')
    return data?.data?.data || data?.data || data || []
  },

  // Specialties CRUD
  async createSpecialty(payload) {
    const { data } = await http.post('/specialties', payload)
    return data.data
  },
  async updateSpecialty(id, payload) {
    const { data } = await http.put(`/specialties/${id}`, payload)
    return data.data
  },

  // Medications CRUD
  async createMedication(payload) {
    const { data } = await http.post('/medications', payload)
    return data.data
  },
  async updateMedication(id, payload) {
    const { data } = await http.put(`/medications/${id}`, payload)
    return data.data
  },

  // Measurement types CRUD
  async createMeasurementType(payload) {
    const { data } = await http.post('/measurement-types', payload)
    return data.data
  },
  async updateMeasurementType(id, payload) {
    const { data } = await http.put(`/measurement-types/${id}`, payload)
    return data.data
  },

  // Roles
  async roles() {
    const { data } = await http.get('/roles')
    return data?.data?.data || data?.data || data || []
  },

  // Professionals / health staff
  async healthStaff(params = {}) {
    const { data } = await http.get('/health-staff', { params })
    return data?.data?.data || data?.data || data || []
  },
  async registerProfessional(payload) {
    const { data } = await http.post('/admin/professionals/register', payload)
    return data.data
  },
}