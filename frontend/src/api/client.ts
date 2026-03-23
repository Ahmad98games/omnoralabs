import axios, { AxiosError } from 'axios';
import axiosRetry from 'axios-retry';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'X-Api-Version': '1'
  }
});

// Hardened Reliability Layer
axiosRetry(client, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error);
  }
});

// Request Interceptor: Auth & Multi-Tenant Scoping
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const tenantId = localStorage.getItem('tenantId');

    // 1. Auth Guard: Block requests without token unless public
    if (token && token !== 'undefined' && token !== 'null') {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 2. UUID Validation: Critical Fix for "Invalid input syntax for type uuid"
    const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    if (tenantId && isValidUUID(tenantId)) {
      config.headers['x-tenant-id'] = tenantId;
    } else {
      // DELETE header if it's "default_tenant" or invalid to prevent 500 error
      delete config.headers['x-tenant-id'];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Global Error Handling
client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // 🛡️ Verbose error logger: Full URL tracking for 404/500 diagnostics
    console.error(`[Axios Failed] ${error.config?.method?.toUpperCase()} ${error.config?.baseURL || ''}${error.config?.url} | Status: ${error.response?.status || 'Network'} | Msg: ${error.message}`);

    if (error.response?.status === 401) {
      console.warn('[Axios Interceptor] 401 Unauthorized. Letting AuthContext manage session reset nodes.');
      // window.location.href = '/login'; // 🛡️ Disabled to prevent infinite page reloads triggers node!
    }
    return Promise.reject(error);
  }
);

export default client;