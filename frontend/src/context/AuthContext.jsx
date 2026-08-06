// Auth state for the farmer login/dashboard. Holds the current user, persists the
// token via api.js (localStorage), and re-validates it on load with /api/auth/me.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  fetchMe,
  getToken,
  login as apiLogin,
  register as apiRegister,
  setToken,
} from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false) // finished the initial token check

  // On first load, if we have a token, confirm it's still valid.
  useEffect(() => {
    let alive = true
    if (!getToken()) {
      setReady(true)
      return
    }
    fetchMe()
      .then((d) => alive && setUser(d.user))
      .catch(() => {
        setToken(null)
        if (alive) setUser(null)
      })
      .finally(() => alive && setReady(true))
    return () => { alive = false }
  }, [])

  const login = useCallback(async (email, password) => {
    const d = await apiLogin({ email, password })
    setToken(d.token)
    setUser(d.user)
    return d.user
  }, [])

  const register = useCallback(async (payload) => {
    const d = await apiRegister(payload)
    setToken(d.token)
    setUser(d.user)
    return d.user
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, ready, login, register, logout }),
    [user, ready, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
