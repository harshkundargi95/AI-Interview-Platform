import { answersSchema, draftSchema, historySchema, parse, parseId, startSchema } from '../validation.js'
export function interviewController(service) {
  return {
    async create(req, res) {
      const { session, created } = await (req.interviewService || service).create(parse(startSchema, req.body))
      res.status(created ? 201 : 200).json({ data: session })
    },
    async read(req, res) { res.json({ data: await (req.interviewService || service).read(parseId(req.params.id)) }) },
    async list(req, res) { res.json({ data: await (req.interviewService || service).list(parse(historySchema, req.query)) }) },
    async remove(req, res) { res.json({ data: await (req.interviewService || service).remove(parseId(req.params.id)) }) },
    async save(req, res) {
      const { answers, revision } = parse(draftSchema, req.body)
      res.json({ data: await (req.interviewService || service).save(parseId(req.params.id), answers, revision) })
    },
    async complete(req, res) {
      const { answers, revision } = parse(answersSchema, req.body)
      res.json({ data: await (req.interviewService || service).complete(parseId(req.params.id), answers, revision) })
    },
  }
}
