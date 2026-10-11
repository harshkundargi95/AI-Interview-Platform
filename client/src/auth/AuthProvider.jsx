import { useMemo } from 'react'
import { ClerkProvider, useAuth, useClerk } from '@clerk/react'
import { AuthContext } from './context.js'
import { createInterviewApi } from '../interview/api.js'

function ClerkSession({ children }) {
  const { isLoaded, isSignedIn, userId, getToken } = useAuth()
  const clerk = useClerk()
  const { signOut } = clerk
  const api = useMemo(() => createInterviewApi(async () => {
    if (!userId || clerk.user?.id !== userId) return null
    const token = await getToken({ skipCache: true })
    return clerk.user?.id === userId ? token : null
  }), [getToken, userId, clerk])
  const value = { configured: true, isLoaded, isSignedIn, userId, api, signOut }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default function AuthProvider({ children }) {
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
  if (!publishableKey || publishableKey.includes('YOUR_')) return children
  return <ClerkProvider publishableKey={publishableKey} signInUrl="/sign-in" signUpUrl="/sign-up" signInForceRedirectUrl="/setup" signUpForceRedirectUrl="/setup" afterSignOutUrl="/">
    <ClerkSession>{children}</ClerkSession>
  </ClerkProvider>
}
