import { build } from 'vite'
import { mkdtempSync } from 'node:fs'
import { readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

export async function loadRenderer() {
  process.chdir('/frontend')
  const outputDirectory = mkdtempSync(path.join(tmpdir(), 'ecamp3-client-print-'))
  try {
    await build({
      configFile: '/frontend/vite.config.js',
      root: '/frontend',
      build: {
        outDir: outputDirectory,
        emptyOutDir: true,
        assetsInlineLimit: 10_000_000,
        sourcemap: false,
        lib: {
          entry: '/frontend/src/components/print/print-client/renderPdf.js',
          formats: ['es'],
          fileName: 'renderer',
        },
        rollupOptions: { external: ['vuetify/lib'] },
      },
    })
    const moduleUrl = pathToFileURL(path.join(outputDirectory, 'renderer.js')).href
    return (await import(moduleUrl)).renderPdf
  } finally {
    await rm(outputDirectory, { recursive: true, force: true })
  }
}

let initialized = false
export function initializeRendererRuntime() {
  if (initialized) return
  initialized = true

  const events = new EventTarget()
  globalThis.addEventListener = events.addEventListener.bind(events)
  globalThis.removeEventListener = events.removeEventListener.bind(events)
  globalThis.dispatchEvent = events.dispatchEvent.bind(events)

  const originalFetch = globalThis.fetch.bind(globalThis)
  globalThis.fetch = async (input, options) => {
    const url = typeof input === 'string' ? input : input.url || input.href
    if (url.startsWith('/twemoji/assets/')) {
      const filename = path.resolve('/frontend/public', `.${url}`)
      if (!filename.startsWith('/frontend/public/twemoji/assets/')) {
        return new Response(null, { status: 400 })
      }
      try {
        return new Response(await readFile(filename), {
          headers: { 'Content-Type': 'image/png' },
        })
      } catch {
        return new Response(null, { status: 404 })
      }
    }
    return originalFetch(input, options)
  }
}
