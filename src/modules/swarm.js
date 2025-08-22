import b4a from 'b4a'
import { writeToLocalStorage, clearLocalStorage } from './storage.js'
import { showNotification } from '../ui/notifications.js'
import {
  createDeviceElement,
  updatePeerCount,
  resetDeviceList,
} from './devices.js'

export function setupSwarmHandlers(swarm) {
  swarm.on('connection', (peer) => {
    const name = b4a.toString(peer.remotePublicKey, 'hex').substr(0, 6)
    const deviceList = document.querySelector('#devices-list')

    const device = createDeviceElement(name, deviceList)
    deviceList.appendChild(device)

    peer.on('data', (message) => newClipboardContent(name, message))
    peer.on('error', (e) => console.log(`Connection error: ${e}`))
  })

  swarm.on('update', () => {
    updatePeerCount(swarm)
  })
}

export async function joinSwarm(swarm, connectionIdBuffer) {
  document.querySelector('#loading').classList.remove('hidden')

  const discovery = swarm.join(connectionIdBuffer)
  await discovery.flushed()

  const connectionId = b4a.toString(connectionIdBuffer, 'hex')
  document.querySelector('#connection-id').textContent = connectionId
  document.querySelector('#loading').classList.add('hidden')

  showPage('main-page')

  return discovery
}

export async function disconnectFromSwarm(swarm, discovery) {
  if (discovery) {
    discovery.destroy()
  }
  clearLocalStorage()
  resetDeviceList()

  document.querySelector('#clipboard-form').classList.add('hidden')
  document.querySelector('#clipboard-content').value = ''
  document.querySelector('#peers-count').textContent = '0'
  document.querySelector('#connection-id').textContent = ''

  showPage('login-page')
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
