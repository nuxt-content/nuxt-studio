export function ensure(check: () => boolean, timeout: number = 50, maxTries: number = 20) {
  return new Promise((resolve, reject) => {
    _ensureWithCallback(check, (error) => {
      if (error) {
        reject(error)
      }
      else {
        resolve(true)
      }
    }, timeout, maxTries)
  })
}

function _ensureWithCallback(check: () => boolean, callback: (error?: Error) => void, timeout: number = 50, maxTries: number = 20) {
  if (check()) {
    return callback(undefined)
  }
  setTimeout(() => {
    _ensureWithCallback(check, callback, timeout, maxTries - 1)
  }, timeout)

  if (maxTries === 0) {
    callback(new Error('Max tries reached'))
  }
}
