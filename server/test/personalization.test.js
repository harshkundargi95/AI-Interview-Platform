import { describe, it, expect } from 'vitest'
import { readFile } from 'node:fs/promises'
import { parseResume, MAX_UPLOAD } from '../src/uploads/parse.js'
import { extractSkills, scopeWarnings } from '../../shared/personalization.js'
import { preferencesSchema } from '../src/validation.js'
import { createGeminiProvider } from '../src/ai/provider.js'
it('extracts editable required/optional skills and explains scope conflicts', () => {
  expect(extractSkills('Required: React and SQL\nPreferred: Python')).toEqual({ requiredSkills: ['React', 'SQL'], optionalSkills: ['Python'] })
  expect(scopeWarnings({ topicMode: 'selected' }, { jobDescription: 'Senior engineer' })).toHaveLength(2)
})
it('bounds personalization and keeps legacy preferences compatible', () => {
  const preferences = { role: 'general', type: 'mixed', difficulty: 'foundations' }
  expect(preferencesSchema.parse(preferences).personalization).toBeUndefined()
  expect(() => preferencesSchema.parse({ ...preferences, personalization: { resumeText: 'x'.repeat(12001) } })).toThrow()
})
describe.each(['pdf', 'docx'])('%s parsing', type => {
  it('extracts real document text', async () => {
    const bytes = await readFile(new URL(`./fixtures/resume.${type}`, import.meta.url))
    expect((await parseResume(bytes, 'resume.' + type)).text).toContain('PostgreSQL')
  }, 15000)
})
it('rejects spoofed, tiny, oversized and corrupt files safely', async () => {
  for (const [bytes, name] of [[Buffer.from('hello'), 'resume.pdf'], [Buffer.from('x'), 'resume.docx'], [Buffer.alloc(MAX_UPLOAD + 1), 'resume.pdf'], [Buffer.from('PK\x03\x04broken'), 'resume.docx']]) await expect(parseResume(bytes, name)).rejects.toHaveProperty('status')
})
it('sends context only for plans and removes email/link text from resumes', async () => {
  const calls = []
  const provider = createGeminiProvider({ apiKey: 'test-only', model: 'test-model', client: { models: { generateContent: async value => { calls.push(JSON.parse(value.contents)); return { text: '{}' } } } } })
  const preferences = { role: 'backend', personalization: { resumeText: 'Project contact a@example.com https://example.com', jobDescription: 'SQL required' } }
  await provider.generate('plan', { preferences, slots: [] })
  await provider.generate('report', { preferences, questions: [], answers: {} })
  expect(calls[0].data.preferences.personalization.resumeText).not.toContain('a@example.com')
  expect(calls[1].data.preferences.personalization).toBeUndefined()
})
