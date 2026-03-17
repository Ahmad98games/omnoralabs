import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import client from '../api/client';
import axios, { isAxiosError } from 'axios';

// Define the User Shape clearly
export interface User {
    id: string;
    email: string;
    name: string;
    role: 'customer' | 'seller' | 'admin' | 'super-admin';
    plan?: 'free' | 'pro';
    photoURL?: string;
    brandProfile?: {
        companyName: string;
        logoURL: string;
        businessBio: string;
    };
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isInitialized: boolean;
    login: (email: string, password: string) => Promise<User>;
    loginWithGoogle: () => Promise<void>;
    register: (name: string, email: string, password: string, role?: string) => Promise<User>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isSeller: boolean;
    isSuperAdmin: boolean;
    isAuthModalOpen: boolean;
    authModalMode: 'login' | 'signup';
    setAuthModalOpen: (open: boolean, mode?: 'login' | 'signup') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to set Axios Header dynamically
const setAuthHeader = (token: string | null) => {
    if (token) {
        client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete client.defaults.headers.common['Authorization'];
        delete axios.defaults.headers.common['Authorization'];
    }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

    const setAuthModalOpen = (open: boolean, mode: 'login' | 'signup' = 'login') => {
        setAuthModalMode(mode);
        setIsAuthModalOpen(open);
    };

    const [authError, setAuthError] = useState(false);

    // Helper function to clean up local state
    const handleLogoutCleanup = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        setAuthHeader(null); // Clear axios header
        setUser(null);
    };

    // 1. INITIAL SESSION CHECK
    const initAuth = useCallback(async () => {
        setAuthError(false);
        setLoading(true);
        const token = localStorage.getItem('token');

        if (!token) {
            setLoading(false);
            setIsInitialized(true);
            return;
        }

        // Global Headers set IMMEDIATELY before fetch
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        client.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        try {
            // Add timeout to prevent hanging on mobile
            const { data } = await client.get('/auth/me', { timeout: 3000 });
            if (data.success && data.user) {
                setUser(data.user);
            } else {
                throw new Error('Invalid session');
            }
            setLoading(false);
            setIsInitialized(true);
        } catch (error) {
            console.error('Session validation failed:', error);
            setAuthError(true);
            handleLogoutCleanup();
            setLoading(false);
            setIsInitialized(true);
        }
    }, []);

    useEffect(() => {
        initAuth();
    }, [initAuth]);

    // 2. LOGIN
    const login = async (email: string, password: string) => {
        try {
            const { data } = await client.post('/auth/login', { email, password });

            if (data.success && data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('role', data.user?.role || 'customer');
                setAuthHeader(data.token); // Sync Immediately
                setUser(data.user);
                return data.user;
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
    const register = async (name: string, email: string, password: string, role: string = 'customer') => {
        try {
            const { data } = await client.post('/auth/register', { name, email, password, role });

            if (data.success && data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('role', data.user?.role || 'customer');
                setAuthHeader(data.token); // Sync Immediately
                setUser(data.user);
                return data.user;
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
            // PLG Update: Redirect to the public product tour instead of /login
            window.location.href = '/';
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
        isInitialized,
        login,
        loginWithGoogle,
        register,
        logout,
        resetPassword,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin' || user?.role === 'super-admin',
        isSeller: user?.role === 'seller',
        isSuperAdmin: user?.role === 'super-admin',
        isAuthModalOpen,
        authModalMode,
        setAuthModalOpen
    };

    if (!isInitialized) {
        return (
            <AuthContext.Provider value={value}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#050505' }}>
                    <div className="champagne-spinner" style={{ width: '40px', height: '40px', border: '3px solid rgba(241,213,146,0.1)', borderTop: '3px solid #F1D592', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                </div>
            </AuthContext.Provider>
        );
    }

    if (!user && authError && window.location.pathname !== '/login') {
        return (
            <AuthContext.Provider value={value}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#050505', flexDirection: 'column' }}>
                    <div style={{ fontSize: '48px', color: '#F1D592', fontFamily: 'serif', marginBottom: '20px' }}>O</div>
                    <h2 style={{ color: '#fff', fontSize: '16px', letterSpacing: '0.05em', marginBottom: '30px', fontWeight: 'normal' }}>Sovereign Intercept: Connection Fragmented</h2>
                    <button onClick={() => window.location.href = '/login'} style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #F1D592 0%, #D4AF37 100%)', color: '#050505', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.1em', cursor: 'pointer', textTransform: 'uppercase', transition: 'transform 0.2s', boxShadow: '0 4px 15px rgba(241,213,146,0.2)' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                        Re-establish Connection
                    </button>
                </div>
            </AuthContext.Provider>
        );
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};