const express = require('express')
const path = require('path')
const http = require('http')
const socketio = require('socket.io')
const { generateMsg, genLoc } = require('./utils/message')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDir = path.join(__dirname, '../public')
app.use(express.static(publicDir))

io.on('connection', (socket) => {
    console.log('new connection')

    socket.on('join', ({ username, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, username, room })
        if (error) {
            return callback(error)
        }

        socket.join(user.room)

        socket.emit('message', generateMsg('Admin', 'Welcome!!'))
        socket.broadcast.to(user.room).emit('message', generateMsg('Admin', `${user.username} has just entered the chat`))

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    socket.on('sendMessage', (msg, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('message', generateMsg(user.username, msg))
        callback()
    })

    socket.on('coords', (coord, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('sendLoc', genLoc(user.username, `https://www.google.com/maps?q=${coord.lat},${coord.long}`))
        callback()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if (user) {
            io.to(user.room).emit('message', generateMsg('Admin', `${user.username} has left the chat`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

server.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})