import express from 'express'

export function createApp(renderPdf) {
  const app = express()
  app.use((req, res, next) => {
    const origin = req.get('Origin')
    const allowedOrigin = process.env.CLIENT_PRINT_ALLOWED_ORIGIN || 'http://localhost:3000'
    if (origin === allowedOrigin) {
      res.set('Access-Control-Allow-Origin', origin)
      res.set('Vary', 'Origin')
      res.set('Access-Control-Allow-Headers', 'Content-Type')
      res.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
    }
    if (req.method === 'OPTIONS') return res.sendStatus(origin === allowedOrigin ? 204 : 403)
    next()
  })
  app.use(express.json({ limit: '25mb' }))
  app.get('/health', (_req, res) => res.json({ status: 'ok' }))
  app.post('/render', async (req, res) => {
    const { config, storeData, translationData } = req.body || {}
    if (!config || !storeData?.api || !translationData) {
      return res.status(400).json({ error: 'config, storeData.api and translationData are required' })
    }

    try {
      const pdf = await renderPdf({ config, storeData, translationData })
      if (!Buffer.isBuffer(pdf) || !pdf.subarray(0, 5).equals(Buffer.from('%PDF-'))) {
        throw new Error('Renderer did not return a PDF')
      }
      return res.type('application/pdf').send(pdf)
    } catch (error) {
      console.error('client-print render failed', error)
      return res.status(500).json({ error: 'PDF rendering failed' })
    }
  })
  app.use((error, _req, res, _next) => {
    if (error instanceof SyntaxError && 'body' in error) {
      return res.status(400).json({ error: 'Invalid JSON body' })
    }
    if (error.status === 413) return res.status(413).json({ error: 'Request body is too large' })
    return res.status(500).json({ error: 'Request failed' })
  })
  return app
}
