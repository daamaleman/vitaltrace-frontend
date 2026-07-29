import axios from 'axios'
import { useAuthStore } from '@/stores/auth.store'

/**
 * Central Axios instance for the VitalTrace API.
 *
 * - baseURL points to the Laravel backend (VITE_API_URL).
 * - withCredentials sends the Sanctum session cookie across subdomains.
 * - The XSRF token is read from the cookie and sent back as a header,
 *   which is how Laravel Sanctum validates stateful SPA requests.
 */

/**
 * In development, Vite proxies /api and /sanctum to the backend, so we use
 * relative paths (same-origin). In production, the SPA is served from
 * app.vitaltrace.lat and talks to api.vitaltrace.lat directly.
 */
const API_BASE = import.meta.env.DEV ? '' : import.meta.env.VITE_API_URL

const http = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status ?? null
    const payload = error.response?.data ?? null

    // Session expired or invalid: clear local session state.
    if (status === 401) {
      const authStore = useAuthStore()
      authStore.clearSession()
    }

    return Promise.reject({
      status,
      message: payload?.message ?? 'Unexpected error.',
      errors: payload?.errors ?? null,
      original: error,
    })
  },
)

/**
 * Response interceptor: normalize errors so the UI can react by status.
 * The auth store handles the 401 side effect (session cleanup); here we
 * only pass a predictable error shape downstream.
 */
http.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status ?? null
    const payload = error.response?.data ?? null

    return Promise.reject({
      status,
      message: payload?.message ?? 'Unexpected error.',
      errors: payload?.errors ?? null,
      original: error,
    })
  },
)

/**
 * Request the CSRF cookie before authentication or any mutating flow.
 * This hits the root Sanctum route, not the versioned API.
 */
export async function initCsrf() {
  const base = import.meta.env.DEV ? '' : import.meta.env.VITE_API_URL
  await axios.get(`${base}/sanctum/csrf-cookie`, {
    withCredentials: true,
  })
}

export default http