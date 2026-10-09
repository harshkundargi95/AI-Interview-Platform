import { randomUUID } from 'node:crypto'
import { selectQuestions } from '../data/questions.js'
import { ApiError } from '../middleware/errors.js'

export function createInterviewService({ now = Date.now, ttlMs = 60 * 60 * 1000, capacity = 500 } = {}) {
  // Temporary process-local store. No persistence or authorization is provided.
  const sessions = new Map()
  const creations = new Map()

  function prune() {
    for (const [id, session] of sessions) {
      if (now() >= session.expiresAt) {
        sessions.delete(id)
        creations.delete(session.requestId)
      }
    }
  }

  function get(id) {
    prune()
    const session = sessions.get(id)
    if (!session) throw new ApiError(404, 'INTERVIEW_NOT_FOUND', 'This interview expired or the server restarted. Start a new interview; your current draft remains in this tab.')
    return session
  }

  function snapshot(session) {
    const { requestId: _requestId, ...publicSession } = session
    return structuredClone(publicSession)
  }

  function checkedAnswers(session, answers, requireAll) {
    const ids = new Set(session.questions.map((question) => question.id))
    const entries = new Map()
    for (const answer of answers) {
      if (!ids.has(answer.questionId)) throw new ApiError(400, 'UNRELATED_QUESTION', 'An answer references a question outside this interview.')
      if (entries.has(answer.questionId)) throw new ApiError(400, 'DUPLICATE_QUESTION', 'Send each question only once.')
      entries.set(answer.questionId, answer.text)
    }
    if (requireAll && entries.size !== ids.size) throw new ApiError(409, 'INCOMPLETE_INTERVIEW', 'Answer every question before completing.')
    return Object.fromEntries(entries)
  }

  function sameAnswers(left, right) {
    const keys = Object.keys(left)
    return keys.length === Object.keys(right).length && keys.every((key) => left[key] === right[key])
  }

  return {
    create({ requestId, preferences }) {
      prune()
      const existingId = creations.get(requestId)
      if (existingId) {
        const existing = get(existingId)
        if (JSON.stringify(existing.preferences) !== JSON.stringify(preferences)) throw new ApiError(409, 'REQUEST_ID_REUSED', 'Use a new request ID for different preferences.')
        return { session: snapshot(existing), created: false }
      }
      if (sessions.size >= capacity) throw new ApiError(503, 'STORE_FULL', 'The temporary store is full. Retry after old interviews expire or restart the local server.')
      const session = {
        id: randomUUID(), requestId, preferences, questions: selectQuestions(preferences),
        answers: {}, status: 'active', createdAt: new Date(now()).toISOString(),
        expiresAt: now() + ttlMs, completedAt: null,
      }
      sessions.set(session.id, session)
      creations.set(requestId, session.id)
      return { session: snapshot(session), created: true }
    },
    read(id) { return snapshot(get(id)) },
    save(id, answers) {
      const session = get(id)
      const replacement = checkedAnswers(session, answers, false)
      if (session.status === 'completed' && !sameAnswers(session.answers, replacement)) throw new ApiError(409, 'INTERVIEW_COMPLETED', 'Completed answers cannot be changed.')
      session.answers = replacement
      return snapshot(session)
    },
    complete(id, answers) {
      const session = get(id)
      const submission = checkedAnswers(session, answers, true)
      if (session.status === 'completed') {
        if (!sameAnswers(session.answers, submission)) throw new ApiError(409, 'INTERVIEW_COMPLETED', 'This interview was already completed with different answers.')
        return snapshot(session)
      }
      // Validate everything before this synchronous write. Retries return the same completion.
      session.answers = submission
      session.status = 'completed'
      session.completedAt = new Date(now()).toISOString()
      return snapshot(session)
    },
  }
}


