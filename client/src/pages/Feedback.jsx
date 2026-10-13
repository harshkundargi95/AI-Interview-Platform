import SessionSummary from '../components/SessionSummary.jsx'
import { Button, ButtonLink, Card, PageHeading } from '../components/ui.jsx'
import { sampleInterview as sample } from '../data/sampleInterview.js'
import { useInterview } from '../interview/useInterview.js'

export default function Feedback() {
  const { session, generateReport, busy, requestError } = useInterview()
  if (session?.status !== 'completed') return <SampleFeedback />
  if (session.generation?.mode && session.generation.mode !== 'disabled') return <AiFeedback session={session} generateReport={generateReport} busy={busy} error={requestError} />
  return (
    <>
      <PageHeading eyebrow="Interview complete · Local session" title="You made time to practice.">All {session.questions.length} answers are ready to review. They are saved in PostgreSQL. Reopen this review from History at any time.</PageHeading>
      <Card><SessionSummary session={session} /><h2>Your answer review</h2><p>These are your actual answers. They were accepted by the local server, but have not been scored or sent to an AI provider.</p>
        {session.questions.map((question, index) => <details key={question.id} className="answer-review"><summary>{index + 1}. {question.text}</summary><p className="answer-quote">{session.answers[question.id]}</p></details>)}
      </Card>
      <div className="sample-separator"><h2>Sample feedback format</h2><p>The report below is a fixed frontend illustration about a different, fictional answer, not a report for your selected track. Its scores and comments do not assess your responses.</p></div>
      <SampleFeedback embedded />
    </>
  )
}

function SampleFeedback({ embedded = false }) {
  return (
    <>
      {!embedded && <PageHeading eyebrow="03 / Reflect · Sample feedback" title="A clearer next step.">An illustrative report for a fictional answer. Written sample content, not AI-generated feedback.</PageHeading>}
      <Card className="report-summary"><div><span className="badge">Fictional report</span><h2>A clear example, with room for a stronger ending.</h2><p>You explain your actions concretely. Adding what changed for the people using the form would give this story more depth.</p></div><div className="report-label">{sample.role}<br /><span>{sample.type} · {sample.difficulty}</span></div></Card>
      <div className="three-column score-grid">
        {sample.scores.map((score) => <Card key={score.label}><p className="score-label">{score.label}</p><p className="score">{score.value}<span> / 5</span></p><p>{score.description}</p></Card>)}
      </div>
      <p className="small-note">Illustrative coaching scores only. They do not measure hiring readiness or predict employment outcomes.</p>
      <div className="two-column">
        <Card aria-labelledby="strengths-title"><p className="eyebrow">Keep doing this</p><h2 id="strengths-title">Specific actions stand out.</h2><blockquote>“reorganized the fields into a single column, added visible labels”</blockquote><p>This explains your contribution rather than just saying that you improved the form.</p></Card>
        <Card aria-labelledby="improve-title"><p className="eyebrow">Try next time</p><h2 id="improve-title">Close the loop.</h2><blockquote>“asked two classmates to try it”</blockquote><p>What did they find easier? What issue remained? Describe the observed result without inventing numbers.</p></Card>
      </div>
      <Card className="reflection-card"><h2>A small practice task</h2><p>Add two sentences about what the classmates noticed and what you would test next.</p><details><summary>Review the full sample answer</summary><p className="answer-quote">{sample.answer}</p></details></Card>
      <div className="actions"><ButtonLink to="/setup">Explore another setup →</ButtonLink><ButtonLink to="/history" variant="secondary">View interview history</ButtonLink></div>
    </>
  )
}




function AiFeedback({ session, generateReport, busy, error }) {
  const report = session.feedback
  return <>
    <PageHeading eyebrow="03 / Reflect" title="Your practice, a clearer next step.">Your answers are saved. Feedback is coaching guidance and can be wrong; it does not predict hiring outcomes.</PageHeading>
    <Card><SessionSummary session={session} />
      <h2>Your answer review</h2>
      {session.questions.map((q, i) => <details key={q.id} className="answer-review"><summary>{i + 1}. {q.text}</summary><p className="answer-quote">{session.answers[q.id]}</p></details>)}
    </Card>
    {!report ? <Card><h2>Generate coaching feedback</h2><p>{session.generation.mode === 'live' ? 'Send these saved questions and answers to Gemini for a structured coaching report.' : 'Generate a mock report with fixed demonstration scores. This does not assess your answers or contact Gemini.'}</p>
      <p role="status">{busy ? 'Preparing your report. Your answers are already saved…' : ''}</p>
      {error && <p role="alert" className="form-error">{error}</p>}
      <Button disabled={busy} onClick={generateReport}>{busy ? 'Generating…' : 'Generate feedback'}</Button>
    </Card> : <>
      <Card><span className="badge">{report.source === 'live' ? 'Live Gemini coaching' : 'Mock report · not an assessment'}</span><h2>Coaching report</h2><p>{report.content.summary}</p><p className="small-note">Model: {report.modelVersion} · Rubric: {report.rubricVersion}</p></Card>
      <div className="three-column">{report.content.subjects.map(item => <Card key={item.subject}><h3>{item.subject.toUpperCase()}</h3><p className="score">{item.score}<span> / 5</span></p><ul>{item.improvements.map((v, i) => <li key={i}>{v}</li>)}</ul></Card>)}</div>
      {report.content.answers.map(a => <Card key={a.questionId}><h3>{session.questions.find(q => q.id === a.questionId)?.text}</h3><p>{a.scores.map(s => `${s.dimension}: ${s.value}/5`).join(' · ')}</p><h4>Evidence from your answer</h4>{a.evidence.map((v, i) => <blockquote key={i}>{v}</blockquote>)}
        {[['Strengths', a.strengths], ['Missing or incorrect points', a.missing], ['Try next', a.improvements]].map(([label, values]) => <div key={label}><h4>{label}</h4><ul>{values.map((v, i) => <li key={i}>{v}</li>)}</ul></div>)}
        {a.example && <details><summary>Example improved answer</summary><p>{a.example}</p></details>}
      </Card>)}
      <p className="small-note">{report.content.disclaimer} Valid alternative approaches may be missed, and quoted evidence does not guarantee a correct judgment. Review suggestions critically.</p>
    </>}
    <div className="actions"><ButtonLink to="/setup">Practice again</ButtonLink><ButtonLink to="/history" variant="secondary">View history</ButtonLink></div>
  </>
}
