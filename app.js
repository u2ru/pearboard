/** @typedef {import('pear-interface')} */ /* global Pear */

import Hyperswarm from 'hyperswarm' // Module for P2P networking and connecting peers
import crypto from 'hypercore-crypto' // Cryptographic functions for generating the key in app
import b4a from 'b4a' // Module for buffer-to-string and vice-versa conversions
const { teardown, updates } = Pear

const swarm = new Hyperswarm()

teardown(() => swarm.destroy())

updates(() => Pear.reload())

swarm.on('connection', (peer) => {
  const name = b4a.toString(peer.remotePublicKey, 'hex').substr(0, 6)
  const device = document.createElement('div')
  const deviceList = document.querySelector('#devices-list')

  const isFirstDevice = !deviceList.querySelector('.device')

  device.classList.add('device')
  if (isFirstDevice) device.classList.add('active')
  device.textContent = name
  deviceList.appendChild(device)

  device.addEventListener('click', () => {
    const activeDevice = deviceList.querySelector('.active')
    if (activeDevice) activeDevice.classList.remove('active')
    device.classList.add('active')
  })

  peer.on('data', (message) => newClipboardContent(name, message))
  peer.on('error', (e) => console.log(`Connection error: ${e}`))
})

swarm.on('update', () => {
  document.querySelector('#peers-count').textContent = swarm.connections.size
})

// listeners
const sendMyClipboardContentButton = document.getElementById(
  'send-my-clipboard-content'
)
sendMyClipboardContentButton.addEventListener('click', sendClipboardContent)

const createConnectionForm = document.getElementById('create-connection-form')
createConnectionForm.addEventListener('submit', createConnection)

const loginForm = document.getElementById('login-form')
loginForm.addEventListener('submit', login)

// functions
async function createConnection(e) {
  e.preventDefault()
  // const passwordField = e.srcElement.elements['set-password'].value.trim()
  const connectionIdBuffer = crypto.randomBytes(32)
  joinSwarm(connectionIdBuffer)
}

async function login(e) {
  e.preventDefault()
  const connectionId = e.srcElement.elements['connectionid'].value.trim()
  if (!connectionId) {
    alert('Please enter a connection ID')
    return
  } else {
    // const password = e.srcElement.elements['password'].value.trim()
    joinSwarm(b4a.from(connectionId, 'hex'))
  }
}

async function joinSwarm(connectionIdBuffer) {
  document.querySelector('#loading').classList.remove('hidden')

  const discovery = swarm.join(connectionIdBuffer, {
    password,
  })
  await discovery.flushed()

  const connectionId = b4a.toString(connectionIdBuffer, 'hex')

  document.querySelector('#connection-id').textContent = connectionId
  document.querySelector('#loading').classList.add('hidden')

  showPage('main-page')
}

async function sendClipboardContent(e) {
  const clipboardContent = await navigator.clipboard.readText()
  e.preventDefault()

  const peers = [...swarm.connections]
  for (const peer of peers) peer.write(clipboardContent)
}

function newClipboardContent(from, message) {
  console.log(from, message)
  //
  // TODO: https://docs.pears.com/building-blocks/autobase
  // TODO: save to autobase, read by user id and handle password for room connection
}
