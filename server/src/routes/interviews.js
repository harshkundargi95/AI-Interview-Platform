import { Router } from 'express'
import { interviewController } from '../controllers/interviews.js'

export function interviewRoutes(service) {
  const router = Router()
  const controller = interviewController(service)
  router.get('/', controller.list)
  router.delete('/:id', controller.remove)
  router.post('/', controller.create)
  router.get('/:id', controller.read)
  router.put('/:id/answers', controller.save)
  router.post('/:id/complete', controller.complete)
  return router
}
