import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { questionBank, selectQuestions } from '../src/data/questions.js'
import { defaultPreferences, trackSubjects, languageLabels } from '../../shared/interviewOptions.js'


it('has explicit unique IDs and enough matching questions across every supported track, level, difficulty, type, count and subject', () => {
  expect(new Set(questionBank.map((q) => q.id)).size).toBe(questionBank.length)
  for (const role of Object.keys(trackSubjects)) {
    for (const experience of ['internship', 'junior']) {
      for (const difficulty of ['foundations', 'intermediate', 'advanced']) {
        for (const type of ['technical', 'behavioral', 'mixed']) {
          for (let questionCount = 3; questionCount <= 10; questionCount++) {
            const choices = { ...defaultPreferences, role, experience, difficulty, type, questionCount }
            const questions = selectQuestions(choices)
            expect(questions).toHaveLength(questionCount)
            expect(new Set(questions.map((q) => q.id)).size).toBe(questionCount)
            expect(questions.every((q) => q.tracks.includes(role) && q.experience === experience && q.difficulty === difficulty)).toBe(true)
          }
        }
      }
    }
    for (const subject of trackSubjects[role]) {
      for (const language of Object.keys(languageLabels)) {
        const questions = selectQuestions({ ...defaultPreferences, role, type: 'technical', topicMode: 'selected', subjects: [subject], language, questionCount: 10 })
        expect(questions).toHaveLength(10)
        expect(questions.every((q) => q.subject === subject && (q.languages.includes(language) || q.languages.includes('neutral')))).toBe(true)
      }
    }
  }
})

for (const role of Object.keys(trackSubjects)) {
  for (const type of ['technical', 'behavioral', 'mixed']) {
    it(`completes a ten-question ${role} ${type} interview and safely retries`, async () => {
      const app = createApp()
      const response = await request(app).post('/api/v1/interviews').send({ requestId: randomUUID(), preferences: { ...defaultPreferences, role, type, experience: 'junior', questionCount: 10 } })
      expect(response.status).toBe(201)
      const session = response.body.data
      const answers = session.questions.map((q) => ({ questionId: q.id, text: '界'.repeat(3000) }))
      const path = `/api/v1/interviews/${session.id}/complete`
      expect((await request(app).post(path).send({ answers: answers.slice(0, 5) })).status).toBe(409)
      const completed = await request(app).post(path).send({ answers })
      expect(completed.status).toBe(200)
      expect((await request(app).post(path).send({ answers })).body).toEqual(completed.body)
      expect(completed.body.data.questions).toEqual(session.questions)
    })
  }
}

it('covers all selected CS topics, respects language/technology matches and remains deterministic', () => {
  const p = { ...defaultPreferences, role: 'backend', type: 'mixed', questionCount: 10, topicMode: 'selected', subjects: ['cn', 'oop', 'dsa', 'dbms', 'os'] }
  const selected = selectQuestions(p)
  expect(new Set(selected.filter((q) => q.category === 'technical').map((q) => q.subject))).toEqual(new Set(p.subjects))
  expect(selectQuestions(p)).toEqual(selected)
  const react = selectQuestions({ ...defaultPreferences, type: 'technical', topicMode: 'selected', subjects: ['frontend'], language: 'javascript', technologies: ['react'] })
  expect(react[0].id).toBe('frontend-react-renders')
  expect(selectQuestions({ ...defaultPreferences, type: 'technical', technologies: ['react'] })[0].id).toBe('frontend-react-renders')
  const python = selectQuestions({ ...defaultPreferences, role: 'general', type: 'technical', topicMode: 'selected', subjects: ['programming'], language: 'python' })
  expect(python[0].id).toBe('programming-python-mutable')
  const go = selectQuestions({ ...defaultPreferences, role: 'backend', type: 'technical', topicMode: 'selected', subjects: ['backend'], language: 'go', technologies: ['spring'] })
  expect(go.every((q) => q.languages.includes('neutral') && q.subject === 'backend')).toBe(true)
})

it('rejects invalid scope, counts, duplicates and insufficient technical slots with clear errors', async () => {
  const app = createApp()
  const bad = [
    { experience: 'senior' }, { role: 'designer' }, { questionCount: 2 }, { questionCount: 11 }, { questionCount: 4.5 },
    { language: 'unknown' }, { technologies: ['unknown'] }, { technologies: ['react', 'react'] },
    { type: 'technical', topicMode: 'selected', subjects: [] },
    { role: 'backend', type: 'technical', topicMode: 'selected', subjects: ['frontend'] },
    { type: 'technical', topicMode: 'selected', subjects: ['cn', 'cn'] },
    { type: 'mixed', questionCount: 3, topicMode: 'selected', subjects: ['cn', 'oop', 'dsa'] },
  ]
  for (const changes of bad) {
    const response = await request(app).post('/api/v1/interviews').send({ requestId: randomUUID(), preferences: { ...defaultPreferences, ...changes } })
    expect(response.status).toBe(400)
    expect(response.body.error.message.length).toBeGreaterThan(10)
  }
})

it('defaults old frontend requests explicitly and normalizes preference order for retries', async () => {
  const app = createApp()
  const requestId = randomUUID()
  const old = { role: 'frontend', type: 'technical', difficulty: 'foundations' }
  const first = await request(app).post('/api/v1/interviews').send({ requestId, preferences: old })
  expect(first.status).toBe(201)
  expect(first.body.data.questions).toHaveLength(5)
  expect(first.body.data.preferences.experience).toBe('internship')
  const replay = await request(app).post('/api/v1/interviews').send({ requestId, preferences: { ...defaultPreferences, ...old } })
  expect(replay.body.data.id).toBe(first.body.data.id)
  const choices = { ...defaultPreferences, type: 'technical', topicMode: 'selected', subjects: ['cn', 'oop'], technologies: ['react', 'node'] }
  const secondKey = randomUUID()
  const a = await request(app).post('/api/v1/interviews').send({ requestId: secondKey, preferences: choices })
  const b = await request(app).post('/api/v1/interviews').send({ requestId: secondKey, preferences: { ...choices, subjects: ['oop', 'cn'], technologies: ['node', 'react'] } })
  expect(b.status).toBe(200)
  expect(a.body.data.id).toBe(b.body.data.id)
})
