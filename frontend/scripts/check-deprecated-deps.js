// Fails when frontend/package-lock.json contains a package that npm marks as
// deprecated. Only the frontend lockfile is guarded: print/ is tracked in
// https://github.com/bacluc-agent/agent-todo/issues/324 and frontend-old/ is
// frozen (Renovate is off, so its deprecated packages can never be removed).

import { existsSync, readFileSync } from 'node:fs'

const ALLOWED = new Set([
  // jest-serializer-vue-tjw -> cheerio -> encoding-sniffer -> whatwg-encoding.
  // cheeriojs/cheerio#5157 bumped encoding-sniffer to 1.0.2 and is merged, but
  // no cheerio release carries it yet, so the warning stays until the next
  // cheerio release is picked up by Renovate. Drop this line then.
  'node_modules/whatwg-encoding',
  // Removed by bacluc-agent/ecamp3#54, drop this line when that PR is merged.
  'node_modules/@babel/plugin-proposal-class-properties',
  // Removed by bacluc-agent/ecamp3#55, drop this line when that PR is merged.
  'node_modules/jest-serializer-vue-tjw/node_modules/glob',
  // Removed by bacluc-agent/ecamp3#61, drop this line when that PR is merged.
  'node_modules/source-map-resolve',
])

const lockUrl = new URL('../package-lock.json', import.meta.url)
// A missing lockfile is reported by the `npm ci` step that runs next.
const lock = existsSync(lockUrl) ? JSON.parse(readFileSync(lockUrl, 'utf8')) : {}
const found = Object.entries(lock.packages ?? {})
  .filter(([path, entry]) => entry.deprecated && !ALLOWED.has(path))
  .map(([path, entry]) => `${path}@${entry.version}: ${entry.deprecated}`)

if (found.length > 0) {
  console.error(`Deprecated dependencies in package-lock.json:\n  ${found.join('\n  ')}`)
  process.exit(1)
}
