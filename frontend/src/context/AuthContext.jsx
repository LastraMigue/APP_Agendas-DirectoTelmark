import { createContext, useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../services/supabase/client'
import { authService } from '../services/supabase/auth.service'
import { profilesService } from '../services/supabase/profiles.service'

export const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isConfigured, setIsConfigured] = useState(false)

  // Función para sincronizar perfil al loguear
  const syncProfile = useCallback(async (authUser) => {
    if (!authUser) return
    try {
      await profilesService.ensureProfileForUser(authUser)
    } catch (err) {
      console.error('Error sincronizando perfil:', err)
    }
  }, [])

  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey || supabaseUrl === '' || supabaseKey === '') {
      console.warn('Supabase no está configurado.')
      setLoading(false)
      return
    }

    setIsConfigured(true)

    const initAuth = async () => {
      try {
        console.log('Iniciando verificación de sesión...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Error al obtener sesión de Supabase Auth:', sessionError);
          throw sessionError;
        }

        if (session?.user) {
          console.log('Usuario detectado, sincronizando perfil...');
          await syncProfile(session.user)
          setUser(session.user)
        } else {
          // Si no hay sesión real, buscamos un usuario mock guardado
          const savedUser = localStorage.getItem('sb-mock-user')
          if (savedUser) {
            setUser(JSON.parse(savedUser))
          }
        }
        console.log('Inicialización de auth completada.');
      } catch (err) {
        console.error('ERROR CRÍTICO EN INICIALIZACIÓN:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await syncProfile(session.user)
        setUser(session.user)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      } else if (session?.user) {
        setUser(session.user)
      } else if (!event.includes('SIGNED_OUT')) {
        // No borrar si es un refresh y hay mock user
        const savedUser = localStorage.getItem('sb-mock-user')
        if (savedUser) setUser(JSON.parse(savedUser))
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [syncProfile])

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
      localStorage.setItem('sb-mock-user', JSON.stringify(mockUser))
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
      localStorage.setItem('sb-mock-user', JSON.stringify(mockUser))
      setUser(mockUser)
      setLoading(false)
      return { user: mockUser, session: { access_token: 'mock-agent-007-token' } }
    }

    if (!isConfigured) {
      setLoading(false)
      const errorMsg = 'Servicio no configurado'
      setError(errorMsg)
      throw new Error(errorMsg)
    }

    try {
      const data = await authService.signIn(email, password)
      if (data.user) await syncProfile(data.user)
      setUser(data.user)
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [isConfigured, syncProfile])

  const signInClient = useCallback(async (email, token) => {
    setLoading(true)
    setError(null)
    try {
      const { success, data } = await authService.verifyOTP(email, token)
      if (success && data.user) {
        await syncProfile(data.user)
        setUser(data.user)
        return data
      }
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [syncProfile])

  const signUp = useCallback(async (email, password) => {
    if (!isConfigured) throw new Error('Supabase no está configurado')
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
    setLoading(true)
    try {
      await authService.signOut()
      localStorage.removeItem('sb-mock-user')
      setUser(null)
    } catch (err) {
      localStorage.removeItem('sb-mock-user')
      setUser(null)
    } finally {
      setLoading(false)
    }
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
