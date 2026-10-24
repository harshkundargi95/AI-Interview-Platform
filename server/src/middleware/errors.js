export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

// Express identifies error middleware by its four-argument signature.
export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error)
  if (error.type === 'entity.too.large') error = new ApiError(413, 'BODY_TOO_LARGE', req.originalUrl.startsWith('/api/v1/resumes') ? 'Resume files must be at most 2 MB.' : 'Request body must be at most 256 KB.')
  if (error.type === 'entity.parse.failed') error = new ApiError(400, 'INVALID_JSON', 'Request body must be valid JSON.')
  if (!(error instanceof ApiError)) {
    req.log?.({ event: 'api_error', requestId: req.requestId, code: 'INTERNAL_ERROR', status: 500 })
    error = new ApiError(500, 'INTERNAL_ERROR', 'Something went wrong. Please retry.')
  }
  res.locals.errorCode = error.code
  res.status(error.status).json({ error: { code: error.code, requestId: req.requestId, message: error.message, ...(error.details ? { details: error.details } : {}) } })
}


