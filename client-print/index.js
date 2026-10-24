import { createApp } from './server.js'
import { initializeRendererRuntime, loadRenderer } from './renderer.js'

initializeRendererRuntime()
const renderPdf = await loadRenderer()

const app = createApp(async (data) => {
  const result = await renderPdf(data, async () => {})
  if (result.error) throw result.error
  return Buffer.from(await result.blob.arrayBuffer())
})

app.listen(process.env.PORT || 3010, '0.0.0.0', () => {
  console.log(`client-print listening on ${process.env.PORT || 3010}`)
})
