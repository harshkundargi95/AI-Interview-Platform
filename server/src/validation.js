import { z } from 'zod'
import { ApiError } from './middleware/errors.js'
import { roleLabels, experienceLabels, typeLabels, difficultyLabels, subjectLabels, languageLabels, technologyLabels, configurationError } from '../../shared/interviewOptions.js'

const uniqueChoices = (labels, max) => z.array(z.enum(Object.keys(labels))).max(max).refine((items) => new Set(items).size === items.length, 'Choose each option only once.')
export const preferencesSchema = z.strictObject({
  role: z.enum(Object.keys(roleLabels)),
  type: z.enum(Object.keys(typeLabels)),
  difficulty: z.enum(Object.keys(difficultyLabels)),
  experience: z.enum(Object.keys(experienceLabels)).default('internship'),
  topicMode: z.enum(['balanced', 'selected']).default('balanced'),
  subjects: uniqueChoices(subjectLabels, 9).default([]),
  language: z.enum(Object.keys(languageLabels)).default('neutral'),
  technologies: uniqueChoices(technologyLabels, 5).default([]),
  questionCount: z.number().int().min(3).max(10).default(5),
}).superRefine((preferences, ctx) => {
  const message = configurationError(preferences)
  if (message) ctx.addIssue({ code: 'custom', path: ['subjects'], message })
}).transform((preferences) => ({
  ...preferences,
  topicMode: preferences.type === 'behavioral' ? 'balanced' : preferences.topicMode,
  subjects: preferences.type === 'behavioral' || preferences.topicMode === 'balanced' ? [] : [...preferences.subjects].sort(),
  technologies: [...preferences.technologies].sort(),
}))
export const startSchema = z.strictObject({ requestId: z.uuid(), preferences: preferencesSchema })
const answerSchema = z.strictObject({
  questionId: z.string().min(1).max(100),
  text: z.string().max(3000).refine((text) => text.trim().length > 0, 'Answer cannot be blank.'),
})
export const answersSchema = z.strictObject({ answers: z.array(answerSchema).min(1).max(12), revision: z.number().int().nonnegative().optional() })
export function parse(schema, value) {
  const result = schema.safeParse(value)
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }))
    throw new ApiError(400, 'VALIDATION_ERROR', details[0]?.message || 'Check the request fields.', details)
  }
  return result.data
}
export function parseId(value) { return parse(z.uuid(), value) }

export const draftSchema = z.strictObject({ answers: z.array(answerSchema).max(12), revision: z.number().int().nonnegative().optional() })
export const historySchema = z.strictObject({ skip: z.coerce.number().int().min(0).max(100000).default(0), take: z.coerce.number().int().min(1).max(50).default(20) })

export const followupRequestSchema = z.strictObject({ questionId: z.string().min(1).max(100), revision: z.number().int().nonnegative() })
export const emptySchema = z.strictObject({})
