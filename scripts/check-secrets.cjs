const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const root = path.resolve(__dirname, '..')
const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
const tracked = git(['ls-files', '-z']).split('\0').filter(Boolean)
const files = [...new Set([...tracked, ...git(['ls-files', '--others', '--exclude-standard', '-z']).split('\0').filter(Boolean)])]
const forbidden = file => /(^|\/)(node_modules|\.data)(\/|$)|(^|\/)\.env(?:\..*)?$|\.(?:sqlite|db)(?:-wal|-shm)?$/.test(file) && !file.endsWith('.env.example')
const patterns = [/AIza[0-9A-Za-z_-]{35}/, /sk_(?:live|test)_[A-Za-z0-9]{20,}/, /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/]
const secrets = []
for (const relative of ['server/.env', 'client/.env']) {
  const file = path.join(root, relative)
  if (!fs.existsSync(file)) continue
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]*(?:SECRET|API_KEY|DATABASE_URL|JWT_KEY)[A-Z0-9_]*)\s*=\s*(.+?)\s*$/)
    if (match) { const value = match[2].replace(/^['"]|['"]$/g, ''); const publicLocalFixture = match[1] === 'DATABASE_URL' && value === 'postgresql://interview_dev:local-development-only@127.0.0.1:55432/interview_dev'; if (value.length >= 16 && !value.includes('YOUR_') && !publicLocalFixture) secrets.push(value) }
  }
}
const failures = new Set()
function scan(label, bytes) {
  const content = bytes.toString('utf8')
  if (patterns.some(pattern => pattern.test(content)) || secrets.some(secret => content.includes(secret))) failures.add(label)
}
for (const file of files) {
  if (forbidden(file)) failures.add(file)
  const absolute = path.join(root, file)
  if (fs.existsSync(absolute) && fs.statSync(absolute).isFile()) scan(file, fs.readFileSync(absolute))
}
// Inspect committed HEAD separately so uncommitted cleanup cannot hide a secret.
for (const file of git(['ls-tree', '-r', '--name-only', 'HEAD']).split('\n').filter(Boolean)) {
  if (forbidden(file)) failures.add('HEAD:' + file)
  scan('HEAD:' + file, git(['show', 'HEAD:' + file]))
}
function bundles(dir) {
  if (!fs.existsSync(dir)) throw new Error('Build the client before scanning bundles.')
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) bundles(file)
    else { const bytes = fs.readFileSync(file); scan(path.relative(root, file), bytes); if (/postgres(?:ql)?:\/\//.test(bytes.toString('utf8'))) failures.add(path.relative(root, file)) }
  }
}
bundles(path.join(root, 'client/dist'))
if (failures.size) { console.error('Secret/exclusion scan failed in files (values suppressed):', [...failures]); process.exitCode = 1 }
else console.log('Secret/exclusion scan passed: current source, committed HEAD, and client bundles. Pattern/value scan is not a guarantee of absence.')
