import b4a from 'b4a'
import crypto from 'hypercore-crypto'
import { joinSwarm, disconnectFromSwarm } from './swarm.js'

let currentDiscovery = null

export function setupFormHandlers(swarm) {
  const sendMyClipboardContentButton = document.getElementById(
    'send-my-clipboard-content'
  )
  sendMyClipboardContentButton.addEventListener('click', (e) =>
    sendClipboardContent(e, swarm)
  )

  const createConnectionForm = document.getElementById('create-connection-form')
  createConnectionForm.addEventListener('submit', (e) =>
    createConnection(e, swarm)
  )

  const loginForm = document.getElementById('login-form')
  loginForm.addEventListener('submit', (e) => login(e, swarm))

  const copyButton = document.getElementById('copy-button')
  copyButton.addEventListener('click', copyClipboardContent)

  const disconnectButton = document.getElementById('disconnect-button')
  disconnectButton.addEventListener('click', () =>
    disconnectFromSwarm(swarm, currentDiscovery)
  )
}

async function createConnection(e, swarm) {
  e.preventDefault()
  const connectionIdBuffer = crypto.randomBytes(32)
  currentDiscovery = await joinSwarm(swarm, connectionIdBuffer)
}

async function login(e, swarm) {
  e.preventDefault()
  const connectionId = e.srcElement.elements['connectionid'].value.trim()
  if (!connectionId) {
    alert('Please enter a connection ID')
    return
  } else {
    currentDiscovery = await joinSwarm(swarm, b4a.from(connectionId, 'hex'))
  }
}

async function sendClipboardContent(e, swarm) {
  const clipboardContent = await navigator.clipboard.readText()
  e.preventDefault()
  const peers = [...swarm.connections]
  for (const peer of peers) peer.write(clipboardContent)
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
