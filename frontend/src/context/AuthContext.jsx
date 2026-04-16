import { createContext, useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../services/supabase/client'
import { authService } from '../services/supabase/auth.service'

export const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isConfigured, setIsConfigured] = useState(false)

  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl === '' || supabaseKey === '') {
      console.warn('Supabase no está configurado. Usando modo demo.')
      setLoading(false)
      return
    }

    setIsConfigured(true)

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
      } catch (err) {
        console.error('Error al obtener sesión:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = useCallback(async (email, password) => {
    if (!isConfigured) {
      throw new Error('Supabase no está configurado. Configure VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY')
    }
    setLoading(true)
    setError(null)
    try {
      const data = await authService.signIn(email, password)
      setUser(data.user)
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [isConfigured])

  const signUp = useCallback(async (email, password) => {
    if (!isConfigured) {
      throw new Error('Supabase no está configurado')
    }
    setLoading(true)
    setError(null)
    try {
      const data = await authService.signUp(email, password)
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [isConfigured])

  const signOut = useCallback(async () => {
    if (!isConfigured) {
      setUser(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      await authService.signOut()
      setUser(null)
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [isConfigured])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const value = useMemo(() => ({
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    clearError,
    isAuthenticated: !!user,
    isConfigured
  }), [user, loading, error, signIn, signUp, signOut, clearError, isConfigured])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
