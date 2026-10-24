import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { before, test } from 'node:test'
import { initializeRendererRuntime, loadRenderer } from './renderer.js'

let renderPdf
const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'))

before(async () => {
  initializeRendererRuntime()
  renderPdf = await loadRenderer()
})

test('renders a storyboard into a real PDF', async () => {
  const [api, de, en] = await Promise.all([
    readJson('/frontend/src/pdf/renderer/__tests__/fullCampStoreContent.json'),
    readJson('/common/locales/de.json'),
    readJson('/common/locales/en.json'),
  ])
  const result = await renderPdf(
    {
      config: {
        language: 'de',
        documentName: 'Pfila 2023.pdf',
        options: { pageNumbers: false, pageSize: 'A4' },
        camp: '/camps/c4cca3a51342',
        contents: [
          {
            type: 'Story',
            options: {
              periods: ['/periods/16b2fcffdd8e'],
              contentType: 'Storycontext',
            },
          },
        ],
      },
      storeData: { api, lang: { language: 'de' } },
      translationData: { de, en },
    },
    async () => {}
  )

  assert.equal(result.error, null)
  assert.ok(Buffer.from(await result.blob.arrayBuffer()).subarray(0, 5).equals(Buffer.from('%PDF-')))
})
