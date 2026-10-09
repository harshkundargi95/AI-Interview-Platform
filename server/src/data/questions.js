import { defaultPreferences, trackSubjects, technicalCount, configurationError } from '../../../shared/interviewOptions.js'

// IDs are explicit editorial keys: changing order does not change identity.
const prompts = {
  programming: [
    ['variables', 'Explain the difference between a variable, a value and a data type.'],
    ['loops', 'When would you use a loop rather than write the same operation several times?'],
    ['functions', 'How would you split a long function into smaller testable functions?'],
    ['debug', 'A function returns the wrong result for empty input. How would you investigate?'],
    ['git', 'Explain what a Git commit records and how a branch helps you work safely.'],
    ['tests', 'What is the difference between a unit test and an integration test?'],
    ['errors', 'When should a function return a result and when should it report an error?'],
    ['design', 'How would you separate input validation from the main calculation in a small program?'],
    ['review', 'How would you review a small code change for correctness and readability?'],
    ['project', 'Describe a small feature you built or would build. Explain one implementation decision.'],
  ],
  cn: [
    ['dns', 'What does DNS do when you enter a website address?'],
    ['tcp-udp', 'Compare TCP and UDP. Give a use case for each.'],
    ['http', 'Describe the main parts of an HTTP request and response.'],
    ['https', 'What protection does HTTPS add to HTTP, and what does it not guarantee?'],
    ['ports', 'Why can two services on one computer listen on different ports?'],
    ['journey', 'Trace a browser request from entering a URL to receiving a response from a server.'],
    ['latency', 'Explain latency versus bandwidth using a small file download as an example.'],
    ['ip', 'How do IP addresses and TCP ports work together to reach an application?'],
    ['status', 'When might an API return 400, 401, 403, 404 or 500?'],
    ['retry', 'Why can retrying a timed-out HTTP request create duplicate work?'],
  ],
  oop: [
    ['encapsulation', 'Explain encapsulation using a small class with state that must remain valid.'],
    ['abstraction', 'What does abstraction hide from callers of a class or interface?'],
    ['inheritance', 'Give a simple example of inheritance and one limitation of using it.'],
    ['polymorphism', 'How can polymorphism let different objects respond to the same operation?'],
    ['composition', 'When would you prefer composition to inheritance?'],
    ['interfaces', 'How does an interface help separate a caller from an implementation?'],
    ['constructor', 'What should a constructor do to establish a valid object?'],
    ['responsibility', 'A class reads files, parses data and renders output. How could you separate its responsibilities?'],
    ['dependency', 'How would passing a dependency into an object make that object easier to test?'],
    ['design', 'Sketch objects for a small library lending system and explain their relationships.'],
  ],
  dsa: [
    ['arrays', 'Compare an array with a linked list for indexed access and insertion.'],
    ['strings', 'Describe an approach to determine whether a string is a palindrome.'],
    ['stack', 'How can a stack help check balanced parentheses?'],
    ['queue', 'When would you choose a queue instead of a stack?'],
    ['hash', 'How would a hash map help count repeated words? Discuss collisions briefly.'],
    ['tree', 'Describe a binary tree traversal and a situation where it is useful.'],
    ['graph', 'How would you represent a small graph and find which nodes are reachable?'],
    ['search', 'Compare linear search with binary search. What must be true before binary search works?'],
    ['sort', 'Explain one sorting algorithm and its time and space costs.'],
    ['complexity', 'Explain the time complexity of two nested loops over the same input. When might the result differ?'],
  ],
  dbms: [
    ['keys', 'Compare primary keys and foreign keys using a small relational schema.'],
    ['relations', 'How would you model a many-to-many relationship between students and courses?'],
    ['sql', 'Describe or write a query to filter and sort rows in a table.'],
    ['joins', 'Compare an INNER JOIN with a LEFT JOIN using users and orders.'],
    ['normalization', 'What duplication can normalization remove, and what tradeoff can it introduce?'],
    ['indexes', 'How can an index speed up reads and make writes more expensive?'],
    ['transactions', 'Why should two related balance updates occur in one transaction?'],
    ['acid', 'Explain the ACID properties with a small transaction example.'],
    ['isolation', 'What can happen when two transactions read and update the same row?'],
    ['constraints', 'When should a database enforce uniqueness rather than rely only on application checks?'],
  ],
  os: [
    ['process-thread', 'Compare a process with a thread. What resources can threads share?'],
    ['memory', 'Explain the purpose of virtual memory in an operating system.'],
    ['stack-heap', 'Compare stack and heap memory at a conceptual level.'],
    ['race', 'Describe a race condition when two threads increment the same counter.'],
    ['mutex', 'How can a mutex protect shared state, and what can go wrong if it is misused?'],
    ['deadlock', 'Describe a deadlock involving two locks and one way to avoid it.'],
    ['scheduling', 'Why does an operating system switch execution between processes?'],
    ['io', 'What is the difference between blocking and non-blocking I/O?'],
    ['resources', 'Why should a program close files and release resources when work finishes?'],
    ['concurrency', 'Explain concurrency versus parallelism with a small program example.'],
  ],
  frontend: [
    ['semantic-html', 'How do semantic HTML elements help people using assistive technology?'],
    ['box-model', 'Explain the CSS box model and how box-sizing affects element width.'],
    ['layout', 'When would you use Flexbox instead of CSS Grid?'],
    ['events', 'Explain event bubbling and a situation where it affects a form.'],
    ['fetch', 'How would you handle loading and error states when fetching data?'],
    ['focus', 'How would you build a modal with correct keyboard focus and a way to close it?'],
    ['stale', 'How would you prevent stale search responses from overwriting newer results?'],
    ['state', 'How would you choose between local component state and shared state?'],
    ['performance', 'How would you investigate a slow initial page load?'],
    ['validation', 'Why does validating a form in the browser not replace server-side validation?'],
  ],
  backend: [
    ['api', 'Design the methods and status codes for a small task-management API.'],
    ['validation', 'How would you validate an incoming request before changing stored data?'],
    ['errors', 'How should an API distinguish a user input error from an unexpected server failure?'],
    ['auth', 'Explain authentication versus authorization for reading an interview record.'],
    ['queries', 'How would parameterized queries protect an API that searches a database?'],
    ['pagination', 'Why might an API paginate a list of records?'],
    ['idempotency', 'How would you prevent a repeated request from creating duplicate records?'],
    ['concurrency', 'Two requests update the same record. What might go wrong and how could you prevent it?'],
    ['secrets', 'Where should an API keep credentials and what should it avoid writing to logs?'],
    ['testing', 'How would you test an API when the database or another service is unavailable?'],
  ],
  fullstack: [
    ['journey', 'Trace a form submission from a browser through an API to a database and back.'],
    ['contract', 'How would you keep a frontend form and its backend request contract consistent?'],
    ['errors', 'How should an end-to-end feature behave when saving fails?'],
    ['ownership', 'Where should ownership checks happen when a user edits a record?'],
    ['deployment', 'What configuration differs between your local frontend/API and a deployed application?'],
    ['cors', 'Why might a browser block an API response from another origin?'],
    ['persistence', 'Compare browser memory, browser storage and a server database for saving interview answers.'],
    ['retry', 'How would you preserve a form draft while safely retrying a submission?'],
    ['feature', 'Design a small saved-notes feature, describing its UI, API and data relationships.'],
    ['testing', 'What would you verify in an end-to-end test that unit tests alone cannot establish?'],
  ],
  behavioral: [
    ['feedback', 'Describe a time you received feedback on your work. What did you change?'],
    ['learning', 'Tell me about a problem you solved while learning something new.'],
    ['disagreement', 'Describe how you worked with someone who had a different idea.'],
    ['deadline', 'Tell me about a deadline you had to manage. How did you prioritize?'],
    ['project', 'Discuss a class, personal or work project. What was your contribution?'],
    ['tradeoff', 'Describe a technical tradeoff in a small project and why you chose one approach.'],
    ['bug', 'Describe a bug you investigated. How did you verify the fix?'],
    ['uncertainty', 'What did you do when a task had unclear requirements?'],
    ['mistake', 'Tell me about a mistake and what you learned from it.'],
    ['teamwork', 'Describe how you explained a technical idea to a teammate.'],
  ],
}
const allTracks = Object.keys(trackSubjects)
function entry(subject, id, text, languages = ['neutral'], technologies = []) {
  return { id: `${subject}-${id}`, text, subject, category: subject === 'behavioral' ? 'behavioral' : 'technical', tracks: subject === 'behavioral' ? allTracks : allTracks.filter((track) => trackSubjects[track].includes(subject)), experienceLevels: ['internship', 'junior'], difficulties: ['foundations', 'intermediate', 'advanced'], languages, technologies }
}
export const questionBank = Object.entries(prompts).flatMap(([subject, rows]) => rows.map(([id, text]) => entry(subject, id, text)))
questionBank.push(
  entry('frontend', 'react-renders', 'How would you diagnose and fix unnecessary re-renders in a React application?', ['javascript', 'typescript'], ['react']),
  entry('programming', 'python-mutable', 'In Python, why can a mutable default argument cause surprising behavior?', ['python']),
  entry('oop', 'java-interface', 'In Java, how would you use an interface to make a service easier to test?', ['java']),
  entry('dbms', 'postgres-explain', 'How would you use PostgreSQL EXPLAIN to investigate a slow query?', ['neutral'], ['postgres']),
)
const depth = {
  internship: { foundations: 'Use a small example; focus on the basic idea.', intermediate: 'Walk through a small example and one edge case.', advanced: 'Compare two approaches for a small exercise and explain one tradeoff. No production experience is assumed.' },
  junior: { foundations: 'Relate your explanation to a small application feature.', intermediate: 'Explain how you would implement and test this in a small application.', advanced: 'Discuss an edge case, a tradeoff and how you would verify your solution in a small application.' },
}
export function selectQuestions(input) {
  const preferences = { ...defaultPreferences, ...input }
  const { role, experience, difficulty, language, technologies, questionCount } = preferences
  const error = configurationError(preferences)
  if (error) throw new Error(error)
  const subjects = preferences.topicMode === 'selected' ? preferences.subjects : trackSubjects[role]
  const slots = technicalCount(preferences)
  const eligible = questionBank.filter((q) => q.tracks.includes(role) && q.experienceLevels.includes(experience) && q.difficulties.includes(difficulty) && (q.languages.includes('neutral') || q.languages.includes(language) || (language === 'neutral' && q.technologies.some((technology) => technologies.includes(technology)))) && (!q.technologies.length || q.technologies.some((technology) => technologies.includes(technology))))
  const ranked = (subject) => eligible.filter((q) => q.subject === subject).sort((a, b) => specificity(b) - specificity(a))
  function specificity(q) { return Number(q.languages.includes(language) && language !== 'neutral') + Number(q.technologies.some((technology) => technologies.includes(technology))) }
  // Round-robin gives every selected subject a slot before repeating a subject.
  const technical = []
  for (let round = 0; technical.length < slots; round++) {
    for (const subject of subjects) {
      const question = ranked(subject)[round]
      if (question && technical.length < slots) technical.push(question)
    }
    if (round > questionCount) throw new Error('Insufficient matching fixed questions.')
  }
  const behavioral = ranked('behavioral').slice(0, questionCount - slots)
  const selected = []
  while (technical.length || behavioral.length) {
    if (technical.length) selected.push(technical.shift())
    if (behavioral.length) selected.push(behavioral.shift())
  }
  return selected.map((q) => ({ ...structuredClone(q), text: `${q.text} ${q.category === 'behavioral' ? 'A class, personal or work project is welcome. ' : ''}${depth[experience][difficulty]}`, experience, difficulty, source: 'fixed-bank', applicability: q.languages.includes('neutral') && !q.technologies.length ? 'Language-neutral concept question' : 'Matches a selected language or technology' }))
}
