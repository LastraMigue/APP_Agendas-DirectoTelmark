import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import './Analytics.css'

const ClientDistributionChart = ({ data }) => {
  return (
    <div className="chart-card-premium">
      <h3 className="chart-title">Clientes más Frecuentes</h3>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
          <XAxis type="number" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis 
            dataKey="name" 
            type="category" 
            stroke="#475569" 
            fontSize={11} 
            axisLine={false} 
            tickLine={false} 
            dx={-5} 
            width={90}
          />
          <Tooltip cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }} />
          <Bar 
            dataKey="value" 
            fill="var(--primary)" 
            radius={[0, 8, 8, 0]} 
            barSize={18} 
            animationDuration={1500} 
            animationEasing="ease-out" 
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default ClientDistributionChart
