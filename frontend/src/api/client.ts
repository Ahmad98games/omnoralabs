import axios, { AxiosError } from 'axios';
import { supabase } from '../lib/supabaseClient';

// --- Already Redirecting Flag ---
let alreadyRedirecting = false;

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request Interceptor: Unified Auth
client.interceptors.request.use(
  async (config) => {
    try {
      // 🛡️ LAW 2: Verifying session for every request ensures fresh tokens
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
    } catch (err) {
      console.error('[Axios Request Interceptor] Session Sync Failed:', err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 🛡️ LAW 2: THE SHIELD — 401 Loop Buster
client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // OSTT FIX: Skip 401 interceptor on login/register endpoints to prevent premature logouts
    const isAuthRoute = error.config?.url?.includes('/auth') || error.config?.url?.includes('/login');

    if (error.response?.status === 401 && !alreadyRedirecting && !isAuthRoute) {
      alreadyRedirecting = true;
      
      console.warn('[Axios Interceptor] 401 Unauthorized. Law 2 Loop Buster engaged.');
      
      // Atomic logout
      await supabase.auth.signOut();
      
      // Scoped localStorage cleanup
      Object.keys(localStorage)
          .filter(k => k.startsWith('omnora-'))
          .forEach(k => localStorage.removeItem(k));
      
      // Redirect to login
      if (typeof window !== 'undefined') {
          window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default client;