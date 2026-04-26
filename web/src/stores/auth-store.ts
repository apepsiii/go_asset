import { create } from 'zustand'

interface AuthState {
  auth: {
    userId: string | null
    sessionId: string | null
    setAuth: (userId: string | null, sessionId: string | null) => void
    reset: () => void
  }
}

export const useAuthStore = create<AuthState>()((set) => ({
  auth: {
    userId: null,
    sessionId: null,
    setAuth: (userId, sessionId) =>
      set((state) => ({
        ...state,
        auth: { ...state.auth, userId, sessionId },
      })),
    reset: () =>
      set((state) => ({
        ...state,
        auth: { ...state.auth, userId: null, sessionId: null },
      })),
  },
}))
