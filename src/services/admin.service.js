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
    return data
  },
}