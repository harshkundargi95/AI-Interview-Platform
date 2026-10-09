import { roleLabels, experienceLabels, typeLabels, difficultyLabels, subjectLabels, languageLabels, technologyLabels } from '../../../shared/interviewOptions.js'
export default function SessionSummary({ session }) {
  const p = session.preferences
  return <div className="session-summary">
    <h3>{roleLabels[p.role]}</h3>
    <p>{experienceLabels[p.experience || 'internship']} · {typeLabels[p.type]} · {difficultyLabels[p.difficulty]} · {session.questions.length} questions</p>
    <p className="small-note">{p.type === 'behavioral' ? 'Behavioral and project discussion' : p.topicMode === 'selected' ? p.subjects.map((subject) => subjectLabels[subject]).join(', ') : 'Automatic / balanced topic coverage'}</p>
    <p className="small-note">Language: {languageLabels[p.language || 'neutral']}. Technologies: {p.technologies?.length ? p.technologies.map((technology) => technologyLabels[technology]).join(', ') : 'No preference'}.</p>
    <p className="small-note">Fixed question bank; not AI-generated. Language-neutral questions fill gaps in specialized coverage.</p>
  </div>
}
