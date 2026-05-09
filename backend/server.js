const express = require('express')
const cors = require('cors')
const http = require('http')
const dotenv = require('dotenv')
const { Server } = require('socket.io')
const { connectToDatabase } = require('./config/db')
const listingsRouter = require('./routes/listings')
const authRouter = require('./routes/auth')
const ratingsRouter = require('./routes/ratings')
const messagesRouter = require('./routes/messages')
const paymentsRouter = require('./routes/payments')

dotenv.config()

const app = express()
const server = http.createServer(app)
const PORT = process.env.PORT || 4000
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176,http://localhost:5177')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(
  cors({
    origin: allowedOrigins,
  }),
)
// Listing images are sent as base64 data URLs from the frontend.
// Increase JSON body limit to avoid 413 errors for valid uploads.
app.use(express.json({ limit: '25mb' }))

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
  },
})

app.set('io', io)

io.on('connection', (socket) => {
  socket.on('joinConversation', ({ roomId }) => {
    if (roomId) {
      socket.join(roomId)
    }
  })

  socket.on('leaveConversation', ({ roomId }) => {
    if (roomId) {
      socket.leave(roomId)
    }
  })
})

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'campuskart-backend' })
})

app.use('/listings', listingsRouter)
app.use('/ratings', ratingsRouter)
app.use('/messages', messagesRouter)
app.use('/auth', authRouter)
app.use('/payments', paymentsRouter)

async function startServer() {
  await connectToDatabase(process.env.MONGODB_URI)

  server.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`)
  })
}

startServer().catch((err) => {
  console.error('Failed to start backend:', err)
  process.exit(1)
})
