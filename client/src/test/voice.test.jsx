import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, afterEach, it, expect, vi } from 'vitest'
import VoiceAnswer from '../components/VoiceAnswer.jsx'
import { AuthContext } from '../auth/context.js'
import { recordAnswer, voiceSupported } from '../voice/recording.js'
vi.mock('../voice/recording.js', () => ({ recordAnswer: vi.fn(), voiceSupported: vi.fn() }))
let hooks, stop, cancel, api, confirm
beforeEach(() => {
  hooks = null; stop = vi.fn(() => hooks.onFinish(new Blob(['audio']))); cancel = vi.fn()
  voiceSupported.mockReturnValue(true)
  recordAnswer.mockImplementation(async options => { hooks = options; return { stop, cancel } })
  api = { config: vi.fn().mockResolvedValue({ voiceMode: 'mock' }), transcribe: vi.fn().mockResolvedValue({ transcript: 'Sample transcript', mode: 'mock' }) }
  confirm = vi.fn()
  vi.stubGlobal('URL', class extends URL { static createObjectURL = vi.fn(() => 'blob:test'); static revokeObjectURL = vi.fn() })
})
afterEach(() => vi.unstubAllGlobals())
function mount(extra = {}) {
  return render(<AuthContext.Provider value={{ api }}><VoiceAnswer interviewId="interview" question={{ id: 'q1', text: 'Explain SQL' }} onConfirm={confirm} onDirty={() => {}} answerLength={0} {...extra} /></AuthContext.Provider>)
}
async function begin(user) {
  await user.click(screen.getByRole('button', { name: 'Answer by voice' }))
  await user.click(screen.getByRole('checkbox'))
  await user.click(screen.getByRole('button', { name: 'Start recording' }))
  await screen.findByRole('button', { name: 'Stop recording' })
}
it('requires consent, edits before confirmation, and does not submit audio automatically', async () => {
  mount(); const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Answer by voice' }))
  expect(screen.getByRole('button', { name: 'Start recording' })).toBeDisabled()
  await user.click(screen.getByRole('checkbox')); await user.click(screen.getByRole('button', { name: 'Start recording' }))
  await user.click(await screen.findByRole('button', { name: 'Stop recording' }))
  expect(api.transcribe).not.toHaveBeenCalled()
  await user.click(screen.getByRole('button', { name: 'Transcribe recording' }))
  const transcript = await screen.findByLabelText(/Review and edit transcript/)
  expect(confirm).not.toHaveBeenCalled()
  fireEvent.change(transcript, { target: { value: 'Corrected answer' } })
  await user.click(screen.getByRole('button', { name: 'Confirm transcript' }))
  expect(confirm).toHaveBeenCalledWith('Corrected answer')
})
it('handles unsupported recording and permission denial', async () => {
  voiceSupported.mockReturnValue(false); const view = mount(); const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Answer by voice' }))
  expect(screen.getByText(/Recording is unsupported/)).toBeInTheDocument(); view.unmount()
  voiceSupported.mockReturnValue(true)
  recordAnswer.mockImplementation(async options => { options.onError('Microphone permission was denied.'); return null })
  mount(); await user.click(screen.getByRole('button', { name: 'Answer by voice' })); await user.click(screen.getByRole('checkbox')); await user.click(screen.getByRole('button', { name: 'Start recording' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('permission was denied')
})
it('stops recording on lost focus and cancels capture on unmount', async () => {
  const view = mount(); await begin(userEvent.setup())
  act(() => window.dispatchEvent(new Event('blur')))
  expect(stop).toHaveBeenCalledOnce()
  view.unmount(); expect(cancel).toHaveBeenCalled(); expect(hooks.signal.aborted).toBe(true)
})
it('keeps the recording and same request ID on retry without changing the typed answer', async () => {
  api.transcribe.mockRejectedValueOnce(new Error('Network unavailable'))
  mount(); const user = userEvent.setup(); await begin(user)
  await user.click(screen.getByRole('button', { name: 'Stop recording' }))
  await user.click(screen.getByRole('button', { name: 'Transcribe recording' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Network unavailable')
  await user.click(screen.getByRole('button', { name: 'Retry transcription' }))
  await screen.findByLabelText(/Review and edit transcript/)
  expect(api.transcribe.mock.calls[0][2]).toBe(api.transcribe.mock.calls[1][2]); expect(confirm).not.toHaveBeenCalled()
})
it('ignores a late transcript after discarding and enforces combined answer length', async () => {
  let resolve
  api.transcribe.mockImplementationOnce(() => new Promise(done => { resolve = done }))
  mount({ answerLength: 2999 }); const user = userEvent.setup(); await begin(user)
  await user.click(screen.getByRole('button', { name: 'Stop recording' })); await user.click(screen.getByRole('button', { name: 'Transcribe recording' }))
  await user.click(screen.getByRole('button', { name: 'Discard voice draft' }))
  await act(async () => resolve({ transcript: 'Late result', mode: 'mock' }))
  expect(screen.queryByLabelText(/Review and edit transcript/)).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Start recording' })); await user.click(await screen.findByRole('button', { name: 'Stop recording' })); await user.click(screen.getByRole('button', { name: 'Transcribe recording' }))
  await waitFor(() => expect(screen.getByRole('button', { name: 'Confirm transcript' })).toBeDisabled())
})
