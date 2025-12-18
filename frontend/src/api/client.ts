import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

// Retry configuration - Optimized for instant fallback when backend unavailable
const MAX_RETRIES = 0  // No retries for instant fallback to local data
const RETRY_DELAY = 300  // Not used when MAX_RETRIES = 0

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 500,  // 500ms for instant failure detection
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add retry count to request config
declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    _retryCount?: number
  }
}

// Add a request interceptor
client.interceptors.request.use(
  (config) => {
    // Note: Firebase authentication is handled client-side only
    // Backend routes that require auth should be updated to use Firebase Admin SDK
    // For now, most routes (products, orders, contact) work without authentication
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add a response interceptor with retry logic
client.interceptors.response.use(
  (response) => {
    // Check if response is HTML (incorrectly returned for API requests)
    const contentType = response.headers['content-type']
    if (contentType && contentType.includes('text/html')) {
      return Promise.reject(new Error('Received HTML instead of JSON'))
    }
    return response
  },
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig

    // Initialize retry count
    if (!config._retryCount) {
      config._retryCount = 0
    }

    // Check if we should retry
    const shouldRetry = (
      config._retryCount < MAX_RETRIES &&
      (
        // Retry on network errors (backend not ready)
        error.code === 'ECONNREFUSED' ||
        error.code === 'ERR_NETWORK' ||
        !error.response ||
        // Retry on 5xx server errors
        (error.response && error.response.status >= 500)
      )
    )

    if (shouldRetry && config) {
      config._retryCount++

      // Exponential backoff: wait longer for each retry
      const delay = RETRY_DELAY * Math.pow(2, config._retryCount - 1)

      console.log(`Retrying request (attempt ${config._retryCount}/${MAX_RETRIES}) after ${delay}ms...`)

      await new Promise(resolve => setTimeout(resolve, delay))

      return client(config)
    }

    // Handle errors after retries exhausted
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      if (error.response.status === 500) {
        return Promise.reject(new Error('An internal server error occurred. Please try again later.'))
      }
      // Return the error message from the server if available
      const data = error.response.data as { error?: string }
      const errorMessage = data?.error || 'An unexpected error occurred'
      return Promise.reject(new Error(errorMessage))
    } else if (error.request) {
      // The request was made but no response was received
      return Promise.reject(new Error('Cannot connect to server. Please make sure the backend is running.'))
    } else {
      // Something happened in setting up the request
      return Promise.reject(new Error('Failed to make request. Please try again.'))
    }
  }
)

export default client

export async function trackEvent(event: {
  type: string
  path?: string
  sessionId?: string
  userId?: string
  referrer?: string
  userAgent?: string
  screen?: { width: number; height: number }
  payload?: any
}) {
  try {
    await client.post('/track', event)
  } catch { }
}