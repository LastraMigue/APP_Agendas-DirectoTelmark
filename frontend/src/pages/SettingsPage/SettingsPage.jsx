import { useState, useEffect, useContext } from 'react'
import { MainLayout } from '../../layouts/MainLayout'
import { AuthContext } from '../../context/AuthContext'
import { profilesService } from '../../services/supabase/profiles.service'
import { User, Phone, Mail, MessageSquare, Save, Settings } from 'lucide-react'
import Loader from '../../components/Loader/Loader'
import Button from '../../components/Button/Button'
import Input from '../../components/Input/Input'
import './SettingsPage.css'

const SettingsPage = () => {
  const { user } = useContext(AuthContext)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [whatsappReminders, setWhatsappReminders] = useState(true)
  const [emailReminders, setEmailReminders] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return
      try {
        const profile = await profilesService.getById(user.id)
        if (profile) {
          setFullName(profile.full_name || '')
          setPhone(profile.phone || '')
          const meta = profile.metadata || {}
          setWhatsappReminders(meta.whatsapp_reminders !== false)
          setEmailReminders(meta.email_reminders !== false)
        }
      } catch (err) {
        console.error('Error al cargar perfil:', err)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [user])

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)
    try {
      await profilesService.update(user.id, {
        full_name: fullName,
        phone,
        metadata: {
          whatsapp_reminders: whatsappReminders,
          email_reminders: emailReminders
        }
      })
      setSuccess('Configuración guardada correctamente')
    } catch (err) {
      setError('Error al guardar: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="settings-loading">
          <Loader size="large" text="Cargando configuración..." />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="settings-container">
        <header className="settings-header">
          <h2><Settings size={28} className="header-icon" /> Configuración</h2>
          <p>Administra tu perfil y preferencias de notificaciones</p>
        </header>

        <div className="settings-card">
          <div className="settings-card-header">
            <h3>Datos del Perfil</h3>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSave} className="settings-form">
            <div className="settings-form-body">
              <Input
                label="Nombre completo"
                icon={User}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Tu nombre completo"
              />

              <Input
                label="Teléfono"
                icon={Phone}
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+34 600 000 000"
              />
            </div>

            <div className="settings-divider" />

            <div className="settings-notifications">
              <h4>Notificaciones y Recordatorios</h4>
              <p className="settings-notifications-desc">
                Activa o desactiva el envío de recordatorios automáticos
              </p>

              <label className="toggle-row">
                <div className="toggle-info">
                  <Mail size={20} />
                  <div>
                    <span className="toggle-label">Recordatorios por Gmail</span>
                    <span className="toggle-desc">Recibe recordatorios de citas por correo electrónico</span>
                  </div>
                </div>
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={emailReminders}
                    onChange={(e) => setEmailReminders(e.target.checked)}
                  />
                  <span className="toggle-slider" />
                </div>
              </label>

              <label className="toggle-row">
                <div className="toggle-info">
                  <MessageSquare size={20} />
                  <div>
                    <span className="toggle-label">Recordatorios por WhatsApp</span>
                    <span className="toggle-desc">Recibe recordatorios de citas por WhatsApp</span>
                  </div>
                </div>
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={whatsappReminders}
                    onChange={(e) => setWhatsappReminders(e.target.checked)}
                  />
                  <span className="toggle-slider" />
                </div>
              </label>
            </div>

            <div className="settings-actions">
              <Button type="submit" loading={saving} variant="primary" size="large">
                <Save size={18} /> Guardar Cambios
              </Button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  )
}

export default SettingsPage
