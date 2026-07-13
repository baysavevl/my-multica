export function withJsonHeaders(options = {}) {
  return {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  }
}

export async function requestJson(path, options = {}) {
  const response = await fetch(apiUrl(path), withJsonHeaders(options))
  const raw = await response.text()
  const body = raw ? JSON.parse(raw) : null
  if (!response.ok) {
    throw new Error(body?.message || `${response.status} ${response.statusText}`)
  }
  return body
}

function apiUrl(path) {
  const baseUrl = import.meta.env?.VITE_API_BASE_URL || ''
  return `${baseUrl}${path}`
}
