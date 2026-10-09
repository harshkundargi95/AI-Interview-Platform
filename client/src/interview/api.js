const API_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001/api/v1').replace(/\/$/, '')

export class RequestError extends Error {
  constructor(message, code) { super(message); this.code = code }
}

export async function request(path, { method = 'GET', body } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10000)
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method, signal: controller.signal,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      ...(body ? { body: JSON.stringify(body) } : {}),
      credentials: 'omit',
    })
    const payload = await response.json()
    if (!response.ok) throw new RequestError(payload.error?.message || 'The server could not process the request.', payload.error?.code)
    if (!payload.data) throw new RequestError('The server returned an unexpected response. Please retry.', 'INVALID_RESPONSE')
    return payload.data
  } catch (error) {
    if (error instanceof RequestError) throw error
    if (error.name === 'AbortError') throw new RequestError('The server took too long. Your answers are still here. Retry the request.', 'TIMEOUT')
    throw new RequestError('Cannot reach the local server. Check that it is running on port 3001, then retry. Your draft has not been cleared.', 'NETWORK_ERROR')
  } finally {
    clearTimeout(timer)
  }
}

export const interviewApi = {
  history: (skip = 0) => request('/interviews?skip=' + skip),
  read: id => request('/interviews/' + id),
  remove: id => request('/interviews/' + id, { method: 'DELETE' }),
  save: (id, answers, revision) => request('/interviews/' + id + '/answers', { method: 'PUT', body: { revision, answers: Object.entries(answers).filter(([, text]) => text.trim()).map(([questionId, text]) => ({ questionId, text })) } }),
  start: (requestId, preferences) => request('/interviews', { method: 'POST', body: { requestId, preferences } }),
  complete: (id, answers, revision) => request(`/interviews/${id}/complete`, {
    method: 'POST',
    body: { revision, answers: Object.entries(answers).map(([questionId, text]) => ({ questionId, text })) },
  }),
}
