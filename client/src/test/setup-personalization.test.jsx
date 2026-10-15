import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import { InterviewContext } from '../interview/useInterview.js'
import Setup from '../pages/Setup.jsx'

it('syncs type and count and excludes retained context when personalization is off', async () => {
  const startInterview = vi.fn().mockResolvedValue(false)
  render(<MemoryRouter><InterviewContext.Provider value={{ session: null, startInterview, busy: false }}><Setup /></InterviewContext.Provider></MemoryRouter>)
  const user = userEvent.setup()
  const toggle = screen.getByRole('switch', { name: 'Use resume / job description' })
  expect(toggle).not.toBeChecked()
  expect(screen.queryByLabelText('Resume / project text to use')).not.toBeInTheDocument()
  await user.click(toggle)
  await user.type(screen.getByLabelText('Resume / project text to use'), 'Built a React project')
  await user.click(screen.getByRole('button', { name: 'Mixed' }))
  expect(screen.getByLabelText('Interview type')).toHaveValue('mixed')
  await user.selectOptions(screen.getByLabelText('Questions in this interview'), '7')
  expect(screen.getByLabelText('Question count')).toHaveValue('7')
  await user.selectOptions(screen.getByLabelText('Interview type'), 'technical')
  expect(screen.getByRole('button', { name: 'Technical' })).toHaveAttribute('aria-pressed', 'true')
  await user.selectOptions(screen.getByLabelText('Question count'), '3')
  expect(screen.getByLabelText('Questions in this interview')).toHaveValue('3')
  await user.selectOptions(screen.getByLabelText('Topic coverage'), 'selected')
  await user.click(screen.getByRole('button', { name: 'Behavioral' }))
  expect(screen.queryByLabelText('Topic coverage')).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Start interview →' }))
  expect(startInterview.mock.lastCall[0]).toMatchObject({ type: 'behavioral', questionCount: 3, topicMode: 'balanced', subjects: [], personalization: { resumeText: 'Built a React project' } })
  await user.click(toggle)
  await user.click(screen.getByRole('button', { name: 'Start interview →' }))
  expect(startInterview.mock.lastCall[0]).not.toHaveProperty('personalization')
  await user.click(toggle)
  expect(screen.getByLabelText('Resume / project text to use')).toHaveValue('Built a React project')
})
