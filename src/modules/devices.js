import { readFromLocalStorage } from './storage.js'

export function createDeviceElement(name, deviceList) {
  const device = document.createElement('div')
  device.classList.add('device')
  device.textContent = name

  const isFirstDevice = !deviceList.querySelector('.device')
  if (isFirstDevice) {
    deviceList.innerHTML = ''
    device.classList.add('active')
    document.querySelector('#clipboard-form').classList.remove('hidden')
    device.click()
  }

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

  return device
}

export function updatePeerCount(swarm) {
  document.querySelector('#peers-count').textContent = swarm.connections.size
}

export function resetDeviceList() {
  const deviceList = document.querySelector('#devices-list')
  deviceList.innerHTML = 'Waiting for peers to join...'
}
