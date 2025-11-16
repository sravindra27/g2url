// API configuration
// In development, Vite proxy handles /api requests
// In production, use the full backend URL from environment variable

const getApiUrl = () => {
  // In production, use the VITE_API_URL environment variable
  // In development, use relative path (handled by Vite proxy)
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_URL || 'https://g2url.in'
  }
  // Development: use relative path, Vite proxy will handle it
  return ''
}

export const API_URL = getApiUrl()

