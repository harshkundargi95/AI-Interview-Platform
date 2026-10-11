import { afterEach, expect, it, vi } from 'vitest'
import { request, createInterviewApi } from './api.js'

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers() })
it('sends JSON to the real configured API path without credentials', async () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { status: 'ok' } }) })
  vi.stubGlobal('fetch', fetchMock)
  await expect(request('/health')).resolves.toEqual({ status: 'ok' })
  expect(fetchMock.mock.calls[0][0]).toBe('http://127.0.0.1:3001/api/v1/health')
  expect(fetchMock.mock.calls[0][1].credentials).toBe('omit')
})
it('handles HTTP errors and network outages', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: { code: 'INTERVIEW_NOT_FOUND', message: 'Session expired.' } }) }))
  await expect(request('/interviews/missing')).rejects.toMatchObject({ code: 'INTERVIEW_NOT_FOUND', message: 'Session expired.' })
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
  await expect(request('/health')).rejects.toMatchObject({ code: 'NETWORK_ERROR' })
})
it('aborts a stalled request after ten seconds', async () => {
  vi.useFakeTimers()
  vi.stubGlobal('fetch', vi.fn((url, { signal }) => new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))))))
  const result = expect(request('/health')).rejects.toMatchObject({ code: 'TIMEOUT' })
  await vi.advanceTimersByTimeAsync(10000)
  await result
})

it('adds a fresh bearer token to account requests and never includes cookies', async () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { items: [] } }) })
  vi.stubGlobal('fetch', fetchMock)
  const token = vi.fn().mockResolvedValue('ephemeral-session-token')
  const api = createInterviewApi(token)
  await api.history()
  expect(token).toHaveBeenCalledOnce()
  expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer ephemeral-session-token')
  expect(fetchMock.mock.calls[0][1].credentials).toBe('omit')
})
it('fails closed without a token and treats an API 401 as reauthentication', async () => {
  const fetchMock = vi.fn().mockResolvedValue({ status: 401, ok: false, json: async () => ({ error: { message: 'Expired' } }) })
  vi.stubGlobal('fetch', fetchMock)
  await expect(createInterviewApi(async () => null).history()).rejects.toMatchObject({ code: 'AUTH_REQUIRED' })
  expect(fetchMock).not.toHaveBeenCalled()
  await expect(createInterviewApi(async () => 'expired-token').history()).rejects.toMatchObject({ code: 'AUTH_REQUIRED' })
  expect(fetchMock).toHaveBeenCalledOnce()
})
