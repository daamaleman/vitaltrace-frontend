/**
 * Map an API error (from the http.js interceptor) to a UI-friendly message.
 * Backend authorization is the source of truth; here we only present it (§12).
 */
export function mapHttpError(error) {
  const status = error?.status ?? null

  switch (status) {
    case 401:
      return 'Tu sesión ha expirado. Inicia sesión de nuevo.'
    case 403:
      return 'No tienes permiso para realizar esta acción.'
    case 404:
      return 'No se encontró el recurso solicitado.'
    case 409:
      return 'Esta acción entra en conflicto con el estado actual.'
    case 422:
      // Validation errors are shown per-field; this is the fallback text.
      return error?.message ?? 'Revisa los campos marcados.'
    case 500:
      return 'Ocurrió un error en el servidor. Intenta de nuevo más tarde.'
    default:
      return error?.message ?? 'Ocurrió un error de red. Intenta de nuevo.'
  }
}