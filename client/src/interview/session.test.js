import { expect, it } from 'vitest'
import { ANSWER_LIMIT, answeredCount, interviewReducer, validateAnswer } from './session.js'

it('rejects whitespace and oversized answers while accepting the exact limit', () => {
  expect(validateAnswer(' \n ')).toBeTruthy()
  expect(validateAnswer('a'.repeat(ANSWER_LIMIT + 1))).toBeTruthy()
  expect(validateAnswer('a'.repeat(ANSWER_LIMIT))).toBe('')
})

it('accepts server questions, preserves question ownership and only completes after server confirmation', () => {
  const remote = { id: 'session-1', status: 'active', answers: {}, questions: [{ id: 'q1', text: 'Question from server' }] }
  let session = interviewReducer(null, { type: 'start', session: remote })
  expect(session.questions[0].text).toBe('Question from server')
  expect(interviewReducer(session, { type: 'complete' })).toBe(session)
  expect(interviewReducer(session, { type: 'answer', id: 'unrelated', value: 'hello' })).toBe(session)
  expect(interviewReducer(session, { type: 'move', index: -1 })).toBe(session)
  expect(interviewReducer(session, { type: 'move', index: 5 })).toBe(session)
  session = interviewReducer(session, { type: 'answer', id: 'q1', value: 'answer' })
  expect(answeredCount(session)).toBe(1)
  expect(interviewReducer(session, { type: 'complete', session: { ...session, id: 'other', status: 'completed' } })).toBe(session)
  session = interviewReducer(session, { type: 'complete', session: { ...session, status: 'completed' } })
  expect(session.status).toBe('completed')
  expect(interviewReducer(session, { type: 'answer', id: 'q1', value: 'overwrite' })).toBe(session)
})
