import { selectQuestions } from '../data/questions.js'
import { ApiError } from '../middleware/errors.js'

const include = { questions: { orderBy: { position: 'asc' } }, answers: true, feedback: true }
const missing = () => new ApiError(404, 'INTERVIEW_NOT_FOUND', 'This interview was not found. Return to history or start a new interview.')
function snapshot(row) {
  return {
    id: row.id, preferences: row.preferences, status: row.status, revision: row.revision,
    createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
    questions: row.questions.map(q => ({ ...q.metadata, id: q.id, text: q.text, subject: q.subject })),
    answers: Object.fromEntries(row.answers.map(a => [a.questionId, a.text])),
    feedback: row.feedback ? { source: row.feedback.source, content: row.feedback.content } : null,
  }
}
function checkedAnswers(row, answers, requireAll) {
  const ids = new Set(row.questions.map(q => q.id))
  const seen = new Set()
  for (const answer of answers) {
    if (!ids.has(answer.questionId)) throw new ApiError(400, 'UNRELATED_QUESTION', 'An answer references a question outside this interview.')
    if (seen.has(answer.questionId)) throw new ApiError(400, 'DUPLICATE_QUESTION', 'Send each question only once.')
    seen.add(answer.questionId)
    if (requireAll && !answer.text.trim()) throw new ApiError(409, 'INCOMPLETE_INTERVIEW', 'Answer every question before completing.')
  }
  if (requireAll && seen.size !== ids.size) throw new ApiError(409, 'INCOMPLETE_INTERVIEW', 'Answer every question before completing.')
}
const sameAnswers = (row, answers) => row.answers.length === answers.length && answers.every(a => row.answers.some(b => a.questionId === b.questionId && a.text === b.text))

export function createPersistentInterviewService(db, ownerId) {
  if (!ownerId) throw new Error('A verified database owner is required.')
  // Request handlers supply the mapped user ID only after Clerk verifies the session.
  async function transaction(operation) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try { return await db.$transaction(operation, { isolationLevel: 'Serializable' }) }
      catch (error) {
        if (['P2034', 'P2002'].includes(error.code) && attempt < 2) continue
        if (error.code === 'P2034') throw new ApiError(409, 'WRITE_CONFLICT', 'Another change occurred. Reload this interview from history before retrying.')
        throw error
      }
    }
  }
  async function get(tx, id) {
    const row = await tx.interview.findFirst({ where: { id, ownerId }, include })
    if (!row) throw missing()
    return row
  }
  async function write(id, answers, revision, complete) {
    return transaction(async tx => {
      const row = await get(tx, id)
      checkedAnswers(row, answers, complete)
      if (row.status === 'completed') {
        if (!sameAnswers(row, answers)) throw new ApiError(409, 'INTERVIEW_COMPLETED', 'Completed answers cannot be changed.')
        return snapshot(row)
      }
      // Identical retries are safe even after the first response was lost.
      if (sameAnswers(row, answers) && !complete) return snapshot(row)
      if (revision !== row.revision) throw new ApiError(409, 'STALE_INTERVIEW', 'This interview changed in another tab. Reopen it from history before saving; your current draft remains here.')
      await tx.answer.deleteMany({ where: { interviewId: id } })
      if (answers.length) await tx.answer.createMany({ data: answers.map(a => ({ ...a, interviewId: id })) })
      await tx.interview.update({
        where: { id }, data: {
          revision: { increment: 1 },
          ...(complete ? { status: 'completed', completedAt: new Date() } : {}),
        },
      })
      return snapshot(await get(tx, id))
    })
  }
  return {
    storage: 'postgresql',
    async health() { await db.$queryRaw`SELECT 1` },
    async create({ requestId, preferences }) {
      return transaction(async tx => {
        const existing = await tx.interview.findUnique({ where: { ownerId_requestId: { ownerId, requestId } }, include })
        if (existing) {
          if (JSON.stringify(existing.preferences) !== JSON.stringify(preferences)) {
            // PostgreSQL jsonb reorders object keys; compare canonical values.
            if (Object.keys(preferences).some(key => JSON.stringify(existing.preferences[key]) !== JSON.stringify(preferences[key]))) {
              throw new ApiError(409, 'REQUEST_ID_REUSED', 'Use a new request ID for different preferences.')
            }
          }
          return { session: snapshot(existing), created: false }
        }
        const questions = selectQuestions(preferences)
        const row = await tx.interview.create({
          data: { ownerId, requestId, preferences, questions: { create: questions.map((q, position) => ({
            id: q.id, position, text: q.text, subject: q.subject, metadata: q,
          })) } }, include,
        })
        return { session: snapshot(row), created: true }
      })
    },
    async read(id) { return snapshot(await get(db, id)) },
    async list({ skip = 0, take = 20 } = {}) {
      const rows = await db.interview.findMany({
        where: { ownerId }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip, take: take + 1,
        include: { _count: { select: { questions: true, answers: true } } },
      })
      return { items: rows.slice(0, take).map(row => ({
        id: row.id, preferences: row.preferences, status: row.status,
        createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
        questionCount: row._count.questions, savedAnswerCount: row._count.answers,
      })), hasMore: rows.length > take }
    },
    save: (id, answers, revision) => write(id, answers, revision, false),
    complete: (id, answers, revision) => write(id, answers, revision, true),
    async remove(id) {
      const result = await db.interview.deleteMany({ where: { id, ownerId } })
      if (!result.count) throw missing()
      return { id, deleted: true }
    },
  }
}
