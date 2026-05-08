import React from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './Analytics.css'

const COLORS = ['#3B82F6', '#8B5CF6'] // Blue and Purple gradient feel

const CreationSourceChart = ({ data }) => {
  return (
    <div className="chart-card-premium">
      <h3 className="chart-title">Origen de Citas</h3>
      <ResponsiveContainer width="100%" height="90%">
        <PieChart>
          <Pie
            data={data}
            innerRadius={70}
            outerRadius={90}
            paddingAngle={8}
            dataKey="value"
            animationDuration={1500}
            animationEasing="ease-out"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(255,255,255,0.5)" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip cursor={{ fill: 'transparent' }} />
          <Legend verticalAlign="bottom" height={36} iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export default CreationSourceChart
