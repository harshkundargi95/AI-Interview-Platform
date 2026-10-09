import { createContext, useContext } from 'react'

export const InterviewContext = createContext(null)

export function useInterview() {
  return useContext(InterviewContext)
}
