import { createPersistentInterviewService } from '../src/services/persistentInterviews.js'
import { preferencesSchema } from '../src/validation.js'
import { beforeAll, afterAll, describe, it, expect } from 'vitest'
import { readFile } from 'node:fs/promises'
import request from 'supertest'
import { randomUUID } from 'node:crypto'
import { createDatabase } from '../src/database.js'
import { createApp } from '../src/app.js'
import { cleanExpiredResumes } from '../src/uploads/routes.js'
import { authOptions, tokenFor } from './auth-fixture.js'
describe.skipIf(!process.env.TEST_DATABASE_URL)('private resume lifecycle', () => {
 let db, app, bytes, id
 const objects = new Map(), a = 'Bearer ' + tokenFor('resume-a-' + randomUUID()), b = 'Bearer ' + tokenFor('resume-b-' + randomUUID())
 const storage = { put: async (key, value) => objects.set(key, value), get: async key => objects.get(key), remove: async key => objects.delete(key) }
 beforeAll(async () => { db = createDatabase(process.env.TEST_DATABASE_URL); app = createApp({ db, storage, authOptions }); bytes = await readFile(new URL('./fixtures/resume.docx', import.meta.url)) })
 afterAll(async () => db?.$disconnect())
 it('replays personalized starts after PostgreSQL JSON key reordering', async () => {
   const owner = await db.user.create({ data: { clerkUserId: 'personalization-' + randomUUID() } })
   const service = createPersistentInterviewService(db, owner.id)
   const preferences = preferencesSchema.parse({ role: 'backend', type: 'technical', difficulty: 'foundations', personalization: { jobDescription: 'SQL required', resumeText: 'A project', requiredSkills: ['SQL'], optionalSkills: [] } })
   const input = { requestId: randomUUID(), preferences }
   const first = await service.create(input), second = await service.create(input)
   expect(second.created).toBe(false); expect(second.session).toEqual(first.session)
   await expect(service.create({ ...input, preferences: { ...preferences, personalization: { ...preferences.personalization, resumeText: 'Different project' } } })).rejects.toMatchObject({ status: 409 })
   await service.remove(first.session.id); await db.user.delete({ where: { id: owner.id } })
 })
 it('requires auth and validates real bytes before storing', async () => {
   expect((await request(app).post('/api/v1/resumes?filename=a.docx').set('Content-Type', 'application/octet-stream').send(bytes)).status).toBe(401)
   expect((await request(app).post('/api/v1/resumes?filename=a.pdf').set('Authorization', a).set('Content-Type', 'application/octet-stream').send(Buffer.from('fake'))).status).toBe(400)
   const result = await request(app).post('/api/v1/resumes?filename=a.docx').set('Authorization', a).set('Content-Type', 'application/octet-stream').send(bytes)
   expect(result.status).toBe(201); id = result.body.data.id; expect(result.body.data.text).toContain('PostgreSQL'); expect(objects.size).toBe(1)
 })
 it('denies foreign downloads/deletion and requires expiring owner-bound links', async () => {
   const link = (await request(app).post(`/api/v1/resumes/${id}/link`).set('Authorization', a)).body.data.path
   expect((await request(app).get('/api/v1' + link).set('Authorization', a)).status).toBe(200)
   expect((await request(app).get('/api/v1' + link).set('Authorization', b)).status).toBe(404)
   expect((await request(app).get('/api/v1' + link.replace(/expires=\d+/, 'expires=1')).set('Authorization', a)).status).toBe(403)
   expect((await request(app).delete(`/api/v1/resumes/${id}`).set('Authorization', b)).status).toBe(404)
   expect((await request(app).get('/api/v1/resumes').set('Authorization', b)).body.data).toEqual([])
 })
 it('expires and deletes file/text, revoking existing links', async () => {
   await db.resume.update({ where: { id }, data: { expiresAt: new Date(0) } })
   expect((await request(app).post(`/api/v1/resumes/${id}/link`).set('Authorization', a)).status).toBe(404)
   await cleanExpiredResumes(db, storage)
   expect(objects.size).toBe(0); expect(await db.resume.findUnique({ where: { id } })).toBeNull()
 })
 it('supports a fresh upload after malformed processing fails', async () => {
   const result = await request(app).post('/api/v1/resumes?filename=a.docx').set('Authorization', a).set('Content-Type', 'application/octet-stream').send(bytes)
   expect(result.status).toBe(201)
   expect((await request(app).delete('/api/v1/resumes/' + result.body.data.id).set('Authorization', a)).status).toBe(200)
   expect(objects.size).toBe(0)
 })
})
