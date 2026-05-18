import { useRef, useEffect } from 'react'
import './OTPInput.css'

const OTPInput = ({ length = 8, value, onChange, error }) => {
  const inputs = useRef([])

  const processInput = (e, index) => {
    const val = e.target.value
    if (isNaN(val)) return

    const newValue = value.split('')
    newValue[index] = val.slice(-1)
    onChange(newValue.join(''))

    if (val && index < length - 1) {
      inputs.current[index + 1].focus()
    }
  }

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputs.current[index - 1].focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const data = e.clipboardData.getData('text').slice(0, length)
    if (!/^\d+$/.test(data)) return
    onChange(data)
    
    // Focus the last input or the next empty one
    const focusIndex = Math.min(data.length, length - 1)
    inputs.current[focusIndex].focus()
  }

  return (
    <div className={`otp-wrapper ${error ? 'otp-error' : ''}`}>
      <div className="otp-container">
        {Array.from({ length }).map((_, index) => (
          <input
            key={index}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value[index] || ''}
            onChange={(e) => processInput(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onPaste={handlePaste}
            ref={(el) => (inputs.current[index] = el)}
            className="otp-input"
          />
        ))}
      </div>
      {error && <span className="otp-error-message">{error}</span>}
    </div>
  )
}

export default OTPInput
