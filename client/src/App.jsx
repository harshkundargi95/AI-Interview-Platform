import { Route, Routes } from 'react-router'
import Layout from './components/Layout.jsx'
import Landing from './pages/Landing.jsx'
import Setup from './pages/Setup.jsx'
import Interview from './pages/Interview.jsx'
import Feedback from './pages/Feedback.jsx'
import History from './pages/History.jsx'
import NotFound from './pages/NotFound.jsx'
import { InterviewProvider } from './interview/InterviewContext.jsx'
import './App.css'
import { useAuthState } from './auth/context.js'
import RequireAccount from './auth/RequireAccount.jsx'
import Account from './pages/Account.jsx'

export default function App() {
  const auth = useAuthState()
  return (
    <InterviewProvider key={auth.userId || 'signed-out'} api={auth.api}><Routes>
      <Route element={<Layout />}>
        <Route index element={<Landing />} />
        <Route path="sign-in/*" element={<Account />} />
        <Route path="sign-up/*" element={<Account signUp />} />
        <Route element={<RequireAccount />}>
          <Route path="setup" element={<Setup />} />
          <Route path="interview" element={<Interview />} />
          <Route path="feedback" element={<Feedback />} />
          <Route path="history" element={<History />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes></InterviewProvider>
  )
}
