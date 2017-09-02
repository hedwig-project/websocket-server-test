const express = require('express')
const sockjs  = require('sockjs')
const http = require('http')
const bodyParser = require('body-parser')
const cors = require('cors')
const logger = require('./logger')
const loggerSocket = require('./logger-socket')

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

app.post('/broadcast', (req, res, next) => {
  for (let id in connections) {
    connections[id].write('ping')
  }
  res.send('ping')
})

const expressListener = app.listen((process.env.PORT || 9090), () => {
  logger.info(`Server listening on port ${process.env.PORT || 9090}`)
})

// Sockjs
const sockjsServer = sockjs.createServer({
  sockjs_url: 'http://cdn.jsdelivr.net/sockjs/1.0.1/sockjs.min.js'})
const connections = {}

sockjsServer.on('connection', conn => {
  logger.info(`[${conn.id}] New connection ${conn.pathname.match(/\/receive\/\w+/)}`)
  connections[conn.id] = conn

  conn.on('data', message => {
    logger.info(`[${conn.id}] [${conn.pathname.match(/\/receive\/\w+/)}] ${message}`)
    conn.write(message)
  })

  conn.on('close', () => {
    logger.info(`[${conn.id}] Closed connection`)
    delete connections[conn.id]
  })
})

const logSocket = (severity, message) => loggerSocket.log(severity, message)

sockjsServer.installHandlers(
  expressListener, { prefix: '/receive/(.*)', log: logSocket })
