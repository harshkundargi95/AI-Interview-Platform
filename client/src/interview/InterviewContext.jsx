import { useReducer, useRef, useState } from 'react'
import { interviewReducer } from './session.js'
import { InterviewContext } from './useInterview.js'
import { interviewApi } from './api.js'

export function InterviewProvider({ children }) {
  const [session, dispatch] = useReducer(interviewReducer, null)
  const [busy, setBusy] = useState(false)
  const [requestError, setRequestError] = useState('')
  const lock = useRef(false)
  const creation = useRef(null)
  const generation = useRef(0)

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
      () => interviewApi.start(creation.current.requestId, preferences),
      (result) => { dispatch({ type: 'start', session: result }); creation.current = null },
    )
  }

  function completeInterview() {
    return runRequest(
      () => interviewApi.complete(session.id, session.answers, session.revision),
      (result) => dispatch({ type: 'complete', session: result }),
    )
  }

  function saveInterview() {
    return runRequest(() => interviewApi.save(session.id, session.answers, session.revision), result => dispatch({ type: 'saved', session: result }))
  }

  function resumeInterview(id) {
    return runRequest(() => interviewApi.read(id), result => dispatch({ type: 'start', session: result }))
  }

  function discardInterview() {
    generation.current += 1
    dispatch({ type: 'discard' })
    setRequestError('')
  }

  return <InterviewContext.Provider value={{ session, dispatch, startInterview, completeInterview, discardInterview, saveInterview, resumeInterview, busy, requestError }}>{children}</InterviewContext.Provider>
}
