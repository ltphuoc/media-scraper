'use client'

const USERNAME = process.env.NEXT_PUBLIC_BASIC_USER || 'admin'
const PASSWORD = process.env.NEXT_PUBLIC_BASIC_PASS || 'admin'

export function login(username: string, password: string) {
  if (username === USERNAME && password === PASSWORD) {
    document.cookie = 'auth=true; path=/; max-age=3600'
    localStorage.setItem('auth', 'true')
    return true
  }
  return false
}

export function logout() {
  document.cookie = 'auth=false; path=/; max-age=0'
  localStorage.removeItem('auth')
}
