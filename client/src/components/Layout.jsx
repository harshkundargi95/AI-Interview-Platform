import { useEffect, useRef } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import ThemeToggle from './ThemeToggle.jsx'

const navigation = [
  ['/', 'Overview'], ['/setup', 'Setup'], ['/interview', 'Room'],
  ['/feedback', 'Feedback'], ['/history', 'History'],
]

export default function Layout() {
  const { pathname } = useLocation()
  const mainRef = useRef(null)
  const previousPath = useRef(pathname)

  useEffect(() => {
    const title = navigation.find(([path]) => path === pathname)?.[1] ?? 'Page not found'
    document.title = `${title} · Interview Practice`
    // Client-side navigation needs an explicit focus destination for keyboard users.
    if (previousPath.current !== pathname) {
      mainRef.current?.focus({ preventScroll: true })
      window.scrollTo({ top: 0, behavior: 'instant' })
      previousPath.current = pathname
    }
  }, [pathname])

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="site-header">
        <div className="header-top">
          <Link className="brand" to="/">Interview Practice<span aria-hidden="true"> /</span></Link>
          <div className="header-actions"><span className="phase-label">Local practice</span><ThemeToggle /></div>
        </div>
        <nav className="site-nav" aria-label="Main navigation">
          {navigation.map(([to, label]) => <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>)}
        </nav>
      </header>
      <div className="preview-banner"><span className="status-dot" aria-hidden="true" /><p><strong>Practice locally.</strong> Save progress to keep answers in local PostgreSQL. History shows saved interviews; feedback examples are fictional. No sign-in or AI.</p></div>
      <main id="main" ref={mainRef} tabIndex={-1}><div key={pathname} className="page-content"><Outlet /></div></main>
      <footer><span>Built one phase at a time.</span><span>Learn → Practice → Reflect</span></footer>
    </div>
  )
}

