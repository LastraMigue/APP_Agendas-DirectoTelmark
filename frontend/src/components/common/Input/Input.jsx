import { forwardRef, useId } from 'react'
import './Input.css'

const Input = forwardRef(({ 
  label,
  error,
  type = 'text',
  icon: Icon,
  className = '',
  id,
  ...props 
}, ref) => {
  const generatedId = useId()
  const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-') || generatedId}`

  return (
    <div className={`input-wrapper ${error ? 'input-error' : ''} ${className}`}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
        </label>
      )}
      <div className="input-container">
        {Icon && (
          <span className="input-icon">
            <Icon size={18} />
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={`input-field ${Icon ? 'input-with-icon' : ''}`}
          {...props}
        />
      </div>
      {error && (
        <span className="input-error-message">{error}</span>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input
