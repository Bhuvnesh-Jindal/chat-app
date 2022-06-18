const socket = io()

const $msgform = document.querySelector('#msg-form')
const $msgInput = $msgform.querySelector('input')
const $msgButton = $msgform.querySelector('button')
const $sendLocButton = document.querySelector('#send-loc')
const $divMessages = document.querySelector('#messages')

const msgTemplate = document.querySelector('#msg-template').innerHTML
const locTemplate = document.querySelector('#loc-msg-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

socket.on('message', (msg) => {
    console.log(msg)
    const html = Mustache.render(msgTemplate, {
        username: msg.username,
        msg: msg.text,
        createdAt: moment(msg.createdAt).format('hh:mm a')
    })
    $divMessages.insertAdjacentHTML('beforeend', html)
})

socket.on('sendLoc', (loc) => {
    const html = Mustache.render(locTemplate, {
        username: loc.username,
        url: loc.url,
        createdAt: moment(loc.createdAt).format('hh:mm a')
    })
    $divMessages.insertAdjacentHTML('beforeend', html)
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

if ($msgform) {
    $msgform.addEventListener('submit', (e) => {
        e.preventDefault()
        $msgButton.setAttribute('disabled', 'disabled')
        const msg = e.target.elements.message.value
        socket.emit('sendMessage', msg, () => {
            $msgButton.removeAttribute('disabled')
            $msgInput.value = ''
            $msgInput.focus()
            console.log('Message Delivered!!')
        })
    })
}

$sendLocButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geoloction is not supported')
    }
    $sendLocButton.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition((pos) => {
        socket.emit('coords', {
            lat: pos.coords.latitude,
            long: pos.coords.longitude
        }, () => {
            $sendLocButton.removeAttribute('disabled')
            console.log('Location shared!!')
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})