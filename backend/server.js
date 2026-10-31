
require('dotenv').config()

const express = require('express')
const cors = require('cors')

const app = express()
const PORT = 5000

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

app.get('/', (req, res) => {
  res.json({
    message: 'Abbas Battle Arena Backend Running!',
    status: 'success'
  })
})

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    game: 'Abbas Battle Arena'
  })
})

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`)
})