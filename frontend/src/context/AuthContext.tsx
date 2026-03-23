import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import client from '../api/client';
import axios, { isAxiosError } from 'axios';
import { supabase } from '../lib/supabaseClient';
import { CinematicLoader } from '../components/ui/CinematicLoader';

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
    profile: any | null;
    status: 'initializing' | 'authenticated' | 'unauthenticated';
    loading: boolean;
    isInitialized: boolean;
    login: (email: string, password: string) => Promise<User>;
    loginWithGoogle: () => Promise<void>;
    register: (name: string, email: string, password: string, role?: string, storeName?: string) => Promise<User>;
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
    const [profile, setProfile] = useState<any>(null);
    const [status, setStatus] = useState<'initializing' | 'authenticated' | 'unauthenticated'>('initializing');
    const [loading, setLoading] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

    const setAuthModalOpen = (open: boolean, mode: 'login' | 'signup' = 'login') => {
        setAuthModalMode(mode);
        setIsAuthModalOpen(open);
    };

    const [authError, setAuthError] = useState(false);
    
    const loadProfile = useCallback(async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('merchants')
                .select('*')
                .eq('id', userId)
                .single();
            if (data) {
                setProfile(data);
            }
        } catch (err) {
            console.warn('[loadProfile Fail]', err);
        }
    }, []);

    // Helper function to clean up local state
    const handleLogoutCleanup = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        setAuthHeader(null); // Clear axios header
        setUser(null);
        setProfile(null);
    };

    // 1. INITIAL SESSION CHECK
    const initAuth = useCallback(async () => {
        setAuthError(false);
        setLoading(true);
        const token = localStorage.getItem('token');

        if (!token || token === 'null' || token === 'undefined') {
            setLoading(false);
            setIsInitialized(true);
            setStatus('unauthenticated');
            return;
        }

        // Global Headers set IMMEDIATELY before fetch
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        client.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        try {
            // Add timeout to prevent hanging
            const { data } = await client.get('/auth/me', { timeout: 3000 });
            if (data.success && data.user) {
                setUser(data.user);
                setStatus('authenticated');
                // Load profile from Supabase concurrently
                loadProfile(data.user.id);
            } else {
                setStatus('unauthenticated');
                if (window.location.pathname !== '/login' && !window.location.pathname.startsWith('/store')) {
                    window.location.href = '/login';
                }
            }
            setLoading(false);
            setIsInitialized(true);
        } catch (error) {
            console.warn('Session re-hydration failure:', error);
            setStatus('unauthenticated');
            setLoading(false);
            setIsInitialized(true);
            if (window.location.pathname !== '/login' && !window.location.pathname.startsWith('/store')) {
                window.location.href = '/login';
            }
        }
    }, []);

    useEffect(() => {
        let isMounted = true;

        const syncSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (isMounted && session?.access_token) {
                    localStorage.setItem('token', session.access_token);
                    setAuthHeader(session.access_token);
                }
            } catch (err) {
                console.warn('[Supabase Sync Auth Failure]', err);
            } finally {
                if (isMounted) {
                    // 🛡️ Trigger initAuth exactly after session is hydrated!
                    initAuth();
                }
            }
        };

        syncSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.access_token) {
                localStorage.setItem('token', session.access_token);
                setAuthHeader(session.access_token);
                
                if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
                    await loadProfile(session.user.id);
                }
            } else if (event === 'SIGNED_OUT') {
                handleLogoutCleanup();
            }
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
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
                
                // Load full details concurrently after login
                if (data.user?.id) {
                    loadProfile(data.user.id);
                }
                
                return data.user;
            } else {
                throw new Error(data.message || 'Login failed');
            }
        } catch (error: any) {
            if (isAxiosError(error)) {
                const errorData = error.response?.data;
                const errorMsg = errorData?.error || errorData?.message || 'Server connection failed';
                
                throw new Error(typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg);
            }
            throw error;
        }
    };

    // 3. REGISTER
    const register = async (name: string, email: string, password: string, role: string = 'customer', storeName?: string) => {
        try {
            // 1. Sign up on Supabase directly to save metadata atomics
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name: name,
                        display_name: name,
                        role: role,
                        store_name: storeName || `${name}'s Store`,
                    }
                }
            });

            if (authError) throw authError;

            if (authData.user) {
                // 2. Write to merchants table for Sellers
                if (role === 'seller' || role === 'admin') {
                    const { error: profileError } = await supabase
                        .from('merchants')
                        .upsert({
                            id: authData.user.id,
                            store_name: storeName || `${name}'s Store`,
                            display_name: name,
                            email: email,
                            created_at: new Date().toISOString(),
                        });
                    
                    if (profileError) console.error('[Profile Insert Fail]', profileError);
                }

                // 3. Sync State
                await loadProfile(authData.user.id);
                setUser({
                    id: authData.user.id,
                    email: authData.user.email!,
                    name: name,
                    role: role as any
                });
                setStatus('authenticated');
                return { id: authData.user.id, email: authData.user.email!, name, role } as any;
            } else {
                throw new Error('Verification required or signup incomplete');
            }

        } catch (error: any) {
            if (isAxiosError(error)) {
                const errorData = error.response?.data;
                const errorMsg = errorData?.error || errorData?.message || 'Registration failed';
                throw new Error(typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg);
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
        } catch (error: any) {
            if (isAxiosError(error)) {
                const errorData = error.response?.data;
                const errorMsg = errorData?.error || errorData?.message || 'Failed to send reset email';
                
                throw new Error(typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg);
            }
            throw error;
        }
    };

    const value = {
        user,
        profile,
        status,
        loading,
        isInitialized,
        login,
        loginWithGoogle,
        register,
        logout,
        resetPassword,
        loadProfile,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin' || user?.role === 'super-admin',
        isSeller: user?.role === 'seller',
        isSuperAdmin: user?.role === 'super-admin',
        isAuthModalOpen,
        authModalMode,
        setAuthModalOpen
    };

    if (loading || !isInitialized) {
        return <CinematicLoader />;
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