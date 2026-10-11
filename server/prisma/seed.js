import { createDatabase } from '../src/database.js'
import { createPersistentInterviewService } from '../src/services/persistentInterviews.js'
import { preferencesSchema } from '../src/validation.js'
const db = createDatabase()
try {
  await db.user.upsert({ where: { id: 'local-development' }, create: { id: 'local-development', legacy: true }, update: {} })
  const service = createPersistentInterviewService(db, 'local-development')
  const preferences = preferencesSchema.parse({ role: 'general', type: 'technical', difficulty: 'foundations', questionCount: 3 })
  const { session } = await service.create({ requestId: '04e38f50-e512-4ce2-967f-502ae7a327c1', preferences })
  if (session.status === 'active' && !Object.keys(session.answers).length) {
    await service.save(session.id, [{ questionId: session.questions[0].id, text: 'Development seed example — replace this practice answer with your own.' }], session.revision)
  }
  console.log('Legacy development seed ready. Preserved separately; it is not assigned to a signed-in account.')
} finally { await db.$disconnect() }
