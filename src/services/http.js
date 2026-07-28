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
const http = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/v1`,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

/**
 * Read a cookie value by name (used for the XSRF-TOKEN cookie).
 */
function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(^|;\\s*)${name}=([^;]*)`))
  return match ? decodeURIComponent(match[2]) : null
}

/**
 * Request interceptor: attach the CSRF token on every mutating request.
 */
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
  await axios.get(`${import.meta.env.VITE_API_URL}/sanctum/csrf-cookie`, {
    withCredentials: true,
  })
}

export default http