import { z } from 'zod'
export const RUBRIC = 'coaching-v1'
export const MAX_FOLLOWUPS = 2
export const dimensions = {
  technical: ['correctness', 'relevance', 'reasoning', 'clarity', 'depth'],
  behavioral: ['relevance', 'structure', 'specificity', 'reflection'],
}
const text = z.string().trim().min(1).max(1200)
const notes = z.array(text).min(1).max(4)
export const planSchema = z.strictObject({ questions: z.array(z.strictObject({ text: text, subject: z.string().max(30), category: z.enum(['technical', 'behavioral']) })).min(3).max(10) })
export const followupSchema = z.strictObject({ text })
export const reportSchema = z.strictObject({
  summary: text,
  answers: z.array(z.strictObject({
    questionId: z.string().max(100),
    scores: z.array(z.strictObject({ dimension: z.enum([...new Set(Object.values(dimensions).flat())]), value: z.number().int().min(0).max(5) })).min(4).max(5),
    strengths: notes, missing: notes, improvements: notes,
    evidence: z.array(z.string().min(1).max(300)).min(1).max(3),
    example: z.string().max(1500),
  })).min(1).max(12),
})
export const schemas = { plan: planSchema, followup: followupSchema, report: reportSchema }
export const normalize = value => value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
export function validateOutput(kind, value, input) {
  const parsed = schemas[kind].parse(value)
  if (kind === 'plan') {
    if (parsed.questions.length !== input.slots.length) throw new Error('Question count mismatch')
    const seen = new Set()
    parsed.questions.forEach((q, i) => {
      if (q.subject !== input.slots[i].subject || q.category !== input.slots[i].category || seen.has(normalize(q.text))) throw new Error('Invalid question plan')
      seen.add(normalize(q.text))
    })
  }
  if (kind === 'followup' && input.questions.some(q => normalize(q.text) === normalize(parsed.text))) throw new Error('Duplicate question')
  if (kind === 'report') {
    if (parsed.answers.length !== input.questions.length) throw new Error('Report coverage mismatch')
    const seen = new Set()
    for (const a of parsed.answers) {
      const q = input.questions.find(q => q.id === a.questionId)
      if (!q || seen.has(q.id)) throw new Error('Invalid report question')
      seen.add(q.id)
      const required = dimensions[q.category]
      if (a.scores.length !== required.length || new Set(a.scores.map(s => s.dimension)).size !== required.length || a.scores.some(s => !required.includes(s.dimension))) throw new Error('Invalid rubric')
      if (a.evidence.some(quote => !input.answers[q.id].includes(quote))) throw new Error('Evidence must quote the actual answer')
    }
  }
  return parsed
}
export function aggregate(report, questions) {
  const subjects = [...new Set(questions.map(q => q.subject))].map(subject => {
    const ids = questions.filter(q => q.subject === subject).map(q => q.id)
    const answers = report.answers.filter(a => ids.includes(a.questionId))
    const scores = answers.flatMap(a => a.scores.map(s => s.value))
    return { subject, score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10, improvements: [...new Set(answers.flatMap(a => a.improvements))].slice(0, 4) }
  })
  return { ...report, subjects, disclaimer: 'Coaching guidance only. Scores can be wrong and do not predict hiring outcomes.' }
}
