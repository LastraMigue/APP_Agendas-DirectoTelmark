export const apiResponse = {
  success: (data, message = 'Success') => ({
    success: true,
    message,
    data
  }),
  error: (message = 'Error', errors = []) => ({
    success: false,
    message,
    errors
  })
}
