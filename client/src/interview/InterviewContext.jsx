import { useEffect, useReducer, useRef, useState } from 'react'
import { interviewReducer } from './session.js'
import { InterviewContext } from './useInterview.js'

export function InterviewProvider({ children, api }) {
  const [session, dispatch] = useReducer(interviewReducer, null)
  const [busy, setBusy] = useState(false)
  const [requestError, setRequestError] = useState('')
  const lock = useRef(false)
  const creation = useRef(null)
  const generation = useRef(0)

  useEffect(() => () => { generation.current += 1 }, [])

  async function runRequest(operation, apply) {
    if (lock.current) return false
    lock.current = true
    setBusy(true)
    setRequestError('')
    const startedGeneration = generation.current
    try {
      const result = await operation()
      if (startedGeneration !== generation.current) return false
      apply(result)
      return true
    } catch (error) {
      if (startedGeneration === generation.current) setRequestError(error.message)
      return false
    } finally {
      lock.current = false
      setBusy(false)
    }
  }

  function startInterview(preferences) {
    const signature = JSON.stringify(preferences)
    if (!creation.current || creation.current.signature !== signature) creation.current = { signature, requestId: crypto.randomUUID() }
    return runRequest(
      () => api.start(creation.current.requestId, preferences),
      (result) => { dispatch({ type: 'start', session: result }); creation.current = null },
    )
  }

  function completeInterview() {
    return runRequest(
      () => api.complete(session.id, session.answers, session.revision),
      (result) => dispatch({ type: 'complete', session: result }),
    )
  }

  function saveInterview() {
    return runRequest(() => api.save(session.id, session.answers, session.revision), result => dispatch({ type: 'saved', session: result }))
  }

  function requestFollowup(questionId) {
    return runRequest(async () => {
      const saved = await api.save(session.id, session.answers, session.revision)
      // Update saved revision even if AI fails afterward; preserve all local edits.
      dispatch({ type: 'saved', session: saved })
      return api.followup(session.id, questionId, saved.revision)
    }, result => dispatch({ type: 'expanded', session: result }))
  }
  function generateReport() {
    return runRequest(() => api.report(session.id), result => dispatch({ type: 'report', session: result }))
  }

  function resumeInterview(id) {
    return runRequest(() => api.read(id), result => dispatch({ type: 'start', session: result }))
  }

  function discardInterview() {
    generation.current += 1
    dispatch({ type: 'discard' })
    setRequestError('')
  }

  return <InterviewContext.Provider value={{ session, dispatch, startInterview, completeInterview, discardInterview, saveInterview, resumeInterview, busy, requestError, requestFollowup, generateReport }}>{children}</InterviewContext.Provider>
}
