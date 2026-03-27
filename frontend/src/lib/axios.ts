import axios from 'axios';
import { supabase } from './supabaseClient';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
});

// 🛡️ Request Interceptor: Automatic Session Fetching & Token Injection
api.interceptors.request.use(async (config) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch (err) {
    console.warn('[Axios Request Interceptor] Session fetch failed:', err);
  }
  return config;
}, (error) => Promise.reject(error));

// 🛡️ Response Interceptor: 401 Loop Buster
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.warn('[Axios Interceptor] 401 Unauthorized detected. Triggering session reset.');
      
      // Clear session to prevent infinite loading state
      await supabase.auth.signOut();
      
      // Only redirect if not already on the login/landing page
      if (typeof window !== 'undefined' && 
          window.location.pathname !== '/login' && 
          window.location.pathname !== '/') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
