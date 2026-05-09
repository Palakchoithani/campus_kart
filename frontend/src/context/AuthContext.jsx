import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

function persistAuth(result) {
  localStorage.setItem('campus_token', result.token)
  localStorage.setItem('campus_user', JSON.stringify(result.user))
}

function clearAuthStorage() {
  localStorage.removeItem('campus_token')
  localStorage.removeItem('campus_user')
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('campus_token') || '')
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    const bootstrapSession = async () => {
      const storedToken = localStorage.getItem('campus_token')
      const storedUser = localStorage.getItem('campus_user')

      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser))
        } catch (error) {
          clearAuthStorage()
        }
      }

      if (!storedToken) {
        setSessionReady(true)
        return
      }

      try {
        const result = await api.getCurrentUser()
        setUser(result.user)
        setToken(storedToken)
        persistAuth({ token: storedToken, user: result.user })
      } catch (error) {
        setUser(null)
        setToken('')
        clearAuthStorage()
      } finally {
        setSessionReady(true)
      }
    }

    bootstrapSession()
  }, [])

  const login = useCallback(async ({ email, password }) => {
    const result = await api.login(email, password)
    setUser(result.user)
    setToken(result.token)
    persistAuth(result)
    return result
  }, [])

  const signup = useCallback(async ({ name, email, password }) => {
    const result = await api.signup({ name, email, password })
    setUser(result.user)
    setToken(result.token)
    persistAuth(result)
    return result
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setToken('')
    clearAuthStorage()
  }, [])

  const requestPasswordReset = useCallback(async (email) => {
    return api.requestPasswordReset(email)
  }, [])

  const resetPassword = useCallback(async ({ email, token: resetToken, password }) => {
    const result = await api.resetPassword({ email, token: resetToken, password })
    setUser(result.user)
    setToken(result.token)
    persistAuth(result)
    return result
  }, [])

  const socialLogin = useCallback(async (provider) => {
    throw new Error(`${provider} login requires provider configuration.`)
  }, [])

  const value = useMemo(() => ({
    user,
    token,
    sessionReady,
    login,
    signup,
    logout,
    requestPasswordReset,
    resetPassword,
    socialLogin,
  }), [user, token, sessionReady, login, signup, logout, requestPasswordReset, resetPassword, socialLogin])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}