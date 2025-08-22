export async function readFromLocalStorage(from) {
  try {
    const content = localStorage.getItem(from)
    return content || null
  } catch (err) {
    console.error('Error reading from localStorage:', err)
    return null
  }
}

export async function writeToLocalStorage(from, message) {
  try {
    if (from && message) {
      localStorage.setItem(from, message)
      console.log(`Saved clipboard content from ${from} to localStorage`)
    }
  } catch (err) {
    console.error('Error writing to localStorage:', err)
  }
}

export async function clearLocalStorage() {
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
