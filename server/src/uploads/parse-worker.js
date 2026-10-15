import { parentPort, workerData } from 'node:worker_threads'
import mammoth from 'mammoth'
import yauzl from 'yauzl'
const bytes = Buffer.from(workerData.bytes)
async function checkZip() {
  await new Promise((resolve, reject) => yauzl.fromBuffer(bytes, { lazyEntries: true }, (error, zip) => {
    if (error) return reject(error)
    let count = 0, total = 0, document = false, contentTypes = false
    const fail = () => { zip.close(); reject(new Error('Invalid document archive')) }
    zip.on('error', reject)
    zip.on('entry', entry => {
      count++; total += entry.uncompressedSize
      if (count > 500 || total > 20 * 1024 * 1024 || entry.generalPurposeBitFlag & 1 || /vbaProject|embeddings\//i.test(entry.fileName)) return fail()
      if (entry.fileName === 'word/document.xml') document = true
      if (entry.fileName === '[Content_Types].xml') contentTypes = true
      zip.readEntry()
    })
    zip.on('end', () => document && contentTypes ? resolve() : reject(new Error('Not DOCX')))
    zip.readEntry()
  }))
}
try {
  let text
  if (workerData.type === 'docx') { await checkZip(); text = (await mammoth.extractRawText({ buffer: bytes })).value }
  else {
    const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs')
    const loading = getDocument({ data: new Uint8Array(bytes), isEvalSupported: false, useSystemFonts: false, disableFontFace: true, verbosity: 0 })
    const pdf = await loading.promise
    if (pdf.numPages > 20) throw new Error('Too many pages')
    const pages = []
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i); const content = await page.getTextContent()
      pages.push(content.items.map(item => item.str || '').join(' '))
      if (pages.join('\n').length > 12000) throw new Error('Too much text')
    }
    text = pages.join('\n'); await loading.destroy()
  }
  text = text.split(String.fromCharCode(0)).join('').trim()
  if (!text || text.length > 12000) throw new Error('Empty or oversized text')
  parentPort.postMessage({ text })
} catch { parentPort.postMessage({ error: true }) }
