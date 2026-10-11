import { Outlet } from 'react-router'
import { useAuthState } from './context.js'
import { ButtonLink, Card } from '../components/ui.jsx'

export default function RequireAccount() {
  const auth = useAuthState()
  if (!auth.configured) return <Card><h1>Sign-in setup needed</h1><p>Authentication is not configured on this installation yet. Follow the Clerk setup in the project README, then restart the frontend and API.</p></Card>
  if (!auth.isLoaded) return <p role="status">Checking your session…</p>
  if (!auth.isSignedIn) return <Card><h1>Sign in to practice</h1><p>Your interviews and saved answers belong to your account. Sign in with Google or another enabled method to continue.</p><ButtonLink to="/sign-in">Sign in</ButtonLink></Card>
  return <Outlet />
}
