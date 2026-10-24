import express from 'express'
import axios from 'axios'

const app = express()
app.use(express.json())

const API_BASE_URL = process.env.API_BASE_URL || 'http://api:80/api'
const JWT = process.env.JWT || ''

// PoC: fetch camp data using the provided JWT, then render a PDF.
// Rendering currently returns a minimal placeholder PDF; wiring the
// real clientPrint renderer (frontend/src/pdf) is the next step.
app.get('/health', (_req, res) => res.json({ status: 'ok' }))

app.post('/render', async (req, res) => {
  const jwt = req.body?.jwt || JWT
  const campId = req.body?.campId
  if (!jwt) {
    return res.status(400).json({ error: 'JWT is required' })
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/camps/${campId}`, {
      headers: { Authorization: `Bearer ${jwt}` },
    })
    const camp = response.data

    // shortcut: placeholder PDF until frontend/src/pdf rendering is ported to Node
    const pdf = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n')
    res.set('Content-Type', 'application/pdf')
    res.set('Content-Disposition', `attachment; filename="${camp?.name || 'camp'}.pdf"`)
    return res.send(pdf)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

const port = process.env.PORT || 3010
app.listen(port, '0.0.0.0', () => {
  console.log(`client-print listening on ${port}`)
})
