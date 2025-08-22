export async function copyClipboardContent() {
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

export async function sendClipboardContent(swarm) {
  const clipboardContent = await navigator.clipboard.readText()
  const peers = [...swarm.connections]
  for (const peer of peers) peer.write(clipboardContent)
}
