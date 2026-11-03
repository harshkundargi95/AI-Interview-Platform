import { afterEach, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import Layout from '../components/Layout.jsx'
vi.mock('../auth/AccountControls.jsx', () => ({ default: () => null }))
afterEach(() => vi.unstubAllEnvs())
it('labels free demo limits without claiming local-only storage', () => {
  vi.stubEnv('VITE_DEPLOYMENT_MODE', 'demo')
  render(<MemoryRouter><Layout /></MemoryRouter>)
  expect(screen.getByText('Free demo')).toBeInTheDocument()
  expect(screen.getByText('Portfolio demo.')).toBeInTheDocument()
  expect(screen.getByText(/fictional resume details/)).toBeInTheDocument()
  expect(screen.queryByText('Practice locally.')).not.toBeInTheDocument()
})
