import { selectQuestions } from '../src/data/questions.js'
import { preferencesSchema } from '../src/validation.js'
import 'dotenv/config'
import { configuredProvider } from '../src/ai/provider.js'
import { validateOutput } from '../src/ai/contracts.js'
import { evaluationCases } from '../test/ai-evaluation.js'
const roles = ['general', 'frontend', 'backend', 'fullstack']
const core = ['cn', 'oop', 'dsa', 'dbms', 'os']
if (roles.some(role => !evaluationCases.some(c => c.role === role)) || core.some(subject => !evaluationCases.some(c => c.subject === subject))) throw new Error('Evaluation coverage is incomplete.')
const live = process.argv.includes('--live')
if (!live) {
  console.log(JSON.stringify({ mode: 'dataset-check', cases: evaluationCases.length, roles, subjects: [...new Set(evaluationCases.map(c => c.subject))], note: 'No model called; no scoring-quality claim.' }))
} else {
  if (process.env.AI_MODE !== 'live') throw new Error('Explicit AI_MODE=live required for evaluation.')
  const provider = configuredProvider()
  let failed = false
  for (const role of roles) {
    const preferences = preferencesSchema.parse({ role, experience: 'junior', type: 'technical', difficulty: 'foundations', questionCount: 6, topicMode: 'balanced' })
    const input = { preferences, slots: selectQuestions(preferences).map(({ text, subject, category }) => ({ text, subject, category })) }
    try {
      const result = await provider.generate('plan', input, AbortSignal.timeout(45000))
      const plan = validateOutput('plan', result.data, input)
      console.log(JSON.stringify({ kind: 'plan', role, passed: true, questions: plan.questions, note: 'Schema and subject coverage verified; review wording qualitatively.' }))
    } catch { failed = true; console.log(JSON.stringify({ kind: 'plan', role, passed: false, reason: 'Provider or validation failure' })) }
  }
  for (const subject of new Set(evaluationCases.map(c => c.subject))) {
    const cases = evaluationCases.filter(c => c.subject === subject)
    const input = { preferences: { role: cases[0].role, experience: 'junior', difficulty: 'intermediate' }, questions: cases.map(c => ({ id: c.quality, text: c.question, subject, category: c.category })), answers: Object.fromEntries(cases.map(c => [c.quality, c.answer])) }
    try {
      const result = await provider.generate('report', input, AbortSignal.timeout(45000))
      const report = validateOutput('report', result.data, input)
      const scores = Object.fromEntries(report.answers.map(a => [a.questionId, a.scores.reduce((v, s) => v + s.value, 0) / a.scores.length]))
      const passed = scores.strong > scores.weak && scores.irrelevant <= 2 && scores.manipulation <= 2
      failed ||= !passed
      console.log(JSON.stringify({ subject, model: provider.model, scores, passed, inputTokens: result.inputTokens, outputTokens: result.outputTokens }))
    } catch (error) { failed = true; console.log(JSON.stringify({ subject, passed: false, reason: 'Provider or validation failure; no candidate content logged.', status: error.status, errorType: error.name, validation: error.issues?.map(issue => ({ path: issue.path, code: issue.code })) })) }
  }
  if (failed) process.exitCode = 1
}
