import { useEffect, useRef, useState } from 'react'
import { useAuthState } from '../auth/context.js'
import { recordAnswer, voiceSupported } from '../voice/recording.js'
import { TRANSCRIPT_LIMIT, VOICE_SECONDS } from '../../../shared/voice.js'

export default function VoiceAnswer({ interviewId, question, onConfirm, onDirty, disabled, answerLength, stopRef }) {
  const { api } = useAuthState()
  const [open, setOpen] = useState(false), [mode, setMode] = useState(api?.config ? null : 'disabled'), [consent, setConsent] = useState(false)
  const [stage, setStage] = useState('idle'), [seconds, setSeconds] = useState(0), [clip, setClip] = useState(null), [url, setUrl] = useState('')
  const [transcript, setTranscript] = useState(''), [message, setMessage] = useState(''), [voices, setVoices] = useState([])
  const resources = useRef({ recorder: null, controller: null, generation: 0 }), requestId = useRef(null), audioRef = useRef(null)
  const dirty = ['permission', 'recording', 'ready', 'sending', 'review'].includes(stage)
  useEffect(() => { onDirty(dirty); return () => onDirty(false) }, [dirty, onDirty])
  useEffect(() => {
    if (!open) return
    let active = true
    api?.config?.().then(config => { if (active) setMode(config.voiceMode || 'disabled') }).catch(() => { if (active) setMode('unavailable') })
    return () => { active = false }
  }, [open, api])
  useEffect(() => () => { if (url) URL.revokeObjectURL(url) }, [url])
  useEffect(() => {
    const synth = window.speechSynthesis
    const load = () => setVoices(synth?.getVoices().filter(voice => voice.localService) || [])
    load(); synth?.addEventListener('voiceschanged', load)
    const owned = resources.current
    return () => { synth?.removeEventListener('voiceschanged', load); synth?.cancel(); owned.generation++; owned.controller?.abort(); owned.recorder?.cancel() }
  }, [])
  useEffect(() => {
    const hidden = () => {
      window.speechSynthesis?.cancel(); audioRef.current?.pause()
      if (stage === 'recording') resources.current.recorder?.stop()
      else if (stage === 'permission') { resources.current.controller?.abort(); setStage('idle'); setMessage('Microphone request cancelled when this page lost focus.') }
    }
    if (stopRef) stopRef.current = hidden
    const visibility = () => { if (document.hidden) hidden() }
    window.addEventListener('blur', hidden); document.addEventListener('visibilitychange', visibility); window.addEventListener('pagehide', hidden)
    return () => { if (stopRef) stopRef.current = null; window.removeEventListener('blur', hidden); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('pagehide', hidden) }
  }, [stage, stopRef])
  async function start() {
    if (disabled || !consent || !['live', 'mock'].includes(mode) || !voiceSupported()) return
    window.speechSynthesis?.cancel(); setMessage(''); setSeconds(0); setStage('permission')
    const abort = new AbortController(); resources.current.controller = abort
    const current = ++resources.current.generation
    const handle = await recordAnswer({ signal: abort.signal, onTime: setSeconds,
      onFinish: blob => { if (current !== resources.current.generation) return; setClip(blob); setUrl(URL.createObjectURL(blob)); requestId.current = crypto.randomUUID(); setStage('ready') },
      onError: error => { if (current !== resources.current.generation) return; setMessage(error); setStage('idle') },
    })
    if (handle && !abort.signal.aborted && current === resources.current.generation) { resources.current.recorder = handle; setStage('recording') }
  }
  function discard() {
    resources.current.generation++; resources.current.controller?.abort(); resources.current.recorder?.cancel(); resources.current.recorder = null
    setClip(null); setUrl(''); setTranscript(''); setStage('idle'); setMessage(''); requestId.current = null
  }
  async function transcribe() {
    const current = ++resources.current.generation
    setStage('sending'); setMessage('')
    try {
      const result = await api.transcribe(interviewId, question.id, requestId.current, clip)
      if (current !== resources.current.generation) return
      setTranscript(result.transcript); setMode(result.mode); setClip(null); setUrl(''); setStage('review')
    } catch (error) { if (current === resources.current.generation) { setMessage(error.message); setStage('ready') } }
  }
  const tooLong = answerLength + (answerLength ? 2 : 0) + transcript.length > TRANSCRIPT_LIMIT
  function readQuestion() {
    window.speechSynthesis.cancel()
    const speech = new SpeechSynthesisUtterance(question.text)
    speech.voice = voices.find(voice => voice.lang.startsWith('en')) || voices[0]
    window.speechSynthesis.speak(speech)
  }
  return <section className="voice-panel" aria-label="Optional voice answer">
    <div className="voice-heading"><div><span className="badge">Optional voice</span><h3>Speak it. Then make it yours.</h3></div><button type="button" className="button button-secondary" disabled={disabled || dirty} onClick={() => setOpen(!open)}>{open ? 'Hide voice options' : 'Answer by voice'}</button></div>
    <div className="actions"><button type="button" className="button button-text" disabled={!voices.length || dirty || disabled} onClick={readQuestion}>Read question aloud</button><button type="button" className="button button-text" onClick={() => window.speechSynthesis?.cancel()}>Stop playback</button></div>
    {!voices.length && <p className="small-note">Question playback needs an available on-device browser voice.</p>}
    {open && <>
      <p className="small-note">{mode === 'live' ? 'Live Gemini transcription. Only the recording is sent to Google when you choose Transcribe.' : mode === 'mock' ? 'Mock voice mode: a sample transcript is returned. No speech recognition or Google call occurs.' : mode === 'disabled' || mode === 'unavailable' ? 'Voice service is unavailable. You can still type below.' : 'Checking voice service…'}</p>
      <p className="small-note">Up to {VOICE_SECONDS} seconds / 2 MB. Audio stays in memory and is not saved to our database or file storage. Google handles live audio under its API data terms. Confirmed text follows normal answer saving. Transcription can be wrong; correct it before use. Voice characteristics are not scored.</p>
      {!voiceSupported() && <p role="status">Recording is unsupported here. Use a compatible browser on localhost or HTTPS, or type below.</p>}
      <label className="voice-consent"><input type="checkbox" checked={consent} disabled={dirty || disabled} onChange={event => setConsent(event.target.checked)} />I consent to recording and, in live mode, sending this audio to Google for transcription.</label>
      {stage === 'idle' && <button type="button" className="button button-secondary" disabled={disabled || !consent || !voiceSupported() || !['live', 'mock'].includes(mode)} onClick={start}>Start recording</button>}
      {stage === 'permission' && <p role="status">Waiting for microphone permission…</p>}
      {stage === 'recording' && <div className="voice-recording"><span className="voice-dot" aria-hidden="true" /><strong role="status">Recording · {seconds}s / {VOICE_SECONDS}s</strong><button type="button" className="button button-primary" onClick={() => resources.current.recorder?.stop()}>Stop recording</button></div>}
      {clip && url && <audio ref={audioRef} controls src={url} aria-label="Review your recording" />}
      {stage === 'ready' && <button type="button" className="button button-primary" disabled={disabled} onClick={transcribe}>{message ? 'Retry transcription' : 'Transcribe recording'}</button>}
      {stage === 'sending' && <p role="status">Transcribing… Your typed answer is unchanged.</p>}
      {stage === 'review' && <div className="voice-review"><label htmlFor="voice-transcript">Review and edit transcript {mode === 'mock' ? '(mock example)' : '(Gemini)'}</label><textarea id="voice-transcript" value={transcript} maxLength={TRANSCRIPT_LIMIT} rows={5} onChange={event => setTranscript(event.target.value)} /><p className="small-note">Confirming appends this text to your answer below. Nothing is submitted automatically.</p>{tooLong && <p role="alert">Your answer and transcript exceed 3,000 characters. Shorten either before confirming.</p>}<button type="button" className="button button-primary" disabled={disabled || !transcript.trim() || tooLong} onClick={() => { onConfirm(transcript.trim()); discard() }}>Confirm transcript</button></div>}
      {dirty && <button type="button" className="button button-text" onClick={discard}>Discard voice draft</button>}
      {message && <p role="alert" className="form-error">{message}</p>}
      <p className="small-note">Recording stops when you leave or hide this page. Confirm or discard your voice draft before moving to another question. Text input remains available below.</p>
    </>}
  </section>
}
