import { isDeepStrictEqual } from 'node:util'
import { randomUUID } from 'node:crypto'
import { setTimeout as delay } from 'node:timers/promises'
import { aggregate, MAX_FOLLOWUPS, normalize, RUBRIC } from '../ai/contracts.js'
import { selectQuestions } from '../data/questions.js'
import { ApiError } from '../middleware/errors.js'

const include = { questions: { orderBy: { position: 'asc' } }, answers: true, feedback: true }
const missing = () => new ApiError(404, 'INTERVIEW_NOT_FOUND', 'This interview was not found. Return to history or start a new interview.')
function snapshot(row) {
  return {
    id: row.id, generation: row.generation, preferences: row.preferences, status: row.status, revision: row.revision,
    createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
    questions: row.questions.map(q => ({ ...q.metadata, id: q.id, text: q.text, subject: q.subject })),
    answers: Object.fromEntries(row.answers.map(a => [a.questionId, a.text])),
    feedback: row.feedback ? { source: row.feedback.source, content: row.feedback.content, modelVersion: row.feedback.modelVersion, rubricVersion: row.feedback.rubricVersion } : null,
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

export function createPersistentInterviewService(db, ownerId, ai = null) {
  if (!ownerId) throw new Error('A verified database owner is required.')
  // Request handlers supply the mapped user ID only after Clerk verifies the session.
  async function transaction(operation) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try { return await db.$transaction(operation, { isolationLevel: 'Serializable' }) }
      catch (error) {
        const conflict = error.code === 'P2034' || [error, error.cause].some(e => e?.kind === 'TransactionWriteConflict' || e?.originalCode === '40001')
        if ((conflict || error.code === 'P2002') && attempt < 2) {
          // Let competing transactions finish before taking a fresh snapshot.
          await delay(50 * (2 ** attempt) + Math.floor(Math.random() * 50))
          continue
        }
        if (conflict) throw new ApiError(409, 'WRITE_CONFLICT', 'Another change occurred. Reload this interview from history before retrying.')
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
      const previous = await db.interview.findUnique({ where: { ownerId_requestId: { ownerId, requestId } }, include })
      if (previous) {
        if (!isDeepStrictEqual(previous.preferences, preferences)) throw new ApiError(409, 'REQUEST_ID_REUSED', 'Use a new request ID for different preferences.')
        return { session: snapshot(previous), created: false }
      }
      let questions = selectQuestions(preferences)
      let generation = { source: 'fixed-bank', mode: ai?.mode || 'disabled', model: ai?.model || null, rubric: RUBRIC, baseCount: questions.length, maxFollowups: ai ? MAX_FOLLOWUPS : 0 }
      if (ai) {
        try {
          const plan = await ai.run(ownerId, 'plan:' + requestId, 'plan', { preferences, slots: questions.map(({ text, subject, category }) => ({ text, subject, category })) })
          questions = plan.questions.map(q => ({ ...q, id: randomUUID(), source: ai.mode === 'live' ? 'gemini' : 'mock', applicability: ai.mode === 'live' ? 'AI-generated practice question' : 'Mock mode: fixed-bank demonstration' }))
          generation.source = ai.mode === 'live' ? 'gemini' : 'mock'
        } catch (error) {
          if (!['AI_UNAVAILABLE', 'AI_QUOTA'].includes(error.code)) throw error
          generation = { ...generation, source: 'fixed-bank-fallback', reason: error.code }
        }
      }
      return transaction(async tx => {
        const existing = await tx.interview.findUnique({ where: { ownerId_requestId: { ownerId, requestId } }, include })
        if (existing) {
          if (JSON.stringify(existing.preferences) !== JSON.stringify(preferences)) {
            // PostgreSQL jsonb reorders object keys; compare canonical values.
            if (!isDeepStrictEqual(existing.preferences, preferences)) {
              throw new ApiError(409, 'REQUEST_ID_REUSED', 'Use a new request ID for different preferences.')
            }
          }
          return { session: snapshot(existing), created: false }
        }
        const row = await tx.interview.create({
          data: { ownerId, requestId, preferences, generation, questions: { create: questions.map((q, position) => ({
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
    async followup(id, questionId, revision) {
      const row = await get(db, id)
      if (!ai || row.generation?.mode !== ai.mode) throw new ApiError(409, 'AI_MODE_CHANGED', 'AI mode changed or is unavailable. Start a new interview for AI features.')
      const existing = row.questions.find(q => q.metadata.parentId === questionId)
      if (existing) return snapshot(row)
      if (row.status !== 'active' || row.revision !== revision) throw new ApiError(409, 'STALE_INTERVIEW', 'Save your latest answers or reopen from History before requesting a follow-up.')
      const parent = row.questions.find(q => q.id === questionId && !q.metadata.parentId)
      const answer = row.answers.find(a => a.questionId === questionId)
      if (!parent || !answer) throw new ApiError(400, 'ANSWER_REQUIRED', 'Save an answer to a base question first.')
      if (row.questions.filter(q => q.metadata.parentId).length >= MAX_FOLLOWUPS) throw new ApiError(409, 'FOLLOWUP_LIMIT', 'The two-follow-up limit has been reached.')
      const result = await ai.run(ownerId, `followup:${id}:${questionId}`, 'followup', {
        preferences: row.preferences, parent: { text: parent.text, subject: parent.subject, category: parent.metadata.category }, answer: answer.text,
        questions: row.questions.filter(q => !q.metadata.parentId).map(q => ({ text: q.text })),
      })
      return transaction(async tx => {
        const current = await get(tx, id)
        if (current.questions.some(q => q.metadata.parentId === questionId)) return snapshot(current)
        if (current.status !== 'active' || current.revision !== revision) throw new ApiError(409, 'STALE_INTERVIEW', 'The interview changed while AI was working. Your saved answers are safe.')
        if (current.questions.filter(q => q.metadata.parentId).length >= MAX_FOLLOWUPS) throw new ApiError(409, 'FOLLOWUP_LIMIT', 'The two-follow-up limit has been reached.')
        if (current.questions.some(q => normalize(q.text) === normalize(result.text))) throw new ApiError(409, 'DUPLICATE_QUESTION', 'The provider repeated a question; continue without this follow-up.')
        await tx.question.create({ data: { interviewId: id, id: randomUUID(), position: current.questions.length, text: result.text, subject: parent.subject, metadata: { category: parent.metadata.category, parentId: questionId, source: ai.mode === 'live' ? 'gemini' : 'mock', applicability: 'Follow-up on your saved answer' } } })
        await tx.interview.update({ where: { id }, data: { revision: { increment: 1 } } })
        return snapshot(await get(tx, id))
      })
    },
    async report(id) {
      const row = await get(db, id)
      if (row.feedback) return snapshot(row)
      if (row.status !== 'completed') throw new ApiError(409, 'INTERVIEW_ACTIVE', 'Complete and save your interview before requesting feedback.')
      if (!ai || row.generation?.mode !== ai.mode) throw new ApiError(409, 'AI_MODE_CHANGED', 'AI mode changed or this is an older interview. Start a new interview for AI feedback.')
      const input = { preferences: row.preferences, questions: row.questions.map(q => ({ id: q.id, text: q.text, subject: q.subject, category: q.metadata.category })), answers: Object.fromEntries(row.answers.map(a => [a.questionId, a.text])) }
      const result = await ai.run(ownerId, 'report:' + id, 'report', input)
      return transaction(async tx => {
        const current = await get(tx, id)
        if (current.feedback) return snapshot(current)
        await tx.feedbackReport.create({ data: { interviewId: id, source: ai.mode, modelVersion: ai.model, rubricVersion: RUBRIC, content: aggregate(result, input.questions) } })
        return snapshot(await get(tx, id))
      })
    },
    async remove(id) {
      return transaction(async tx => {
        const row = await get(tx, id)
        await tx.interview.delete({ where: { id } })
        // Keep quota/idempotency metadata but erase cached content with the interview.
        await tx.aiOperation.updateMany({ where: { ownerId, OR: [{ key: 'plan:' + row.requestId }, { key: 'report:' + id }, { key: { startsWith: 'followup:' + id + ':' } }] }, data: { result: null, status: 'failed', errorCode: 'DELETED' } })
        return { id, deleted: true }
      })
    },
  }
}
