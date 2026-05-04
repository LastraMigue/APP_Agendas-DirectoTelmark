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
    setLoading(true)
    setError(null)

    // Credenciales de prueba — Admin/Supervisor
    if (email === 'admin@test.com' && password === 'password123') {
      const mockUser = {
        id: 'test-admin-id',
        email: 'admin@test.com',
        user_metadata: { full_name: 'Administrador Test', role: 'admin' },
        role: 'authenticated'
      }
      setUser(mockUser)
      setLoading(false)
      return { user: mockUser, session: { access_token: 'mock-token' } }
    }

    // Credenciales de prueba — Agente Especial
    if (email === 'agente007@test.com' && password === '007007') {
      const mockUser = {
        id: 'test-agent-007',
        email: 'agente007@test.com',
        user_metadata: { full_name: 'Agente 007', role: 'agente' },
        role: 'authenticated'
      }
      setUser(mockUser)
      setLoading(false)
      return { user: mockUser, session: { access_token: 'mock-agent-007-token' } }
    }

    // Si no es el usuario de prueba y Supabase no está configurado
    if (!isConfigured) {
      setLoading(false)
      const errorMsg = 'Credenciales inválidas'
      setError(errorMsg)
      throw new Error(errorMsg)
    }

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

  const signInClient = useCallback(async (email, name) => {
    setLoading(true)
    setError(null)
    
    // Loguear a cualquier usuario que entre por el form de clientes como un cliente mock
    const mockClient = {
      id: `client-${email}`,
      email: email,
      user_metadata: { full_name: name },
      role: 'authenticated'
    }
    setUser(mockClient)
    setLoading(false)
    return { user: mockClient, session: { access_token: 'mock-client-token' } }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const value = useMemo(() => ({
    user,
    loading,
    error,
    signIn,
    signInClient,
    signUp,
    signOut,
    clearError,
    isAuthenticated: !!user,
    isConfigured
  }), [user, loading, error, signIn, signInClient, signUp, signOut, clearError, isConfigured])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
