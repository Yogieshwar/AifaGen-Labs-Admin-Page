const AUTH_STORAGE_KEY = 'aifagen-admin-authenticated'

export function isAuthenticated() {
  return window.localStorage.getItem(AUTH_STORAGE_KEY) === 'true'
}

export function signIn() {
  window.localStorage.setItem(AUTH_STORAGE_KEY, 'true')
}

export function signOut() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY)
}
