import 'dotenv/config'
import { configuredProvider } from '../src/ai/provider.js'
import { validateOutput } from '../src/ai/contracts.js'
import { evaluationCases } from '../test/ai-evaluation.js'
const live = process.argv.includes('--live')
if (!live) {
  console.log(JSON.stringify({ mode: 'dataset-check', cases: evaluationCases.length, subjects: [...new Set(evaluationCases.map(c => c.subject))], note: 'No model called; no scoring-quality claim.' }))
} else {
  if (process.env.AI_MODE !== 'live') throw new Error('Explicit AI_MODE=live required for evaluation.')
  const provider = configuredProvider()
  let failed = false
  for (const subject of new Set(evaluationCases.map(c => c.subject))) {
    const cases = evaluationCases.filter(c => c.subject === subject)
    const input = { preferences: { role: 'general', experience: 'junior', difficulty: 'intermediate' }, questions: cases.map(c => ({ id: c.quality, text: c.question, subject, category: c.category })), answers: Object.fromEntries(cases.map(c => [c.quality, c.answer])) }
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
