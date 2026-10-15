const API_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001/api/v1').replace(/\/$/, '')

export class RequestError extends Error {
  constructor(message, code) { super(message); this.code = code }
}

export async function request(path, { method = 'GET', body, token, raw, download = false, timeout = 10000 } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method, signal: controller.signal,
      headers: { ...(raw ? { 'Content-Type': 'application/octet-stream' } : body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      ...(raw ? { body: raw } : body ? { body: JSON.stringify(body) } : {}),
      credentials: 'omit',
    })
    if (download && response.ok) return response.blob()
    const payload = await response.json()
    if (response.status === 401) throw new RequestError('Your session expired. Sign out and sign in again. Saved answers are safe; copy unsaved edits before signing out.', 'AUTH_REQUIRED')
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

export function createInterviewApi(getToken) {
  async function authorizedRequest(path, options = {}) {
    let token
    try { token = await getToken() }
    catch { throw new RequestError("Could not refresh your session. Retry, or sign in again; copy unsaved edits before signing out.", "AUTH_REQUIRED") }
    if (!token) throw new RequestError("Sign in again to continue. Copy unsaved edits before signing out.", "AUTH_REQUIRED")
    return request(path, { ...options, token })
  }
  return {
  resumes: () => authorizedRequest('/resumes'),
  uploadResume: file => authorizedRequest('/resumes?filename=' + encodeURIComponent(file.name), { method: 'POST', raw: file, timeout: 20000 }),
  removeResume: id => authorizedRequest('/resumes/' + id, { method: 'DELETE' }),
  downloadResume: async id => { const link = await authorizedRequest('/resumes/' + id + '/link', { method: 'POST' }); return authorizedRequest(link.path, { download: true }) },
  config: () => authorizedRequest('/ai-config'),
  followup: (id, questionId, revision) => authorizedRequest(`/interviews/${id}/followups`, { method: 'POST', timeout: 60000, body: { questionId, revision } }),
  report: id => authorizedRequest(`/interviews/${id}/report`, { method: 'POST', timeout: 60000, body: {} }),
  history: (skip = 0) => authorizedRequest('/interviews?skip=' + skip),
  read: id => authorizedRequest('/interviews/' + id),
  remove: id => authorizedRequest('/interviews/' + id, { method: 'DELETE' }),
  save: (id, answers, revision) => authorizedRequest('/interviews/' + id + '/answers', { method: 'PUT', body: { revision, answers: Object.entries(answers).filter(([, text]) => text.trim()).map(([questionId, text]) => ({ questionId, text })) } }),
  start: (requestId, preferences) => authorizedRequest('/interviews', { method: 'POST', timeout: 60000, body: { requestId, preferences } }),
  complete: (id, answers, revision) => authorizedRequest(`/interviews/${id}/complete`, {
    method: 'POST',
    body: { revision, answers: Object.entries(answers).map(([questionId, text]) => ({ questionId, text })) },
  }),
}

}

// Tests may mock this object; the application creates a token-bound API per account.
export const interviewApi = createInterviewApi(async () => null)
