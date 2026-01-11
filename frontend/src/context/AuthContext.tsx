import React, { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';
import { isAxiosError } from 'axios';

// Define the User Shape clearly
export interface User {
    id: string;
    email: string;
    name: string;
    role: 'customer' | 'admin';
    photoURL?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    isAuthenticated: boolean;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to set Axios Header dynamically
const setAuthHeader = (token: string | null) => {
    if (token) {
        client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete client.defaults.headers.common['Authorization'];
    }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // 1. INITIAL SESSION CHECK
    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('token');

            if (!token) {
                setLoading(false);
                return;
            }

            // Critical: Sync header before making the request
            setAuthHeader(token);

            try {
                // Add timeout to prevent hanging on mobile
                const { data } = await client.get('/auth/me', { timeout: 3000 });
                if (data.success && data.user) {
                    setUser(data.user);
                } else {
                    throw new Error('Invalid session');
                }
            } catch (error) {
                console.error('Session validation failed:', error);
                // On mobile, if network fails, we might still want to keep the token 
                // but default to 'not verified' state or just log out safety.
                // For admin stability, it is safer to LOGOUT if we can't verify identity.
                handleLogoutCleanup();
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, []);

    // Helper function to clean up local state
    const handleLogoutCleanup = () => {
        localStorage.removeItem('token');
        setAuthHeader(null); // Clear axios header
        setUser(null);
    };

    // 2. LOGIN
    const login = async (email: string, password: string) => {
        try {
            const { data } = await client.post('/auth/login', { email, password });

            if (data.success && data.token) {
                localStorage.setItem('token', data.token);
                setAuthHeader(data.token); // Sync Immediately
                setUser(data.user);
            } else {
                throw new Error(data.message || 'Login failed');
            }
        } catch (error) {
            if (isAxiosError(error)) {
                throw new Error(error.response?.data?.error || 'Server connection failed');
            }
            throw error;
        }
    };

    // 3. REGISTER
    const register = async (name: string, email: string, password: string) => {
        try {
            const { data } = await client.post('/auth/register', { name, email, password });

            if (data.success && data.token) {
                localStorage.setItem('token', data.token);
                setAuthHeader(data.token); // Sync Immediately
                setUser(data.user);
            } else {
                throw new Error(data.message || 'Registration failed');
            }
        } catch (error) {
            if (isAxiosError(error)) {
                throw new Error(error.response?.data?.error || 'Registration failed');
            }
            throw error;
        }
    };

    // 4. LOGOUT
    const logout = async () => {
        try {
            await client.post('/auth/logout');
        } catch (e) {
            // Logout error doesn't matter, we still clear local state
        } finally {
            handleLogoutCleanup();
            // Optional: Hard reload to clear any memory states/caches
            window.location.href = '/login';
        }
    };

    // 5. GOOGLE LOGIN (Stub)
    const loginWithGoogle = async () => {
        throw new Error('Google Login is momentarily unavailable via API. Please use email.');
    };

    // 6. PASSWORD RESET
    const resetPassword = async (email: string) => {
        try {
            await client.post('/auth/forgot-password', { email });
        } catch (error) {
            if (isAxiosError(error)) {
                throw new Error(error.response?.data?.error || 'Failed to send reset email');
            }
            throw error;
        }
    };

    const value = {
        user,
        loading,
        login,
        loginWithGoogle,
        register,
        logout,
        resetPassword,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin'
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};