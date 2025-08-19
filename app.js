/** @typedef {import('pear-interface')} */ /* global Pear */

import Hyperswarm from 'hyperswarm' // Module for P2P networking and connecting peers
import crypto from 'hypercore-crypto' // Cryptographic functions for generating the key in app
import b4a from 'b4a' // Module for buffer-to-string and vice-versa conversions

import Corestore from 'corestore'
import Autobase from 'autobase'
import Hyperbee from 'hyperbee'

const store = new Corestore('./autobase-folder')

const base = await initAutobase()

const { teardown, updates } = Pear

const swarm = new Hyperswarm()

teardown(() => swarm.destroy())

// updates(() => Pear.reload())

swarm.on('connection', (peer) => {
  peer.pipe(store.replicate(peer)).pipe(peer)

  const name = b4a.toString(peer.remotePublicKey, 'hex').substr(0, 6)
  const device = document.createElement('div')
  const deviceList = document.querySelector('#devices-list')

  const isFirstDevice = !deviceList.querySelector('.device')

  device.classList.add('device')
  if (isFirstDevice) {
    device.classList.add('active')
    document.querySelector('#clipboard-form').classList.remove('hidden')
  }
  device.textContent = name
  deviceList.appendChild(device)

  device.addEventListener('click', async () => {
    const activeDevice = deviceList.querySelector('.active')
    if (activeDevice) activeDevice.classList.remove('active')
    device.classList.add('active')

    // read
    const clipboardContent = await read(base, name)
    document.querySelector('#clipboard-content').value = clipboardContent
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

async function newClipboardContent(from, message) {
  await write(base, from, message)
}

// autobase stuff

function open(store) {
  return new Hyperbee(store.get('kv-store'), {
    keyEncoding: 'utf-8',
    valueEncoding: 'json',
  })
}

async function apply(nodes, view) {
  for (const { value } of nodes) {
    if (value.type === 'set' && value.key) {
      await view.put(value.key, value.val)
    } else if (value.type === 'del' && value.key) {
      await view.del(value.key)
    }
  }
}

async function initAutobase(remoteKey = null) {
  const base = new Autobase(store, remoteKey, { open, apply })
  await base.ready()
  return base
}

async function write(base, key, val) {
  if (!key) throw new Error('Key is required')
  await base.append({ type: 'set', key, val })
  await base.update() // refresh
}

async function read(base, key) {
  await base.update()
  const result = await base.view.get(key)
  return result ? result.value : null
}
