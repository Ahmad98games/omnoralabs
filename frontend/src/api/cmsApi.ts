import axios from 'axios';

/**
 * 🛰️ Backend Bridge API client for CMS operations
 */
const cmsApi = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Auto-inject Token Authorization
cmsApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token && token !== 'undefined' && token !== 'null') {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));

export default cmsApi;
