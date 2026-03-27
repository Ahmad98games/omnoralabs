import axios, { AxiosError } from 'axios';
import axiosRetry from 'axios-retry';
import { supabase } from '../lib/supabaseClient';

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
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.code === 'ECONNABORTED';
  }
});

// Request Interceptor: Unified Auth & Tenant Scoping
client.interceptors.request.use(
  async (config) => {
    // 🛡️ Imperial Guard: Automatically fetch current Supabase session
    // This ensures we always have the freshest token before the request leaves
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || localStorage.getItem('token');
    const tenantId = localStorage.getItem('tenantId');

    if (token && token !== 'undefined' && token !== 'null') {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 2. UUID Validation
    const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (tenantId && isValidUUID(tenantId)) {
      config.headers['x-tenant-id'] = tenantId;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: 401 Loop Buster
client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    console.error(`[Axios Failed] ${error.config?.method?.toUpperCase()} ${error.config?.url} | Status: ${error.response?.status || 'Network'} | Msg: ${error.message}`);

    if (error.response?.status === 401) {
      console.warn('[Axios Interceptor] 401 Unauthorized. Clearing session and redirecting.');
      
      // Atomic logout to break infinite loops
      await supabase.auth.signOut();
      localStorage.removeItem('token');
      
      if (typeof window !== 'undefined' && 
          window.location.pathname !== '/login' && 
          !window.location.pathname.startsWith('/store')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default client;