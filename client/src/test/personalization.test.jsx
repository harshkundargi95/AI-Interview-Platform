import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { it, expect, vi } from 'vitest'
import Personalization from '../components/Personalization.jsx'
it('allows skill editing and preserves text when upload fails', async () => {
 const api = { resumes: async () => [], uploadResume: vi.fn().mockRejectedValue(new Error('Storage unavailable')) }
 function Harness() { const [value, setValue] = useState(); return <Personalization enabled={true} value={value} onChange={setValue} api={api} preferences={{ type: 'technical' }} onBusy={() => {}} /> }
 const user = userEvent.setup(); render(<Harness />)
 await user.type(screen.getByLabelText('Job description'), 'Required: React\nPreferred: Python')
 await user.click(screen.getByRole('button', { name: 'Detect skills from job description' }))
 expect(screen.getByLabelText('Required skills')).toHaveValue('React')
 await user.type(screen.getByLabelText('Required skills'), ', SQL')
 expect(screen.getByLabelText('Required skills')).toHaveValue('React, SQL')
 await user.type(screen.getByLabelText('Resume / project text to use'), 'My project uses PostgreSQL')
 await user.upload(screen.getByLabelText(/Resume file/), new File(['bad'], 'resume.pdf', { type: 'application/pdf' }))
 expect(await screen.findByText('Storage unavailable')).toBeInTheDocument()
 expect(screen.getByLabelText('Resume / project text to use')).toHaveValue('My project uses PostgreSQL')
})
