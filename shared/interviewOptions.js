export const roleLabels = { general: 'General Software Developer', frontend: 'Frontend Developer', backend: 'Backend Developer', fullstack: 'Full-Stack Developer' }
export const experienceLabels = { internship: 'Internship', junior: 'Junior' }
export const typeLabels = { technical: 'Technical', behavioral: 'Behavioral', mixed: 'Mixed' }
export const difficultyLabels = { foundations: 'Foundations', intermediate: 'Intermediate', advanced: 'Challenging' }
export const subjectLabels = { programming: 'Programming, debugging, Git and testing', frontend: 'Frontend fundamentals', backend: 'Backend fundamentals', fullstack: 'End-to-end software design', cn: 'Computer Networks (CN)', oop: 'Object-Oriented Programming (OOP)', dsa: 'Data Structures and Algorithms (DSA)', dbms: 'Database Management Systems (DBMS)', os: 'Operating Systems (OS)' }
const core = ['programming', 'cn', 'oop', 'dsa', 'dbms', 'os']
export const trackSubjects = { general: core, frontend: ['frontend', ...core], backend: ['backend', ...core], fullstack: ['fullstack', 'frontend', 'backend', ...core] }
export const languageLabels = { neutral: 'No preference / pseudocode', javascript: 'JavaScript', typescript: 'TypeScript', python: 'Python', java: 'Java', csharp: 'C#', cpp: 'C++', go: 'Go' }
export const technologyLabels = { react: 'React', vue: 'Vue', angular: 'Angular', node: 'Node.js', express: 'Express', django: 'Django', spring: 'Spring', dotnet: '.NET', postgres: 'PostgreSQL', mysql: 'MySQL', mongodb: 'MongoDB' }
export const defaultPreferences = { role: 'frontend', experience: 'internship', type: 'behavioral', difficulty: 'foundations', topicMode: 'balanced', subjects: [], language: 'neutral', technologies: [], questionCount: 5 }
export function technicalCount({ type, questionCount = 5 }) {
  return type === 'behavioral' ? 0 : type === 'mixed' ? Math.ceil(questionCount / 2) : questionCount
}
export function configurationError(preferences) {
  if (preferences.type === 'behavioral' || preferences.topicMode !== 'selected') return ''
  if (!preferences.subjects.length) return 'Select at least one subject, or use balanced coverage.'
  if (preferences.subjects.some((subject) => !trackSubjects[preferences.role]?.includes(subject))) return 'Choose subjects supported by this role track.'
  if (preferences.subjects.length > technicalCount(preferences)) return `This interview has ${technicalCount(preferences)} technical slots for ${preferences.subjects.length} subjects. Increase the question count, choose Technical, or select fewer subjects.`
  return ''
}
