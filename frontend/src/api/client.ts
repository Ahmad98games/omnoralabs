import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import axiosRetry from 'axios-retry';

const client = axios.create({
  baseURL: '/api',
  timeout: 15000, // Increased to 15s to handle Vercel cold starts/ISR revalidation
  headers: {
    'Content-Type': 'application/json',
    'X-Api-Version': '1'
  }
});

// Configure axial-retry: Hardened reliability layer
axiosRetry(client, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay, // Exponential backoff
  retryCondition: (error) => {
    // Retry on network errors and 5xx server errors
    // Also retry on ECONNABORTED (Timeouts)
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || 
           (error.response ? error.response.status >= 500 : false) ||
           error.code === 'ECONNABORTED';
  },
  onRetry: (retryCount, error) => {
    console.warn(`[Omnora API] Retry attempt #${retryCount} for ${error.config?.url}. Reason: ${error.message}`);
  }
});

// Add a request interceptor for Auth and Multi-Tenant Scoping
client.interceptors.request.use(
  (config) => {
    // 1. Auth Token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 2. Multi-Tenant Gateway Scoping
    const pathname = window.location.pathname;
    const pathParts = pathname.split('/');
    const storeIndex = pathParts.indexOf('store');
    
    if ((window as any).__OMNORA_TENANT_ID__) {
        config.headers['x-tenant-id'] = (window as any).__OMNORA_TENANT_ID__;
    } else if (storeIndex !== -1 && pathParts[storeIndex + 1]) {
        config.headers['x-tenant-id'] = pathParts[storeIndex + 1];
    } else if (pathname.startsWith('/admin') || pathname.startsWith('/god-mode')) {
        delete config.headers['x-tenant-id'];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor for Auth Failures & Global Error Formatting
client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Global Auth Error Handling
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      return Promise.reject(error);
    }

    // Handle errors after retries exhausted (or if retry not applicable)
    if (error.response) {
      const data = error.response.data as { error?: any, message?: any, reason?: string }
      let errorMessage = 'An internal server error occurred';

      if (data) {
        if (typeof data === 'string') errorMessage = data;
        else if (data.message) errorMessage = typeof data.message === 'object' ? JSON.stringify(data.message) : data.message;
        else if (data.error) errorMessage = typeof data.error === 'object' ? JSON.stringify(data.error) : data.error;
        else if (data.reason) errorMessage = data.reason;
      }

      const responseError = new Error(errorMessage) as any;
      responseError.response = error.response;
      responseError.code = `API_${error.response.status}`;
      return Promise.reject(responseError)
    } else if (error.request) {
      const networkError = new Error('Unable to reach the server. Please check your internet connection or try again later.') as any;
      networkError.code = error.code || 'ERR_NETWORK';
      networkError.request = error.request;
      return Promise.reject(networkError)
    } else {
      const setupError = new Error('Failed to make request. Please try again.') as any;
      setupError.code = error.code || 'ERR_SETUP';
      return Promise.reject(setupError)
    }
  }
);

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
  } catch (err) {
    console.error('Telemetry Reporting Failed:', err);
  }
}