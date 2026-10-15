import { parseId } from '../validation.js'
import express from 'express'
import { createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto'
import { ApiError } from '../middleware/errors.js'
import { parseResume, MAX_UPLOAD } from './parse.js'
const secret = randomBytes(32)
const sign = (owner, id, expires) => createHmac('sha256', secret).update(`${owner}:${id}:${expires}`).digest('hex')
const publicRow = ({ id, filename, text, expiresAt }) => ({ id, filename, text, expiresAt })
export function resumeRoutes(db, storage) {
  const router = express.Router(), active = new Set()
  router.param('id', (req, res, next, id) => { try { parseId(id); next() } catch (error) { next(error) } })
  async function owned(req) {
    const row = await db.resume.findFirst({ where: { id: req.params.id, ownerId: req.ownerId, state: 'ready', expiresAt: { gt: new Date() } } })
    if (!row) throw new ApiError(404, 'RESUME_NOT_FOUND', 'Resume not found or expired.')
    return row
  }
  router.get('/', async (req, res) => res.json({ data: await db.resume.findMany({ where: { ownerId: req.ownerId, state: 'ready', expiresAt: { gt: new Date() } }, select: { id: true, filename: true, text: true, expiresAt: true }, orderBy: { createdAt: 'desc' } }) }))
  router.post('/', (req, res, next) => {
    if (active.has(req.ownerId) || active.size >= 2) return next(new ApiError(429, 'UPLOAD_BUSY', 'An upload is already processing. Wait, then retry.'))
    active.add(req.ownerId)
    // Do not free the parser slot on disconnect until bounded processing finishes.
    const timer = setTimeout(() => active.delete(req.ownerId), 30000)
    timer.unref()
    res.once('finish', () => { clearTimeout(timer); active.delete(req.ownerId) })
    next()
  }, express.raw({ type: 'application/octet-stream', limit: MAX_UPLOAD }), async (req, res) => {
    if (!Buffer.isBuffer(req.body)) throw new ApiError(415, 'FILE_REQUIRED', 'Upload PDF/DOCX bytes as application/octet-stream.')
    const filename = String(req.query.filename || '').replace(/[^a-zA-Z0-9._ -]/g, '_').slice(-120)
    const parsed = await parseResume(req.body, filename)
    const id = randomUUID(), objectKey = 'resumes/' + id
    const row = await db.$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(6102027)`
      if (await tx.resume.count({ where: { ownerId: req.ownerId } }) >= 5) throw new ApiError(429, 'RESUME_LIMIT', 'Keep up to five resumes. Delete an older resume first.')
      return tx.resume.create({ data: { id, ownerId: req.ownerId, filename, objectKey, type: parsed.type, text: '', expiresAt: new Date(Date.now() + 60000) } })
    })
    try {
      await storage.put(objectKey, req.body)
      const ready = await db.resume.update({ where: { id }, data: { state: 'ready', text: parsed.text, expiresAt: new Date(Date.now() + 86400000) } })
      res.status(201).json({ data: publicRow(ready) })
    } catch {
      // Keep pending metadata if storage deletion fails so the sweeper can retry.
      try { await storage.remove(objectKey); await db.resume.delete({ where: { id: row.id } }) } catch { /* next cleanup */ }
      throw new ApiError(503, 'STORAGE_UNAVAILABLE', 'Resume storage is unavailable. Start local storage, then retry. Your text draft is unchanged.')
    }
  })
  router.post('/:id/link', async (req, res) => {
    const row = await owned(req), expires = Date.now() + 60000
    res.json({ data: { path: `/resumes/${row.id}/download?expires=${expires}&signature=${sign(req.ownerId, row.id, expires)}`, expiresAt: new Date(expires) } })
  })
  router.get('/:id/download', async (req, res) => {
    const row = await owned(req), expires = Number(req.query.expires), signature = String(req.query.signature || '')
    const expected = sign(req.ownerId, row.id, expires)
    if (!Number.isSafeInteger(expires) || expires < Date.now() || expires > Date.now() + 60000 || !/^[a-f0-9]{64}$/.test(signature) || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw new ApiError(403, 'LINK_EXPIRED', 'Download link expired. Request a new one.')
    const bytes = await storage.get(row.objectKey)
    res.set('Content-Type', 'application/octet-stream').set('Content-Disposition', `attachment; filename="${row.type === 'pdf' ? 'resume.pdf' : 'resume.docx'}"`).send(Buffer.from(bytes))
  })
  router.delete('/:id', async (req, res) => {
    const row = await db.resume.findFirst({ where: { id: req.params.id, ownerId: req.ownerId } })
    if (!row) throw new ApiError(404, 'RESUME_NOT_FOUND', 'Resume not found.')
    // Revoke downloads and erase extracted text before deleting the stored file.
    await db.resume.update({ where: { id: row.id }, data: { state: 'pending', text: '', expiresAt: new Date(0) } })
    try { await storage.remove(row.objectKey); await db.resume.delete({ where: { id: row.id } }) }
    catch { throw new ApiError(503, 'STORAGE_UNAVAILABLE', 'Resume access is revoked. File deletion will retry when storage is available.') }
    res.json({ data: { deleted: true } })
  })
  return router
}
export async function cleanExpiredResumes(db, storage) {
  for (const row of await db.resume.findMany({ where: { expiresAt: { lte: new Date() } }, take: 100 })) {
    await db.resume.update({ where: { id: row.id }, data: { text: '', state: 'pending' } })
    try { await storage.remove(row.objectKey); await db.resume.delete({ where: { id: row.id } }) } catch { /* preserve metadata for retry, never log document contents */ }
  }
}
