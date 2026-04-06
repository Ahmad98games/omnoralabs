import axios, { AxiosError } from 'axios';
import { supabase } from '../lib/supabaseClient';

let alreadyRedirecting = false;

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000, // Slightly more lenient for cold starts
  headers: { 'Content-Type': 'application/json' }
});

client.interceptors.request.use(async (config) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch (err) {
    console.error('[Omnora API] Token Sync Failed:', err);
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const isAuthRoute = error.config?.url?.includes('/auth') || error.config?.url?.includes('/login');

    if (error.response?.status === 401 && !alreadyRedirecting && !isAuthRoute) {
      alreadyRedirecting = true;
      console.warn('[Omnora API] 401 Detected. Forcing Kernel Recovery.');
      
      await supabase.auth.signOut();
      
      Object.keys(localStorage)
          .filter(k => k.startsWith('omnora-'))
          .forEach(k => localStorage.removeItem(k));
      
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default client;