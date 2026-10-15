import { useEffect, useState } from 'react'
import { extractSkills, scopeWarnings } from '../../../shared/personalization.js'
const empty = { jobDescription: '', resumeText: '', requiredSkills: [], optionalSkills: [] }
export default function Personalization({ value, onChange, api, preferences, disabled, onBusy, enabled, onEnabledChange, onPreferenceChange }) {
  const context = value || empty
  const [requiredText, setRequiredText] = useState(context.requiredSkills.join(', ')), [optionalText, setOptionalText] = useState(context.optionalSkills.join(', '))
  const [files, setFiles] = useState([]), [message, setMessage] = useState(''), [working, setWorking] = useState(false)
  useEffect(() => { let current = true; api?.resumes?.().then(rows => { if (current) setFiles(rows) }).catch(() => {}); return () => { current = false } }, [api])
  const change = patch => onChange({ ...context, ...patch })
  async function run(work) {
    setWorking(true); onBusy(true); setMessage('')
    try { await work() } catch (error) { setMessage(error.message) }
    finally { setWorking(false); onBusy(false) }
  }
  return <fieldset disabled={disabled || working} className="personalization-panel">
    <legend className="personalization-legend">Personalize your questions <span className="badge">Optional</span></legend>
    <div className="personalization-intro"><span className="personalization-spark" aria-hidden="true">✧</span><div><h3>A little context. More relevant practice.</h3><p>Bring the role and your experience into the conversation.</p></div></div>
    <label className="personalization-switch"><span>Use resume / job description</span><input type="checkbox" role="switch" checked={enabled} onChange={e => onEnabledChange(e.target.checked)} aria-describedby="personalization-toggle-hint" /><span className="personalization-switch-track" aria-hidden="true" /></label>
    <p id="personalization-toggle-hint" className="small-note">{enabled ? 'On: use the context below to personalize your selected question type.' : 'Off: practice using your interview preferences. Resume and job description drafts are excluded from this interview.'}</p>
    {enabled && <div className="personalization-content">
    <section className="context-card" aria-label="Personalized interview settings">
      <div className="context-heading"><span className="context-number">✧</span><span>YOUR PRACTICE STYLE</span></div>
      <div className="practice-types" role="group" aria-label="Personalized question type">
        {[['technical', 'Technical', 'Concepts, tools and project decisions'], ['behavioral', 'Behavioral', 'Experiences, teamwork and challenges'], ['mixed', 'Mixed', 'A blend of technical and behavioral']].map(([value, label, description]) => <button key={value} type="button" className="practice-type" aria-label={label} aria-pressed={preferences.type === value} onClick={() => onPreferenceChange({ target: { name: 'type', value } })}><strong>{label}</strong><span>{description}</span></button>)}
      </div>
      <label htmlFor="personalizedQuestionCount">Questions in this interview</label>
      <select id="personalizedQuestionCount" name="questionCount" value={preferences.questionCount} onChange={onPreferenceChange}>{Array.from({ length: 8 }, (_, index) => <option key={index + 3} value={index + 3}>{index + 3} questions</option>)}</select>
      <p className="small-note">Synced with Interview preferences above. This is the total of 3–10 base questions, with up to 2 optional follow-ups. Resume and job description context guide the questions within your chosen type and subjects.</p>
    </section>
    <details className="personalization-privacy"><summary>Before you add your details</summary><p className="small-note">Paste a job description and relevant project details. Review all text before starting. In live mode, the text and skills below are sent to Google for question generation. Remove your name, contact details and confidential information. Starting saves this context with the interview until you delete that interview.</p></details>
    <section className="context-card" aria-label="Job context"><div className="context-heading"><span className="context-number">01</span><span>THE OPPORTUNITY</span></div>
    <label htmlFor="jobDescription">Job description</label>
    <textarea id="jobDescription" placeholder="Paste the role, responsibilities and skills you want to prepare for…" rows={5} maxLength={12000} value={context.jobDescription} onChange={e => change({ jobDescription: e.target.value })} />
    <div className="context-toolbar"><span className="context-counter">{context.jobDescription.length.toLocaleString()} / 12,000</span></div>
    <button type="button" className="button button-secondary context-detect" onClick={() => { const detected = extractSkills(context.jobDescription); change(detected); setRequiredText(detected.requiredSkills.join(', ')); setOptionalText(detected.optionalSkills.join(', ')) }}>Detect skills from job description</button>
    <p className="small-note">Keyword suggestions, not an exhaustive analysis. Review and edit both lists; separate skills with commas.</p>
    <div className="context-skills"><div>
    <label htmlFor="requiredSkills">Required skills</label><input id="requiredSkills" value={requiredText} maxLength={2400} onChange={e => { setRequiredText(e.target.value); change({ requiredSkills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }) }} />
    <div className="skill-preview" aria-hidden="true">{context.requiredSkills.slice(0, 8).map((skill, index) => <span key={index}>{skill}</span>)}</div></div><div>
    <label htmlFor="optionalSkills">Optional skills</label><input id="optionalSkills" value={optionalText} maxLength={2400} onChange={e => { setOptionalText(e.target.value); change({ optionalSkills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }) }} />
    <div className="skill-preview optional" aria-hidden="true">{context.optionalSkills.slice(0, 8).map((skill, index) => <span key={index}>{skill}</span>)}</div></div></div></section>
    <section className="context-card" aria-label="Your experience"><div className="context-heading"><span className="context-number">02</span><span>YOUR EXPERIENCE</span></div>
    <div className="resume-upload"><span className="upload-symbol" aria-hidden="true">↑</span><label htmlFor="resumeFile">Resume file (PDF or DOCX, up to 2 MB)</label><p>Choose your resume. We’ll extract the text for you to review.</p>
    <input id="resumeFile" type="file" accept=".pdf,.docx" onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; if (!file) return; if (file.size > 2 * 1024 * 1024) { setMessage('Choose a file up to 2 MB.'); return } run(async () => { const row = await api.uploadResume(file); setFiles(old => [row, ...old]); change({ resumeText: row.text }); setMessage('Text extracted. Review and remove personal information before starting.') }) }} />
    </div>
    <p className="small-note">Files and extracted text expire after 24 hours. Scanned PDFs need text pasted manually. Deleting a file does not delete text already saved in an interview; delete that interview from History separately.</p>
    {files.map(file => <div className="resume-file-card" key={file.id}><span className="resume-filename">{file.filename}</span><span className="context-counter">Expires {new Date(file.expiresAt).toLocaleString()}</span><div className="actions">
      <button className="button button-secondary" type="button" onClick={() => change({ resumeText: file.text })}>Use text</button>
      <button className="button button-secondary" type="button" onClick={() => run(async () => { const blob = await api.downloadResume(file.id); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = file.filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000) })}>Download</button>
      <button className="button button-secondary" type="button" onClick={() => run(async () => { await api.removeResume(file.id); setFiles(old => old.filter(item => item.id !== file.id)); setMessage('File deleted. Clear the text below if you no longer want to use it.') })}>Delete file</button>
    </div></div>)}
    <label htmlFor="resumeText">Resume / project text to use</label><textarea id="resumeText" placeholder="Your extracted text appears here. You can also paste a project summary, the tools you used, and what you contributed…" rows={6} maxLength={12000} value={context.resumeText} onChange={e => change({ resumeText: e.target.value })} />
    <div className="context-toolbar"><span className="context-counter">{context.resumeText.length.toLocaleString()} / 12,000 · Edit before starting</span></div></section>
    <button className="button button-text context-clear" type="button" onClick={() => { onChange(undefined); setRequiredText(''); setOptionalText('') }}>Clear personalization text</button>
    {scopeWarnings(preferences, context).map(warning => <p className="small-note" key={warning}>{warning}</p>)}
    {message && <p className="context-status" role="status">{message}</p>}
    {working && <p className="context-status" role="status">Processing resume…</p>}
    </div>}
  </fieldset>
}
