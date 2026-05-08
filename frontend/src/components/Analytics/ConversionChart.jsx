import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import './Analytics.css'

const COLORS = {
  'Confirmadas': '#10B981', // Emerald
  'Canceladas': '#EF4444',  // Red
  'Completadas': '#3B82F6', // Blue
  'Pendientes': '#F59E0B'   // Amber
}

const ConversionChart = ({ data }) => {
  return (
    <div className="chart-card-premium">
      <h3 className="chart-title">Estado de Citas (Conversión)</h3>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
          <XAxis type="number" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis dataKey="name" type="category" stroke="#475569" fontSize={12} axisLine={false} tickLine={false} dx={-10} />
          <Tooltip cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }} />
          <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={32} animationDuration={1500} animationEasing="ease-out">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#3B82F6'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default ConversionChart
