import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createApp } from './server.js'

let server
let baseUrl

before(async () => {
  const app = createApp(async () => Buffer.from('%PDF-1.7\n%%EOF'))
  server = app.listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

after(() => new Promise((resolve) => server.close(resolve)))

test('renders PDF from serialized client print data', async () => {
  const response = await fetch(`${baseUrl}/render`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      config: { contents: [] },
      storeData: { api: {} },
      translationData: {},
    }),
  })

  assert.equal(response.status, 200)
  assert.equal(response.headers.get('content-type'), 'application/pdf')
  assert.match(await response.text(), /^%PDF-/)
})

test('rejects incomplete render data', async () => {
  const response = await fetch(`${baseUrl}/render`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config: {} }),
  })

  assert.equal(response.status, 400)
})

test('allows only the configured frontend origin', async () => {
  const allowed = await fetch(`${baseUrl}/render`, {
    method: 'OPTIONS',
    headers: {
      Origin: 'http://localhost:3000',
      'Access-Control-Request-Method': 'POST',
    },
  })
  const rejected = await fetch(`${baseUrl}/render`, {
    method: 'OPTIONS',
    headers: { Origin: 'https://attacker.example' },
  })

  assert.equal(allowed.status, 204)
  assert.equal(allowed.headers.get('access-control-allow-origin'), 'http://localhost:3000')
  assert.equal(rejected.status, 403)
})
