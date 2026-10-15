// Explicit, editable keyword extraction: no claim of AI understanding or exhaustive skills.
const skills = {
  JavaScript: ['javascript'], TypeScript: ['typescript'], Python: ['python'], Java: ['java'],
  React: ['react'], Vue: ['vue'], Angular: ['angular'], 'Node.js': ['node.js', 'nodejs'],
  Express: ['express'], Django: ['django'], Spring: ['spring'], SQL: ['sql'],
  PostgreSQL: ['postgresql', 'postgres'], MySQL: ['mysql'], MongoDB: ['mongodb'],
  Docker: ['docker'], Git: ['git'], Testing: ['testing', 'unit tests'],
}
export function extractSkills(jobDescription) {
  const required = new Set(), optional = new Set()
  let optionalSection = false
  for (const line of jobDescription.split(/\n/)) {
    if (/nice.to.have|preferred|optional|bonus/i.test(line)) optionalSection = true
    else if (/required|requirements|must.have|essential/i.test(line)) optionalSection = false
    const words = line.toLowerCase().replace(/[^a-z0-9.]+/g, ' ').split(' ')
    for (const [skill, aliases] of Object.entries(skills)) if (aliases.some(alias => words.includes(alias))) {
      (optionalSection ? optional : required).add(skill)
    }
  }
  return { requiredSkills: [...required], optionalSkills: [...optional].filter(skill => !required.has(skill)) }
}
export function scopeWarnings(preferences, context) {
  if (!context?.jobDescription) return []
  const warnings = []
  if (/\bsenior\b|\blead\b|\bprincipal\b|[5-9]\+?\s*years/i.test(context.jobDescription)) warnings.push('This job description may target a senior role. Questions will stay at your selected internship or junior level.')
  if (preferences.topicMode === 'selected') warnings.push('Your selected subjects take priority. Job requirements outside those subjects may not be covered.')
  if (preferences.type === 'behavioral') warnings.push('Behavioral practice focuses on your examples and projects, rather than testing technical job requirements.')
  return warnings
}
