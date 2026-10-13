
export const ANSWER_LIMIT = 3000

export function validateAnswer(answer = '') {
  if (!answer.trim()) return 'Write an answer before continuing.'
  if (answer.length > ANSWER_LIMIT) return `Keep your answer within ${ANSWER_LIMIT} characters.`
  return ''
}

export function answeredCount(session) {
  return session.questions.filter((question) => !validateAnswer(session.answers[question.id])).length
}

export function interviewReducer(session, action) {
  switch (action.type) {
    case 'start':
      return { ...action.session, savedAnswers: { ...action.session.answers }, index: Math.max(0, action.session.questions.findIndex(q => !action.session.answers[q.id])) }
    case 'expanded':
      if (session?.id !== action.session.id) return session
      return { ...action.session, savedAnswers: { ...action.session.answers }, index: action.session.questions.length - 1 }
    case 'report':
      if (session?.id !== action.session.id) return session
      return { ...session, feedback: action.session.feedback }
    case 'saved':
      if (session?.id !== action.session.id) return session
      return { ...session, revision: action.session.revision, savedAnswers: { ...action.session.answers } }
    case 'answer':
      if (session?.status !== 'active' || !session.questions.some((question) => question.id === action.id)) return session
      return { ...session, answers: { ...session.answers, [action.id]: action.value } }
    case 'move':
      if (session?.status !== 'active' || !Number.isInteger(action.index) || action.index < 0 || action.index >= session.questions.length) return session
      return { ...session, index: action.index }
    case 'complete':
      if (session?.status !== 'active' || action.session?.id !== session.id || action.session.status !== 'completed') return session
      return { ...action.session, index: session.index }
    case 'discard':
      return null
    default:
      return session
  }
}
