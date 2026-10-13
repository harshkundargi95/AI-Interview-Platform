import { clerkMiddleware, getAuth } from '@clerk/express'
import { ApiError } from './errors.js'
import { createPersistentInterviewService } from '../services/persistentInterviews.js'

export function createAuthentication(db, { publishableKey, secretKey, jwtKey, authorizedParties }, ai = null) {
  if (!/^pk_(test|live)_/.test(publishableKey || '') || !/^sk_(test|live)_/.test(secretKey || '')) throw new Error('Configure CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY in server/.env. Authentication cannot be bypassed.')
  if (!authorizedParties?.length) throw new Error('Explicit authorized frontend origins are required.')
  const verify = clerkMiddleware({ publishableKey, secretKey, jwtKey, authorizedParties })
  const unauthorized = () => new ApiError(401, 'AUTH_REQUIRED', 'Your session is missing or expired. Sign in again to continue.')
  return [
    // Bearer-only API: cookies alone never authorize a read or mutation.
    (req, res, next) => {
      if (!/^Bearer [^\s]+$/i.test(req.get('Authorization') || '')) return next(unauthorized())
      verify(req, res, error => error ? next(unauthorized()) : next())
    },
    async (req, res, next) => {
      const auth = getAuth(req, { acceptsToken: 'session_token', treatPendingAsSignedOut: true })
      if (!auth.isAuthenticated || !auth.userId || !auth.sessionId) throw unauthorized()
      // Clerk verified the signature and lifetime; also require an explicit allowed azp.
      if (!authorizedParties.includes(auth.sessionClaims?.azp)) throw unauthorized()
      const user = await db.user.upsert({
        where: { clerkUserId: auth.userId },
        create: { clerkUserId: auth.userId },
        update: {},
      })
      if (user.legacy) throw unauthorized()
      req.interviewService = createPersistentInterviewService(db, user.id, ai)
      next()
    },
  ]
}
