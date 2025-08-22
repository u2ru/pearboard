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
  if (isFirstDevice) {
    deviceList.innerHTML = ''
    device.classList.add('active')
    document.querySelector('#clipboard-form').classList.remove('hidden')
    device.click()
  }
  device.textContent = name
  deviceList.appendChild(device)

  device.addEventListener('click', async () => {
    const activeDevice = deviceList.querySelector('.active')
    if (activeDevice) activeDevice.classList.remove('active')
    device.classList.add('active')

    document.querySelector('#clipboard-form').classList.remove('hidden')

    const clipboardContent = await readFromLocalStorage(name)
    if (clipboardContent) {
      document.querySelector('#clipboard-content').value = clipboardContent
    } else {
      document.querySelector('#clipboard-content').value =
        'No clipboard content available for this device'
    }
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

const copyButton = document.getElementById('copy-button')
copyButton.addEventListener('click', copyClipboardContent)

const disconnectButton = document.getElementById('disconnect-button')
disconnectButton.addEventListener('click', disconnectFromSwarm)

// functions
async function createConnection(e) {
  e.preventDefault()
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
    joinSwarm(b4a.from(connectionId, 'hex'))
  }
}

async function joinSwarm(connectionIdBuffer) {
  document.querySelector('#loading').classList.remove('hidden')

  const discovery = swarm.join(connectionIdBuffer)
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
  await writeToLocalStorage(from, message)

  const deviceList = document.querySelector('#devices-list')
  const activeDevice = deviceList.querySelector('.active')
  if (activeDevice && activeDevice.textContent === from) {
    document.querySelector('#clipboard-content').value = message
  }

  showNotification(`New clipboard content received from ${from}`)
}

async function showNotification(message) {
  const notification = document.createElement('div')
  notification.textContent = message
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4CAF50;
    color: white;
    padding: 12px 20px;
    border-radius: 4px;
    z-index: 1000;
    font-size: 14px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  `

  document.body.appendChild(notification)

  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification)
    }
  }, 3000)
}

async function readFromLocalStorage(from) {
  try {
    const content = localStorage.getItem(from)
    return content || null
  } catch (err) {
    console.error('Error reading from localStorage:', err)
    return null
  }
}

async function writeToLocalStorage(from, message) {
  try {
    if (from && message) {
      localStorage.setItem(from, message)
      console.log(`Saved clipboard content from ${from} to localStorage`)
    }
  } catch (err) {
    console.error('Error writing to localStorage:', err)
  }
}

async function copyClipboardContent() {
  const clipboardContent = document.querySelector('#clipboard-content').value
  if (
    clipboardContent &&
    clipboardContent !== 'No clipboard content available for this device'
  ) {
    try {
      await navigator.clipboard.writeText(clipboardContent)
      const copyButton = document.getElementById('copy-button')
      const originalText = copyButton.textContent
      copyButton.textContent = 'Copied!'
      setTimeout(() => {
        copyButton.textContent = originalText
      }, 1000)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
      alert('Failed to copy to clipboard')
    }
  }
}

async function disconnectFromSwarm() {
  swarm.leaveAll()

  clearLocalStorage()

  const deviceList = document.querySelector('#devices-list')
  deviceList.innerHTML = 'Waiting for peers to join...'

  document.querySelector('#clipboard-form').classList.add('hidden')

  document.querySelector('#clipboard-content').value = ''

  document.querySelector('#peers-count').textContent = '0'

  document.querySelector('#connection-id').textContent = ''

  showPage('login-page')
}

async function clearLocalStorage() {
  try {
    const keys = Object.keys(localStorage)
    keys.forEach((key) => {
      if (key.length === 6) {
        localStorage.removeItem(key)
      }
    })
    console.log('Cleared localStorage for this session')
  } catch (err) {
    console.error('Error clearing localStorage:', err)
  }
}
