const bluebird = require('bluebird')
const bodyParser = require('body-parser')
const cors = require('cors')
const express = require('express')
const http = require('http')
const redis = require('redis')
const socketio = require('socket.io')
const logger = require('./logger')

// Express
const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cors())

app.get('/health', (req, res) => {
  res.send('OK')
})

app.get('/info', (req, res) => {  // Workaround to make Morpheus integration work
  res.send('OK')
})

// Redis
bluebird.promisifyAll(redis.RedisClient.prototype)
bluebird.promisifyAll(redis.Multi.prototype)

const redisClient = redis.createClient()

redisClient.on('connect', () => {
  logger.info(`[Redis] Connected on port ${process.env.REDIS_PORT || 6379}`)
})

redisClient.on('error', err => {
  logger.error(`[Redis] Error: ${err.code}`)
})

// Websocket
const server = http.createServer(app)
const io = socketio(server)

io.on('connection', socket => {
  logger.info(`[Socket.io] New connection`)

  socket.on('hello', (morpheusId, cb) => {
    redisClient
      .multi()
      .set(morpheusId, socket.id)
      .set(socket.id, morpheusId)
      .execAsync()
      .then(() => logger.info(`[Redis] Saved connection information`))

    if (cb !== undefined) {
      cb('Ok')
    }
  })

  socket.on('confirmation', (data, cb) => {
    // TODO: route confirmation messages to client apps

    logger.info(`[confirmation] ${JSON.stringify(data)}`)

    if (cb !== undefined) {
      cb('Ok')
    }
  })

  socket.on('configuration', (data, cb) => {
    // TODO: get configuration

    logger.info(`[configuration] ${JSON.stringify(data)}`)

    if (cb !== undefined) {
      cb('Ok')
    }
  })

  socket.on('data', (data, cb) => {
    // TODO: transmit and persist data

    logger.info(`[data] ${JSON.stringify(data)}`)

    if (cb !== undefined) {
      cb('Ok')
    }
  })

  socket.on('disconnect', () => {
    logger.info(`[Socket.io] Closed connection`)
    redisClient
      .multi()
      .del(redisClient.get(socket.id))
      .del(socket.id)
      .execAsync()
      .then(() => logger.info(`[Redis] Cleaned up connection information`))
  })
})

// Debugging
app.post('/message', (req, res) => {
  logger.info(`[debug] Broadcasting a mock event of type "${req.body.type}"`)
  io.emit(req.body.type, req.body.payload)
  res.status(200).json(req.body)
})

app.post('/message/:morpheusId', (req, res) => {
  redisClient
    .getAsync(req.params.morpheusId)
    .then(socketId => {
      logger.info(`[debug] Emitting a mock event of type "${req.body.type}"`)
      io.to(socketId).emit(req.body.type, req.body.payload)
      res.status(200).json(req.body)
    })
})

// Listen
server.listen((process.env.PORT || 9090), () => {
  logger.info(`[Server] Listening on port ${process.env.PORT || 9090}`)
})
