import type { User } from '@/services/auth'
import { create } from 'zustand'

const ACCESS_TOKEN_KEY = 'linkdo_admin_token'

interface AuthState {
  auth: {
    user: User | null
    setUser: (user: User | null) => void
    accessToken: string
    setAccessToken: (accessToken: string) => void
    reset: () => void
  }
}

function loadToken(): string {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

function saveToken(token: string) {
  try {
    if (token) {
      localStorage.setItem(ACCESS_TOKEN_KEY, token)
    } else {
      localStorage.removeItem(ACCESS_TOKEN_KEY)
    }
  } catch {
    // ignore
  }
}

export const useAuthStore = create<AuthState>()((set) => ({
  auth: {
    user: null,
    accessToken: loadToken(),
    setUser: (user) =>
      set((state) => ({ ...state, auth: { ...state.auth, user } })),
    setAccessToken: (token) => {
      saveToken(token)
      set((state) => ({
        ...state,
        auth: { ...state.auth, accessToken: token },
      }))
    },
    reset: () => {
      saveToken('')
      set((state) => ({
        ...state,
        auth: { ...state.auth, user: null, accessToken: '' },
      }))
    },
  },
}))
