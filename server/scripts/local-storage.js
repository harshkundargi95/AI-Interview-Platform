import S3rver from 's3rver'
import { mkdir } from 'node:fs/promises'
await mkdir('.data/objects', { recursive: true })
const server = new S3rver({ address: '127.0.0.1', port: 4569, silent: true, directory: '.data/objects', configureBuckets: [{ name: 'resumes' }] })
await server.run()
console.log('Development S3 emulator: 127.0.0.1:4569. Local trusted-machine use only; not production storage.')
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, async () => { await server.close(); process.exit(0) })
