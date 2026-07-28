import http from './http'

/**
 * Admin operations (AdminService, §11): users, roles, permissions,
 * audit, configuration and logs.
 */
export const adminService = {
  async users(params = {}) {
    const { data } = await http.get('/users', { params })
    return data
  },

  async roles(params = {}) {
    const { data } = await http.get('/roles', { params })
    return data
  },

  async auditLogs(params = {}) {
    const { data } = await http.get('/audit-logs', { params })
    return data
  },
}
