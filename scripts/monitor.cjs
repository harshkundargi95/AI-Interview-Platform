const readline = require('node:readline')
const config = require('../config/monitoring.json')
const requests = []
let alerted = false
const input = readline.createInterface({ input: process.stdin })
input.on('line', line => {
  let event
  try { event = JSON.parse(line) } catch { return }
  const now = Date.now()
  if (!Number.isFinite(Date.parse(event.time)) || Math.abs(now - Date.parse(event.time)) > config.windowSeconds * 1000) return
  while (requests.length && requests[0].time < now - config.windowSeconds * 1000) requests.shift()
  if (event.event === 'http_request') requests.push({ time: Date.parse(event.time), failed: event.status >= 500 })
  const ratio = requests.length ? requests.filter(row => row.failed).length / requests.length : 0
  if (config.alertEvents.includes(event.event) || (requests.length >= config.minimumRequests && ratio >= config.serverErrorRatio)) {
    alerted = true
    console.error(JSON.stringify({ event: 'monitor_alert', reason: config.alertEvents.includes(event.event) ? 'server_error_event' : 'high_error_ratio', requests: requests.length }))
  }
})
input.on('close', () => { console.log(JSON.stringify({ event: 'monitor_summary', alerted, requests: requests.length })); if (alerted) process.exitCode = 1 })
