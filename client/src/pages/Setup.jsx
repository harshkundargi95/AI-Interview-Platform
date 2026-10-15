import Personalization from '../components/Personalization.jsx'
import { useAuthState } from '../auth/context.js'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Button, ButtonLink, Card, PageHeading, SelectField } from '../components/ui.jsx'
import { useInterview } from '../interview/useInterview.js'
import { defaultPreferences, roleLabels, experienceLabels, typeLabels, difficultyLabels, trackSubjects, subjectLabels, languageLabels, technologyLabels, configurationError, technicalCount } from '../../../shared/interviewOptions.js'

const options = (labels) => Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)
export default function Setup() {
  const { session, startInterview, busy, requestError } = useInterview()
  const [preferences, setPreferences] = useState({ ...defaultPreferences, ...session?.preferences })
  const [personalizationEnabled, setPersonalizationEnabled] = useState(Boolean(session?.preferences.personalization))
  const { api } = useAuthState()
  const [aiMode, setAiMode] = useState(api?.config ? null : 'disabled')
  useEffect(() => {
    let active = true
    api?.config?.().then(config => { if (active) setAiMode(config.mode) }).catch(() => { if (active) setAiMode('unavailable') })
    return () => { active = false }
  }, [api])
  const [uploadBusy, setUploadBusy] = useState(false)
  const navigate = useNavigate()
  const mounted = useRef(true)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
  const error = configurationError(preferences)
  function change(event) {
    const { name, value } = event.target
    setPreferences((previous) => ({ ...previous, [name]: name === 'questionCount' ? Number(value) : value, ...(name === 'role' ? { subjects: [] } : {}), ...(name === 'type' && value === 'behavioral' ? { subjects: [], topicMode: 'balanced' } : {}) }))
  }
  function toggle(name, value) {
    setPreferences((previous) => ({ ...previous, [name]: previous[name].includes(value) ? previous[name].filter((item) => item !== value) : [...previous[name], value] }))
  }
  async function start(event) {
    event.preventDefault()
    if (error || uploadBusy) return
    const submitted = { ...preferences }
    if (!personalizationEnabled) delete submitted.personalization
    const started = await startInterview(submitted)
    if (started && mounted.current) navigate('/interview')
  }
  return <>
    <PageHeading eyebrow="01 / Prepare" title="Make this time yours.">Practice for software developer internships and junior roles.</PageHeading>
    <div className="content-grid">
      <Card aria-labelledby="setup-title">
        <h2 id="setup-title">Interview preferences</h2>
        <p className="muted">{aiMode === 'live' ? 'Live Gemini mode. Your configuration is sent to Google to generate questions. Requesting follow-ups or feedback also sends your saved answers. Avoid personal or confidential information.' : aiMode === 'mock' ? 'Mock mode. Questions and reports demonstrate the flow without calling an AI provider; mock scores do not assess your answers.' : aiMode === 'disabled' ? 'Fixed-bank practice. AI is unavailable for this session.' : 'Checking AI configuration. If this persists, reload after starting the API.'} Use Save progress to preserve unfinished answers.</p>
        <form onSubmit={start}>
          <div className="form-stack">
            <SelectField id="role" name="role" label="Job role" value={preferences.role} onChange={change} disabled={busy}>{options(roleLabels)}</SelectField>
            <SelectField id="experience" name="experience" label="Experience level" value={preferences.experience} onChange={change} disabled={busy}>{options(experienceLabels)}</SelectField>
            <SelectField id="type" name="type" label="Interview type" value={preferences.type} onChange={change} disabled={busy}>{options(typeLabels)}</SelectField>
            <SelectField id="difficulty" name="difficulty" label="Difficulty" value={preferences.difficulty} onChange={change} disabled={busy} hint="Relative to your experience level; no senior-level interviews.">{options(difficultyLabels)}</SelectField>
            <SelectField id="questionCount" name="questionCount" label="Question count" value={preferences.questionCount} onChange={change} disabled={busy}>{Array.from({ length: 8 }, (_, index) => <option key={index + 3} value={index + 3}>{index + 3} questions</option>)}</SelectField>
            {preferences.type !== 'behavioral' && <>
              <SelectField id="topicMode" name="topicMode" label="Topic coverage" value={preferences.topicMode} onChange={change} disabled={busy}><option value="balanced">Automatic / balanced</option><option value="selected">Choose subjects</option></SelectField>
              {preferences.topicMode === 'selected' ? <fieldset className="choice-group" disabled={busy}><legend>Subjects</legend>{trackSubjects[preferences.role].map((subject) => <label key={subject}><input type="checkbox" checked={preferences.subjects.includes(subject)} onChange={() => toggle('subjects', subject)} />{subjectLabels[subject]}</label>)}</fieldset> : <p className="small-note">Balanced coverage rotates through this track’s subjects, starting with its fundamentals. With {technicalCount(preferences)} technical slots, not every subject may appear. Choose subjects to guarantee coverage.</p>}
            </>}
            <SelectField id="language" name="language" label="Preferred programming language" value={preferences.language} onChange={change} disabled={busy}>{options(languageLabels)}</SelectField>
            <fieldset className="choice-group" disabled={busy}><legend>Relevant technologies (optional, up to 5)</legend>{Object.entries(technologyLabels).map(([value, label]) => <label key={value}><input type="checkbox" checked={preferences.technologies.includes(value)} disabled={!preferences.technologies.includes(value) && preferences.technologies.length >= 5} onChange={() => toggle('technologies', value)} />{label}</label>)}</fieldset>
          </div>
          <p className="small-note">Matching language/technology questions are preferred where available; otherwise we use language-neutral concepts within your chosen subjects. Behavioral interviews do not require technical subjects.</p>
          <Personalization enabled={personalizationEnabled} onEnabledChange={setPersonalizationEnabled} onPreferenceChange={change} value={preferences.personalization} preferences={preferences} api={api} disabled={busy} onBusy={setUploadBusy} onChange={personalization => setPreferences(old => ({ ...old, personalization }))} />
          {session?.status === 'completed' && <p className="small-note">Starting again replaces your current local answer review.</p>}
          {error && <p role="alert" className="form-error">{error}</p>}
          <p role="status" className="small-note">{busy ? 'Loading your questions…' : ''}</p>
          {requestError && <p role="alert" className="form-error">{requestError}</p>}
          <div className="actions"><Button type="submit" disabled={busy || uploadBusy || Boolean(error) || !aiMode || aiMode === 'unavailable'}>{busy ? 'Loading…' : requestError ? 'Retry starting interview' : 'Start interview →'}</Button>{session?.status === 'completed' && <ButtonLink to="/feedback" variant="secondary">Review your answers</ButtonLink>}</div>
        </form>
      </Card>
      <aside className="stack" aria-label="Session guidance">
        <Card className="tinted-card"><p className="eyebrow">Room to think</p><h2>A calm space to practice.</h2><ul className="guidance-list"><li>3–10 base questions, with up to 2 optional follow-ups. No timer.</li><li>Go back to refine earlier answers.</li><li>Discuss code or pseudocode; code is not executed.</li><li>Reports are labeled mock or live. Scores are coaching guidance, not hiring predictions.</li></ul></Card>
        <Card><h3>Start with text</h3><p>Your signed-in account owns each interview. Answers are saved by the local Express server. In live mode, requesting follow-ups or reports sends the relevant content to Gemini. Saved answers persist in PostgreSQL and can be resumed from History. Save progress before refreshing to keep your latest edits.</p></Card>
      </aside>
    </div>
  </>
}
