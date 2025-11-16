// API configuration
// External API for URL shortening
const getApiUrl = () => {
  return import.meta.env.VITE_API_URL || 'https://letmehelpyou-api-production.up.railway.app'
}

export const API_URL = getApiUrl()

// Authentication token management
let authToken = null
let tokenExpiry = null

export const getAuthToken = async () => {
  // Check if we have a valid token
  if (authToken && tokenExpiry && Date.now() < tokenExpiry) {
    return authToken
  }

  // Fetch new token
  try {
    const response = await fetch(`${API_URL}/v1/auth/guest-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to get authentication token')
    }

    const data = await response.json()
    authToken = data.access_token
    // Set expiry to 5 minutes before actual expiry (token expires in 1800 seconds = 30 minutes)
    tokenExpiry = Date.now() + (data.expires_in - 300) * 1000

    return authToken
  } catch (error) {
    console.error('Error getting auth token:', error)
    throw error
  }
}

