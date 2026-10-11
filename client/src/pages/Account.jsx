import { SignIn, SignUp } from '@clerk/react'
import { useAuthState } from '../auth/context.js'
import { Card, PageHeading } from '../components/ui.jsx'

const appearance = { layout: { socialButtonsPlacement: 'top', socialButtonsVariant: 'blockButton' } }
export default function Account({ signUp = false }) {
  const auth = useAuthState()
  return <>
    <PageHeading eyebrow="Your account" title={signUp ? 'Make room for your progress.' : 'Welcome back.'}>Sign in with Google or another enabled method. Your saved interviews stay connected to your account.</PageHeading>
    {!auth.configured ? <Card><h2>Sign-in setup needed</h2><p>Add the Clerk keys using the project README and enable Google in Clerk’s SSO connections. Account access stays disabled until configured.</p></Card> :
      <div className="auth-panel">{signUp
        ? <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" forceRedirectUrl="/setup" appearance={appearance} />
        : <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" forceRedirectUrl="/setup" appearance={appearance} />}
      </div>}
    <p className="small-note">For Google sign-in, open this app in your regular browser. Google may reject sign-in inside an embedded app browser.</p>
  </>
}
