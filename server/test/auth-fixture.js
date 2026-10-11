import { generateKeyPairSync, sign } from 'node:crypto'

// Ephemeral keys exist only in this test process; never accepted by a live Clerk app.
const keys = generateKeyPairSync('rsa', { modulusLength: 2048 })
export const authOptions = {
  publishableKey: 'pk_test_' + Buffer.from('auth-fixture.clerk.accounts.dev$').toString('base64'),
  secretKey: 'sk_test_fixture_not_a_live_secret',
  jwtKey: keys.publicKey.export({ type: 'spki', format: 'pem' }),
}
export function tokenFor(userId = 'user_test_a', overrides = {}) {
  const now = Math.floor(Date.now() / 1000)
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url')
  const input = encode({ alg: 'RS256', typ: 'JWT', kid: 'fixture' }) + '.' + encode({
    iss: 'https://auth-fixture.clerk.accounts.dev',
    sub: userId, sid: 'sess_' + userId,
    azp: 'http://127.0.0.1:5173', iat: now - 1, nbf: now - 1, exp: now + 120,
    v: 2, sts: 'active', fva: [0, -1], ...overrides,
  })
  return input + '.' + sign('RSA-SHA256', Buffer.from(input), keys.privateKey).toString('base64url')
}
export const authEnvironment = {
  CLERK_PUBLISHABLE_KEY: authOptions.publishableKey,
  CLERK_SECRET_KEY: authOptions.secretKey,
  CLERK_JWT_KEY: authOptions.jwtKey,
}
