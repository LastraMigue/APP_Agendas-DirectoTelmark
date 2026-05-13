import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import './Analytics.css'

const DailyActivityChart = ({ data }) => {
  return (
    <div className="chart-card-premium">
      <h3 className="chart-title">Actividad Diaria</h3>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCitas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis dataKey="date" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} dy={10} />
          <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
          <Tooltip cursor={{ stroke: '#CBD5E1', strokeWidth: 1, strokeDasharray: '4 4' }} />
          <Line
            type="monotone"
            dataKey="citas"
            stroke="#3B82F6"
            strokeWidth={4}
            dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#3B82F6' }}
            activeDot={{ r: 8, strokeWidth: 0, fill: '#3B82F6' }}
            animationDuration={1500}
            animationEasing="ease-in-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default DailyActivityChart
