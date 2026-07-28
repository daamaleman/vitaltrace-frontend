/**
 * Map an API error (from the http.js interceptor) to a UI-friendly message.
 * Backend authorization is the source of truth; here we only present it (§12).
 */
export function mapHttpError(error) {
  const status = error?.status ?? null

  switch (status) {
    case 401:
      return 'Your session has expired. Please sign in again.'
    case 403:
      return 'You do not have permission to perform this action.'
    case 404:
      return 'The requested resource was not found.'
    case 409:
      return 'This action conflicts with the current state.'
    case 422:
      // Validation errors are shown per-field; this is the fallback text.
      return error?.message ?? 'Please review the highlighted fields.'
    case 500:
      return 'A server error occurred. Please try again later.'
    default:
      return error?.message ?? 'A network error occurred. Please retry.'
  }
}