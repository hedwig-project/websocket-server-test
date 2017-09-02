const express = require('express')
const socketio = require('socket.io')
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

app.get('/', (req, res) => {
  res.send('OK')
})

app.get('/info', (req, res) => {
  res.send('OK')
})

app.get('/test', (req, res) => {
  res.sendFile(__dirname + '/test.html')
})

// Websocket
const server = http.createServer(app)
const io = socketio(server)

io.on('connection', socket => {
  logger.info(`New connection`)

  socket.on('newMorpheusConnection', data => {
    logger.info(`newMorpheusConnection`)
    socket.emit('connectionAccepted')
  })

  socket.on('disconnect', () => {
    logger.info(`Closed connection`)
  })
})

// Listen
server.listen((process.env.PORT || 9090), () => {
  logger.info(`Server listening on port ${process.env.PORT || 9090}`)
})
