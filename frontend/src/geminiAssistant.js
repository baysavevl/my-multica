import { withJsonHeaders } from './apiClient.js'

export const GEMINI_ASSISTANT_HEADER = 'X-Multica-Control'
export const GEMINI_ASSISTANT_HEADER_VALUE = 'local-ui'

export const geminiModes = {
  explain: 'explain',
  review: 'review',
  nextPractice: 'next_practice'
}

const supportedModes = new Set(Object.values(geminiModes))
const MAX_TEXT_LENGTH = 4000
const REQUEST_TIMEOUT_MS = 8000

export function validateGeminiAskInput(input = {}) {
  const errors = []
  if (!input.topicId?.trim()) {
    errors.push('Choose a Multica topic.')
  }
  if (!supportedModes.has(input.mode)) {
    errors.push('Choose a supported Gemini mode.')
  }
  if ((input.question || '').length > MAX_TEXT_LENGTH) {
    errors.push('Question is too long.')
  }
  if ((input.answer || '').length > MAX_TEXT_LENGTH) {
    errors.push('Answer is too long.')
  }
  return errors
}

export async function geminiSetupRequest() {
  return geminiRequest('/api/gemini/setup')
}

export async function askGemini(input) {
  const errors = validateGeminiAskInput(input)
  if (errors.length > 0) {
    throw new Error(errors.join(' '))
  }
  return geminiRequest('/api/gemini/ask', {
    method: 'POST',
    body: JSON.stringify({
      topicId: input.topicId.trim(),
      mode: input.mode,
      question: (input.question || '').trim(),
      answer: (input.answer || '').trim()
    })
  })
}

async function geminiRequest(path, options = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  let response
  try {
    response = await fetch(path, withJsonHeaders({
      ...options,
      signal: controller.signal,
      headers: {
        ...(options.headers || {}),
        [GEMINI_ASSISTANT_HEADER]: GEMINI_ASSISTANT_HEADER_VALUE
      }
    }))
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('Local Gemini bridge did not respond within 8 seconds. Start this project backend or set VITE_API_BASE_URL to it.')
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }

  const raw = await response.text()
  let body = null
  try {
    body = raw ? JSON.parse(raw) : null
  } catch {
    throw new Error('Local Gemini bridge is not returning JSON. Run the Spring bridge locally or configure VITE_API_BASE_URL to point at it.')
  }
  if (!response.ok) {
    const error = new Error(body?.message || `${response.status} ${response.statusText}`)
    error.body = body
    throw error
  }
  return body
}
