import { useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router'
import { Button, Card, EmptyState, PageHeading, TextAreaField } from '../components/ui.jsx'
import SessionSummary from '../components/SessionSummary.jsx'
import AbandonGuard from '../components/AbandonGuard.jsx'
import { useInterview } from '../interview/useInterview.js'
import { ANSWER_LIMIT, answeredCount, validateAnswer } from '../interview/session.js'
import { difficultyLabels, typeLabels } from '../interview/questions.js'

export default function Interview() {
  const { session, dispatch, completeInterview, discardInterview, saveInterview, requestFollowup, busy, requestError } = useInterview()
  const [error, setError] = useState('')
  const questionRef = useRef(null)
  const previousIndex = useRef(session?.index)

  useEffect(() => {
    if (session && previousIndex.current !== session.index) {
      questionRef.current?.focus()
      previousIndex.current = session.index
    }
  }, [session])

  if (!session) return <EmptyState title="Ready when you are.">Choose your preferences to start an interview. Open History to resume a saved interview after refreshing.</EmptyState>
  if (session.status === 'completed') return <Navigate to="/feedback" replace />

  const question = session.questions[session.index]
  const answer = session.answers[question.id] ?? ''
  const lastQuestion = session.index === session.questions.length - 1
  const count = answeredCount(session)
  const followupCount = session.questions.filter(q => q.parentId).length
  const canFollowup = Boolean(session.generation?.maxFollowups && !question.parentId && !session.questions.some(q => q.parentId === question.id) && followupCount < session.generation.maxFollowups)
  const sourceLabel = { gemini: 'Live Gemini', mock: 'Mock demonstration', 'fixed-bank-fallback': 'Fixed-bank fallback', 'fixed-bank': 'Fixed bank' }[session.generation?.source] || 'Fixed bank'
  const hasAnswers = session.questions.some(q => (session.answers[q.id] || '') !== (session.savedAnswers?.[q.id] || ''))

  function move(index) {
    setError('')
    dispatch({ type: 'move', index })
  }

  function advance(event) {
    event.preventDefault()
    if (busy) return
    const message = validateAnswer(answer)
    if (message) {
      setError(message)
      document.getElementById('answer').focus()
      return
    }
    if (lastQuestion) {
      const invalidIndex = session.questions.findIndex((item) => validateAnswer(session.answers[item.id]))
      if (invalidIndex !== -1) { move(invalidIndex); setError('Please finish this answer before completing.'); return }
      completeInterview()
    } else move(session.index + 1)
  }

  return (
    <>
      <AbandonGuard enabled={hasAnswers} onDiscard={discardInterview} />
      <PageHeading eyebrow="02 / Practice · Local interview" title="One question. Your perspective.">Take your time. You can return to earlier questions before completing.</PageHeading>
      <div className="progress-header"><span>Question {session.index + 1} of {session.questions.length}</span><span>{count} of {session.questions.length} answers ready</span></div>
      <p className="small-note">Question plan: {sourceLabel}. {session.generation?.reason && 'AI was unavailable or its quota was reached; questions come from the fixed bank. '}{session.generation?.maxFollowups ? `${session.generation.baseCount} base questions + ${followupCount} of ${session.generation.maxFollowups} optional follow-ups. New follow-ups are added to the end.` : ''}</p>
      <progress aria-label="Answers ready" max={session.questions.length} value={count} />
      <div className="content-grid">
        <div className="stack">
          <Card className="question-card" aria-labelledby="question-title">
            <div className="card-topline"><span className="badge">{typeLabels[question.category]}</span><span className="muted small">{difficultyLabels[session.preferences.difficulty]}</span></div>
            <p className="small-note">{question.subject?.toUpperCase()} · {question.parentId ? `Follow-up · ${question.source === 'gemini' ? 'Live Gemini' : 'Mock demonstration'}` : sourceLabel} · {question.applicability}</p><h2 id="question-title" ref={questionRef} tabIndex={-1}>{question.text}</h2>
          </Card>
          <Card aria-label="Your answer">
            <form onSubmit={advance}>
              <TextAreaField id="answer" label="Your answer" hint="Up to 3,000 characters. Use Save progress before leaving or refreshing." value={answer} onChange={(event) => { dispatch({ type: 'answer', id: question.id, value: event.target.value }); setError('') }} rows={8} disabled={busy} aria-invalid={Boolean(error)} aria-describedby={error ? 'answer-hint answer-error' : 'answer-hint'} />
              <p className="small-note">{answer.length.toLocaleString()} / {ANSWER_LIMIT.toLocaleString()} characters</p>
              {error && <p id="answer-error" className="form-error" role="alert">{error}</p>}
              <p role="status" className="small-note">{busy ? 'Sending answers to the local server…' : hasAnswers ? 'You have unsaved edits.' : 'Saved progress is up to date.'}</p>{requestError && <p role="alert" className="form-error">{requestError}</p>}<div className="actions">{canFollowup && <Button variant="secondary" disabled={busy || Boolean(validateAnswer(answer)) || Object.values(session.answers).some(text => text.length > ANSWER_LIMIT)} onClick={() => requestFollowup(question.id)}>Save & ask a follow-up</Button>}<Button variant="secondary" disabled={busy || !hasAnswers || Object.values(session.answers).some(text => text.length > ANSWER_LIMIT)} onClick={saveInterview}>Save progress</Button><Button variant="secondary" disabled={busy || session.index === 0} onClick={() => move(session.index - 1)}>Previous question</Button><Button type="submit" disabled={busy}>{busy ? 'Submitting…' : lastQuestion ? (requestError ? 'Retry completion' : 'Complete interview') : 'Next question →'}</Button></div>
            </form>
          </Card>
        </div>
        <aside className="stack" aria-label="Interview guidance">
          <Card className="tinted-card"><p className="eyebrow">Your focus</p><SessionSummary session={session} /><div className="divider" /><h3>Build a clear answer</h3><p>{question.category === 'behavioral' ? 'Describe the situation, your actions, and the result. Use a real example and explain what you learned.' : 'Explain the idea, give an example, and discuss a tradeoff or edge case.'}</p></Card>
          <p className="small-note">Saved progress survives refreshes and server restarts. Reopen it from History. Unsaved edits remain only in this tab. {session.generation?.mode === 'live' ? 'Follow-ups and reports send saved content to Gemini. AI can make mistakes.' : 'Mock feedback is a demonstration, not an assessment.'}</p>
        </aside>
      </div>
    </>
  )
}




