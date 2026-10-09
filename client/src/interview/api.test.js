import { afterEach, expect, it, vi } from 'vitest'
import { request } from './api.js'

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
