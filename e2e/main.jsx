import { useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import App from '../client/src/App.jsx'
import { AuthContext } from '../client/src/auth/context.js'
import { createInterviewApi } from '../client/src/interview/api.js'
import '../client/src/index.css'

// Separate test entry point; not imported by the normal client or its build.
function Harness() {
  const [token, setToken] = useState(sessionStorage.getItem('fixture-token'))
  const api = useMemo(() => createInterviewApi(async () => token), [token])
  async function signIn() {
    const response = await fetch('/fixture-token')
    const { token } = await response.json()
    sessionStorage.setItem('fixture-token', token); setToken(token)
  }
  return <AuthContext.Provider value={{ configured: true, isLoaded: true, isSignedIn: Boolean(token), userId: token ? 'e2e-owner' : null, api,
    signOut: async () => { sessionStorage.removeItem('fixture-token'); setToken(null) } }}>
    {!token && <button onClick={signIn}>Sign in with test identity</button>}
    <App />
  </AuthContext.Provider>
}
const router = createBrowserRouter([{ path: '*', element: <Harness /> }])
createRoot(document.getElementById('root')).render(<RouterProvider router={router} />)
