import { createContext, useState, useEffect, useCallback } from 'react'
import apiClient from '../api/client'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchCurrentUser = useCallback(async () => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      setUser(null)
      setLoading(false)
      return null
    }

    try {
      const { data } = await apiClient.get('/auth/me')
      setUser(data)
      return data
    } catch (err) {
      console.error('Failed to restore session:', err)
      localStorage.removeItem('access_token')
      setUser(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCurrentUser()
  }, [fetchCurrentUser])

  const login = async (email, password) => {
    const { data: tokenData } = await apiClient.post('/auth/login', {
      email,
      password,
    })

    localStorage.setItem('access_token', tokenData.access_token)

    const { data: userData } = await apiClient.get('/auth/me')
    setUser(userData)
    return userData
  }

  const logout = useCallback(() => {
    localStorage.removeItem('access_token')
    setUser(null)
  }, [])

  const refreshUser = async () => {
    return await fetchCurrentUser()
  }

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
