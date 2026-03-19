import { defineStore } from 'pinia'
import { ref } from 'vue'

const API_BASE = 'http://localhost:8002'

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  const text = await response.text()
  let data = {}
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = { raw: text }
    }
  }

  return {
    ok: response.ok,
    status: response.status,
    data,
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const isAuthenticated = ref(false)
  const checked = ref(false)

  async function checkAuth() {
    const result = await request('/api/auth/check', { method: 'GET' })
    checked.value = true

    if (result.ok && result.data?.ok) {
      isAuthenticated.value = true
      user.value = {
        email: result.data.email || '',
        name: result.data.name || '',
        role: result.data.role || '',
      }
      return true
    }

    isAuthenticated.value = false
    user.value = null
    return false
  }

  async function login({ email, password }) {
    const rawId = email.trim()
    const localPart = rawId.includes('@') ? rawId.split('@')[0] : rawId

    const result = await request('/api/login', {
      method: 'POST',
      body: JSON.stringify({
        email: rawId,
        username: rawId,
        password,
      }),
    })

    if (!result.ok || !result.data?.ok) {
      const fallback = await request('/api/login', {
        method: 'POST',
        body: JSON.stringify({
          email: localPart,
          username: localPart,
          password,
        }),
      })

      if (!fallback.ok || !fallback.data?.ok) {
        const message = fallback.data?.error || fallback.data?.message || result.data?.error || result.data?.message || '로그인에 실패했습니다.'
        throw new Error(message)
      }
    }

    await checkAuth()
    return user.value
  }

  async function signup({ email, password, name, role }) {
    const rawEmail = email.trim()
    const localPart = rawEmail.includes('@') ? rawEmail.split('@')[0] : rawEmail

    const result = await request('/api/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: rawEmail,
        username: localPart,
        password,
        name: name.trim(),
        role: role.trim(),
      }),
    })

    if (!result.ok || !result.data?.ok) {
      const message = result.data?.error || result.data?.message || '회원가입에 실패했습니다.'
      throw new Error(message)
    }

    return true
  }

  async function logout() {
    await request('/api/logout', { method: 'POST' })
    isAuthenticated.value = false
    checked.value = true
    user.value = null
  }

  return {
    user,
    isAuthenticated,
    checked,
    checkAuth,
    login,
    signup,
    logout,
  }
})
