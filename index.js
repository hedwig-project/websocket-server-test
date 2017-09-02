const express = require('express')
const WebSocket  = require('ws')
const http = require('http')
const bodyParser = require('body-parser')
const cors = require('cors')
const logger = require('./logger')

// Express
const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cors())

app.get('/health', (req, res) => {
  res.send('OK')
})

app.get('/test', (req, res) => {
  res.sendFile(__dirname + '/test.html')
})

// app.post('/broadcast', (req, res, next) => {
//   for (let id in connections) {
//     connections[id].write('ping')
//   }
//   res.send('ping')
// })

// Websocket
const server = http.createServer(app)
const wss = new WebSocket.Server({ server })

wss.on('connection', (ws, req) => {
  const ip = req.connection.remoteAddress
  logger.info(`[${ip}] New connection`)

  ws.on('message', message => {
    logger.info(`[${ip}] ${message}`)
    ws.send(message)
  })

  ws.on('close', () => {
    logger.info(`[${ip}] Closed connection`)
  })
})

// Listen
server.listen((process.env.PORT || 9090), () => {
  logger.info(`Server listening on port ${process.env.PORT || 9090}`)
})
