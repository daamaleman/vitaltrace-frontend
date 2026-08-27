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

  // Roles
  async roles() {
    const { data } = await http.get('/roles')
    return data?.data?.data || data?.data || data || []
  },
}