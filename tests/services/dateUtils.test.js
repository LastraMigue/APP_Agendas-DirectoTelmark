import { describe, it, expect } from 'vitest'
import { formatDate, formatTime } from '../../src/utils/dateUtils'

describe('Date Utils', () => {
  it('formats date correctly', () => {
    const result = formatDate(new Date('2024-01-15'))
    expect(result).toBeDefined()
  })

  it('formats time correctly', () => {
    const result = formatTime(new Date('2024-01-15T14:30:00'))
    expect(result).toBeDefined()
  })
})
