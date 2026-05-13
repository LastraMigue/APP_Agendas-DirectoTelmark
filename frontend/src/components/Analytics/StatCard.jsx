import React from 'react'
import './Analytics.css'

const StatCard = ({ title, value, subtitle, icon: Icon }) => (
  <div className="stat-card-premium">
    <div>
      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
      <h3 className="text-3xl font-extrabold text-gray-900 mt-2 tracking-tight">{value}</h3>
      {subtitle && <p className="text-sm text-gray-400 mt-2 font-medium">{subtitle}</p>}
    </div>
    {Icon && (
      <div className="stat-card-icon-wrapper">
        <Icon className="w-8 h-8 text-blue-600" />
      </div>
    )}
  </div>
)

export default StatCard
