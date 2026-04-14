export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export const validatePhone = (phone) => {
  const re = /^\+?[\d\s-]{8,}$/
  return re.test(phone)
}

export const validateRequired = (value) => {
  return value !== null && value !== undefined && value.trim() !== ''
}
