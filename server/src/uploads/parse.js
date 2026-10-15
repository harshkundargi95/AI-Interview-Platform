import { Worker } from 'node:worker_threads'
import { ApiError } from '../middleware/errors.js'
export const MAX_UPLOAD = 2 * 1024 * 1024
export async function parseResume(bytes, filename) {
  const type = filename.toLowerCase().endsWith('.pdf') ? 'pdf' : filename.toLowerCase().endsWith('.docx') ? 'docx' : null
  if (!type || bytes.length < 5 || bytes.length > MAX_UPLOAD || (type === 'pdf' ? bytes.subarray(0, 5).toString() !== '%PDF-' : bytes.readUInt32LE(0) !== 0x04034b50)) throw new ApiError(400, 'INVALID_DOCUMENT', 'Choose a valid PDF or DOCX up to 2 MB.')
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./parse-worker.js', import.meta.url), { execArgv: [], workerData: { bytes, type }, resourceLimits: { maxOldGenerationSizeMb: 96, stackSizeMb: 4 } })
    const fail = () => reject(new ApiError(422, 'DOCUMENT_PARSE_FAILED', 'Could not extract text. Use a text-based PDF/DOCX (up to 20 pages and 12,000 characters), or paste text manually. You can retry the upload.'))
    const timer = setTimeout(() => { worker.terminate(); fail() }, 8000)
    worker.once('message', result => { clearTimeout(timer); worker.terminate(); if (result.error) fail(); else resolve({ text: result.text, type }) })
    worker.once('error', () => { clearTimeout(timer); fail() })
    worker.once('exit', code => { clearTimeout(timer); if (code !== 0) fail() })
  })
}
