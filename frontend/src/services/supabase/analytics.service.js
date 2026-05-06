import { supabase } from './client'
import { format, parseISO } from 'date-fns'

export const analyticsService = {
  async getMetrics(startDate, endDate) {
    let query = supabase.from('appointments').select('*')
    
    if (startDate) query = query.gte('fecha', startDate.toISOString())
    if (endDate) query = query.lte('fecha', endDate.toISOString())

    const { data: citas, error } = await query

    if (error) {
      console.error('Error fetching citas para analytics:', error)
      return this.getEmptyData()
    }

    return this.processData(citas)
  },

  getEmptyData() {
    return {
      kpis: {
        totalCitas: 0,
        conversionRate: '0.0',
        cancellationRate: '0.0',
        reminderEffectiveness: '0.0'
      },
      dailyActivity: [],
      creationSource: [],
      conversionData: []
    }
  },

  processData(citas) {
    if (!citas || citas.length === 0) {
      return this.getEmptyData()
    }

    const totalCitas = citas.length
    const confirmadas = citas.filter(c => c.estado === 'confirmada').length
    const canceladas = citas.filter(c => c.estado === 'cancelada').length
    const completadas = citas.filter(c => c.estado === 'completada').length

    // 1. Actividad diaria
    const dailyActivityMap = citas.reduce((acc, cita) => {
      // Intentamos usar "fecha" y fallback a "date" o "start_time" dependiendo de la tabla
      const dateString = cita.fecha || cita.date || cita.start_time || new Date().toISOString()
      const day = format(parseISO(dateString), 'MMM dd')
      acc[day] = (acc[day] || 0) + 1
      return acc
    }, {})

    const dailyActivity = Object.keys(dailyActivityMap).map(date => ({
      date,
      citas: dailyActivityMap[date]
    }))

    // 2. Tasa de conversión
    const conversionRate = totalCitas > 0 ? (confirmadas / totalCitas) * 100 : 0
    const cancellationRate = totalCitas > 0 ? (canceladas / totalCitas) * 100 : 0

    // 3. Citas por agente vs cliente
    const creadasPorAgente = citas.filter(c => c.creada_por === 'agente').length
    const creadasPorCliente = citas.filter(c => c.creada_por === 'cliente').length

    // 4. Efectividad de recordatorios
    const conRecordatorio = citas.filter(c => c.recordatorio_enviado === true)
    const totalConRecordatorio = conRecordatorio.length
    const completadasConRecordatorio = conRecordatorio.filter(c => c.estado === 'completada').length
    const reminderEffectiveness = totalConRecordatorio > 0 
      ? (completadasConRecordatorio / totalConRecordatorio) * 100 
      : 0

    return {
      kpis: {
        totalCitas,
        conversionRate: conversionRate.toFixed(1),
        cancellationRate: cancellationRate.toFixed(1),
        reminderEffectiveness: reminderEffectiveness.toFixed(1)
      },
      dailyActivity,
      creationSource: [
        { name: 'Agentes', value: creadasPorAgente },
        { name: 'Clientes', value: creadasPorCliente }
      ],
      conversionData: [
        { name: 'Confirmadas', value: confirmadas },
        { name: 'Canceladas', value: canceladas },
        { name: 'Completadas', value: completadas },
        { name: 'Pendientes', value: totalCitas - (confirmadas + canceladas + completadas) }
      ]
    }
  }
}
