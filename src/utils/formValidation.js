const EMOJI_PATTERN = /(?:[\u2700-\u27BF]|[\u{1F300}-\u{1FAFF}]|\uFE0F|\u200D)/gu
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g

function stripEmojis(value = '') {
  return String(value).replace(EMOJI_PATTERN, '')
}

function clampLength(value = '', maxLength) {
  if (!Number.isFinite(Number(maxLength)) || Number(maxLength) <= 0) {
    return value
  }

  return String(value).slice(0, Number(maxLength))
}

export function containsEmoji(value = '') {
  return EMOJI_PATTERN.test(String(value ?? ''))
}

export function hasUnsupportedCharacters(value = '', kind = 'text') {
  const text = String(value ?? '')

  if (!text) return false

  switch (kind) {
    case 'name':
      return /\d|[^A-Za-zÁÉÍÓÚáéíóúÜüÑñÀÈÌÒÙàèìòùÇçÄËÏÖÜäëïöü' .-]/.test(text)
    case 'phone':
      return /\D/.test(text)
    case 'email':
      return /\s/.test(text) || /[\u{1F300}-\u{1FAFF}]/u.test(text)
    case 'number':
      return /[^0-9.-]/.test(text)
    default:
      return /(?:[\u2700-\u27BF]|[\u{1F300}-\u{1FAFF}]|\uFE0F|\u200D)/u.test(text)
  }
}

export function getFieldValidationMessage(kind = 'text', label = 'Campo') {
  const fieldLabel = label || 'Campo'

  switch (kind) {
    case 'name':
      return `${fieldLabel} solo admite letras, espacios, acentos y signos básicos.`
    case 'phone':
      return `${fieldLabel} solo puede contener números.`
    case 'email':
      return `${fieldLabel} no puede contener espacios ni emojis.`
    case 'number':
      return `${fieldLabel} solo puede contener números.`
    default:
      return `${fieldLabel} no admite emojis ni caracteres no válidos.`
  }
}

export function sanitizeName(value = '', maxLength = 150) {
  let nextValue = stripEmojis(String(value ?? ''))
  nextValue = nextValue.replace(CONTROL_CHARACTERS, '')
  nextValue = nextValue.replace(/\d/g, '')
  nextValue = nextValue.replace(/[^A-Za-zÁÉÍÓÚáéíóúÜüÑñÀÈÌÒÙàèìòùÇçÄËÏÖÜäëïöü' .-]/g, '')
  nextValue = nextValue.replace(/\s{2,}/g, ' ')
  return clampLength(nextValue.trimStart(), maxLength)
}

export function sanitizePhone(value = '') {
  const nextValue = stripEmojis(String(value ?? '')).replace(CONTROL_CHARACTERS, '')
  return clampLength(nextValue.replace(/\D/g, ''), 15)
}

export function sanitizeEmail(value = '', maxLength = 254) {
  const nextValue = stripEmojis(String(value ?? '')).replace(CONTROL_CHARACTERS, '').replace(/\s+/g, '')
  return clampLength(nextValue, maxLength)
}

export function sanitizeNumber(value = '') {
  const nextValue = stripEmojis(String(value ?? '')).replace(CONTROL_CHARACTERS, '')
  return nextValue.replace(/[^0-9.-]/g, '')
}

export function sanitizeText(value = '', maxLength) {
  const nextValue = stripEmojis(String(value ?? '')).replace(CONTROL_CHARACTERS, '')
  return clampLength(nextValue, maxLength)
}

export function sanitizeFieldValue(value, { kind = 'text', maxLength } = {}) {
  switch (kind) {
    case 'name':
      return sanitizeName(value, maxLength ?? 150)
    case 'phone':
      return sanitizePhone(value)
    case 'email':
      return sanitizeEmail(value, maxLength ?? 254)
    case 'number':
      return sanitizeNumber(value)
    default:
      return sanitizeText(value, maxLength)
  }
}

export function blockInvalidPaste(event, kind = 'text', maxLength = undefined) {
  const paste = event.clipboardData?.getData('text/plain') ?? ''

  if (!paste) return

  const sanitizedPaste = sanitizeFieldValue(paste, { kind, maxLength })
  if (sanitizedPaste !== paste) {
    event.preventDefault()
  }
}
