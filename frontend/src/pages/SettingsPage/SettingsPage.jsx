import { useState, useEffect, useContext } from 'react'
import { MainLayout } from '../../layouts/MainLayout'
import { AuthContext } from '../../context/AuthContext'
import { profilesService } from '../../services/supabase/profiles.service'
import { User, Phone, MessageSquare, Save, Settings } from 'lucide-react'
import Loader from '../../components/Loader/Loader'
import Button from '../../components/Button/Button'
import Input from '../../components/Input/Input'
import './SettingsPage.css'

const COUNTRY_CODES = [
  { code: '+1', country: 'US/CA' },
  { code: '+7', country: 'RU/KZ' },
  { code: '+20', country: 'EG' },
  { code: '+27', country: 'ZA' },
  { code: '+30', country: 'GR' },
  { code: '+31', country: 'NL' },
  { code: '+32', country: 'BE' },
  { code: '+33', country: 'FR' },
  { code: '+34', country: 'ES' },
  { code: '+36', country: 'HU' },
  { code: '+39', country: 'IT' },
  { code: '+40', country: 'RO' },
  { code: '+41', country: 'CH' },
  { code: '+43', country: 'AT' },
  { code: '+44', country: 'UK' },
  { code: '+45', country: 'DK' },
  { code: '+46', country: 'SE' },
  { code: '+47', country: 'NO' },
  { code: '+48', country: 'PL' },
  { code: '+49', country: 'DE' },
  { code: '+51', country: 'PE' },
  { code: '+52', country: 'MX' },
  { code: '+53', country: 'CU' },
  { code: '+54', country: 'AR' },
  { code: '+55', country: 'BR' },
  { code: '+56', country: 'CL' },
  { code: '+57', country: 'CO' },
  { code: '+58', country: 'VE' },
  { code: '+60', country: 'MY' },
  { code: '+61', country: 'AU' },
  { code: '+62', country: 'ID' },
  { code: '+63', country: 'PH' },
  { code: '+64', country: 'NZ' },
  { code: '+65', country: 'SG' },
  { code: '+66', country: 'TH' },
  { code: '+81', country: 'JP' },
  { code: '+82', country: 'KR' },
  { code: '+84', country: 'VN' },
  { code: '+86', country: 'CN' },
  { code: '+90', country: 'TR' },
  { code: '+91', country: 'IN' },
  { code: '+92', country: 'PK' },
  { code: '+93', country: 'AF' },
  { code: '+94', country: 'LK' },
  { code: '+95', country: 'MM' },
  { code: '+98', country: 'IR' },
  { code: '+212', country: 'MA' },
  { code: '+213', country: 'DZ' },
  { code: '+216', country: 'TN' },
  { code: '+218', country: 'LY' },
  { code: '+220', country: 'GM' },
  { code: '+221', country: 'SN' },
  { code: '+254', country: 'KE' },
  { code: '+351', country: 'PT' },
  { code: '+353', country: 'IE' },
  { code: '+358', country: 'FI' },
  { code: '+359', country: 'BG' },
  { code: '+370', country: 'LT' },
  { code: '+371', country: 'LV' },
  { code: '+372', country: 'EE' },
  { code: '+380', country: 'UA' },
  { code: '+420', country: 'CZ' },
  { code: '+421', country: 'SK' },
  { code: '+506', country: 'CR' },
  { code: '+507', country: 'PA' },
  { code: '+593', country: 'EC' },
  { code: '+595', country: 'PY' },
  { code: '+598', country: 'UY' },
  { code: '+852', country: 'HK' },
  { code: '+886', country: 'TW' },
  { code: '+966', country: 'SA' },
  { code: '+971', country: 'AE' },
  { code: '+972', country: 'IL' }
].sort((a, b) => a.country.localeCompare(b.country))

const SettingsPage = () => {
  const { user } = useContext(AuthContext)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fullName, setFullName] = useState('')
  const [phonePrefix, setPhonePrefix] = useState('+34')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [whatsappReminders, setWhatsappReminders] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return
      try {
        const profile = await profilesService.getById(user.id)
        if (profile) {
          setFullName(profile.full_name || '')
          
          let loadedPhone = profile.phone || ''
          let foundPrefix = '+34'
          if (loadedPhone.startsWith('+')) {
            const sortedCodes = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length)
            const match = sortedCodes.find(c => loadedPhone.startsWith(c.code))
            if (match) {
              foundPrefix = match.code
              loadedPhone = loadedPhone.slice(match.code.length).trim()
            }
          }
          setPhonePrefix(foundPrefix)
          setPhoneNumber(loadedPhone)

          const meta = profile.metadata || {}
          setWhatsappReminders(meta.whatsapp_reminders !== false)
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
        phone: `${phonePrefix} ${phoneNumber}`.trim(),
        metadata: {
          whatsapp_reminders: whatsappReminders
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

              <div className="input-wrapper">
                <label className="input-label">Teléfono</label>
                <div className="phone-split-container">
                  <div className="prefix-box">
                    <span className="prefix-value">{phonePrefix}</span>
                    <select 
                      value={phonePrefix}
                      onChange={(e) => setPhonePrefix(e.target.value)}
                      className="prefix-select-overlay"
                      title="Prefijo internacional"
                    >
                      {COUNTRY_CODES.map(c => (
                        <option key={c.country + c.code} value={c.code}>
                          {c.code} {c.country}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="phone-box">
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="input-field"
                      placeholder="600 000 000"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="settings-divider" />

            <div className="settings-notifications">
              <h4>Notificaciones y Recordatorios</h4>
              <p className="settings-notifications-desc">
                Activa o desactiva el envío de recordatorios automáticos
              </p>

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
