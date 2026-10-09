import SessionSummary from '../components/SessionSummary.jsx'
import { ButtonLink, Card, PageHeading } from '../components/ui.jsx'
import { sampleInterview as sample } from '../data/sampleInterview.js'
import { useInterview } from '../interview/useInterview.js'

export default function Feedback() {
  const { session } = useInterview()
  if (session?.status !== 'completed') return <SampleFeedback />
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



