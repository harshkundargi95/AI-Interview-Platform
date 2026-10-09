import { ButtonLink, Card } from '../components/ui.jsx'

export default function Landing() {
  return (
    <>
      <div className="hero-grid">
        <div className="hero-copy">
          <p className="eyebrow">A little practice. A clearer next step.</p>
          <h1>Make room for<br /><span>your next opportunity.</span></h1>
          <p className="intro">A thoughtful space to prepare for software developer internships and junior roles across four tracks. One question, one reflection, one step forward.</p>
          <div className="actions"><ButtonLink to="/setup">Start practicing <span aria-hidden="true">↗</span></ButtonLink><ButtonLink to="/feedback" variant="secondary">See sample feedback</ButtonLink></div>
          <p className="small-note">3–10 fixed-bank questions. No account needed. Keep this tab open to retain your answers.</p>
        </div>
        <Card className="hero-card" aria-labelledby="practice-heading">
          <div className="card-topline"><span className="eyebrow">The practice loop</span><span className="badge">Coming together</span></div>
          <h2 id="practice-heading">Small steps.<br />More thoughtful answers.</h2>
          <ol className="practice-steps">
            <li><span className="step-number">01</span><div><h3>Choose your focus</h3><p>Shape the session around what you want to practice.</p></div></li>
            <li><span className="step-number">02</span><div><h3>Find your words</h3><p>Make space to think through one question at a time.</p></div></li>
            <li><span className="step-number">03</span><div><h3>Reflect and try again</h3><p>Turn specific feedback into your next small improvement.</p></div></li>
          </ol>
        </Card>
      </div>
      <div className="section-heading"><p className="eyebrow">Built around your growth</p><h2>A clear path through practice.</h2></div>
      <div className="three-column">
        <Card><span className="feature-index">01 / PREPARE</span><h3>A focused starting point</h3><p>Choose a role track, experience level, subjects and question count before entering the room.</p><ButtonLink to="/setup" variant="text">View setup →</ButtonLink></Card>
        <Card><span className="feature-index">02 / REFLECT</span><h3>Feedback with context</h3><p>See how strengths and suggestions can connect to evidence in an answer.</p><ButtonLink to="/feedback" variant="text">View sample report →</ButtonLink></Card>
        <Card><span className="feature-index">03 / RETURN</span><h3>A place for your progress</h3><p>Explore the history layout with a fictional interview. Your real history will come later.</p><ButtonLink to="/history" variant="text">View history →</ButtonLink></Card>
      </div>
    </>
  )
}


