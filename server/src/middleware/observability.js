import { randomUUID } from 'node:crypto'

// Allowlisted metadata only: never serialize request/error objects or URLs.
export function createLogger(write = line => process.stdout.write(line + '\n')) {
  return event => {
    const safe = {}
    for (const key of ['event', 'requestId', 'method', 'route', 'status', 'durationMs', 'code']) {
      if (event[key] !== undefined) safe[key] = event[key]
    }
    try { write(JSON.stringify({ time: new Date().toISOString(), ...safe })) } catch { /* logging must not break requests */ }
  }
}
export function requestTracing(log = createLogger()) {
  return (req, res, next) => {
    const start = performance.now()
    req.requestId = randomUUID() // Never trust client-controlled identifiers.
    res.set('X-Request-Id', req.requestId)
    req.log = log
    let recorded = false
    const record = () => {
      if (recorded) return
      recorded = true
      log({ event: 'http_request', requestId: req.requestId, method: req.method,
        route: req.route ? req.baseUrl + req.route.path : 'unmatched',
        status: res.writableFinished ? res.statusCode : 499,
        durationMs: Math.round(performance.now() - start), code: res.locals.errorCode })
    }
    res.once('finish', record)
    res.once('close', record)
    next()
  }
}
