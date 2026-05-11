import { createContext, useState, useEffect, useContext, useCallback } from 'react'
import { AuthContext } from './AuthContext'
import { notificationsService } from '../services/supabase/notifications.service'
import { supabase } from '../services/supabase/client'
import { appointmentsService } from '../services/supabase/appointments.service'

export const NotificationContext = createContext()

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const { user } = useContext(AuthContext)

  const fetchNotifications = useCallback(async () => {
    if (!user) return
    try {
      setLoading(true)
      console.log('Fetching notifications for user:', user.id)
      const data = await notificationsService.getByUserId(user.id)
      setNotifications(data || [])
      
      // If no notifications, we can't just create one here because it would loop
      // but we could at least log that we found none.
      if (!data || data.length === 0) {
        console.log('No notifications found in database.')
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      // Check if it's a "table not found" error
      if (error.code === 'PGRST116' || error.message?.includes('not found')) {
        console.warn('Notifications table might not exist yet. Please run the migration.')
      }
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchNotifications()

      console.log('Subscribing to notifications real-time...')
      // Real-time subscription for notifications
      const notifChannel = supabase
        .channel(`public:notifications:user_id=eq.${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Real-time notification event:', payload.eventType)
            if (payload.eventType === 'INSERT') {
              setNotifications(prev => [payload.new, ...prev])
            } else if (payload.eventType === 'UPDATE') {
              setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new : n))
            } else if (payload.eventType === 'DELETE') {
              setNotifications(prev => prev.filter(n => n.id === payload.old.id))
            }
          }
        )
        .subscribe()

      // Real-time subscription for new profiles (Admins only)
      let profileChannel
      if (user.role === 'admin') {
        console.log('Admin detected, subscribing to profiles real-time...')
        profileChannel = supabase
          .channel('public:profiles')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'profiles'
            },
            async (payload) => {
              console.log('New profile created:', payload.new)
              // Create a notification for the current admin
              await addNotification({
                user_id: user.id,
                title: 'Nuevo Registro',
                message: `Se ha registrado un nuevo ${payload.new.role}: ${payload.new.full_name}`,
                type: payload.new.role === 'agent' ? 'agent_created' : 'client_created'
              })
            }
          )
          .subscribe()
      }

      return () => {
        supabase.removeChannel(notifChannel)
        if (profileChannel) supabase.removeChannel(profileChannel)
      }
    } else {
      setNotifications([])
    }
  }, [user, fetchNotifications])

  // Check for upcoming appointments (less than 30 mins)
  useEffect(() => {
    if (!user) return

    const checkUpcomingAppointments = async () => {
      try {
        console.log('Checking for upcoming appointments...')
        const appointments = await appointmentsService.getAll()
        const now = new Date()
        const thirtyMinsFromNow = new Date(now.getTime() + 30 * 60000)

        for (const app of appointments) {
          const appDate = new Date(app.start_time || app.date)
          
          // Check if the appointment is in the window [now, now + 30min]
          if (appDate > now && appDate <= thirtyMinsFromNow) {
            
            // Should this user be notified?
            // Notify if user is the agent, the client, or an admin
            const isAgent = app.agent_id === user.id
            const isClient = app.client_id === user.id
            const isAdmin = user.role === 'admin'

            if (isAgent || isClient || isAdmin) {
              const alreadyNotified = notifications.some(
                n => n.type === 'appointment_reminder' && n.message.includes(app.id)
              )

              if (!alreadyNotified) {
                let rolePrefix = ''
                if (isAgent) rolePrefix = '[Agente] '
                if (isClient) rolePrefix = '[Cliente] '
                if (isAdmin) rolePrefix = '[Admin] '

                console.log(`Creating ${rolePrefix}reminder for appointment:`, app.id)
                await notificationsService.create({
                  user_id: user.id,
                  title: 'Cita próxima',
                  message: `${rolePrefix}Tienes una cita en menos de 30 minutos: ${app.title || 'Cita sin título'}. ID: ${app.id}`,
                  type: 'appointment_reminder'
                })
              }
            }
          }
        }
      } catch (error) {
        console.error('Error checking upcoming appointments:', error)
      }
    }

    const interval = setInterval(checkUpcomingAppointments, 5 * 60000)
    checkUpcomingAppointments()

    return () => clearInterval(interval)
  }, [user, notifications])

  const addNotification = async (notification) => {
    if (!user) return
    try {
      await notificationsService.create({
        ...notification,
        user_id: notification.user_id || user.id
      })
    } catch (error) {
      console.error('Error adding notification:', error)
    }
  }

  const markAsRead = async (id) => {
    try {
      await notificationsService.markAsRead(id)
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const deleteNotification = async (id) => {
    try {
      const { error } = await supabase.from('notifications').delete().eq('id', id)
      if (error) throw error
      // State will be updated by real-time listener or manually if needed
      setNotifications(prev => prev.filter(n => n.id !== id))
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const clearAll = async () => {
    if (!user) return
    try {
      const { error } = await supabase.from('notifications').delete().eq('user_id', user.id)
      if (error) throw error
      setNotifications([])
    } catch (error) {
      console.error('Error clearing notifications:', error)
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      loading, 
      markAsRead, 
      deleteNotification, 
      addNotification,
      clearAll
    }}>
      {children}
    </NotificationContext.Provider>
  )
}
