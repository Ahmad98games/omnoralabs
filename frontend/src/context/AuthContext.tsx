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
    full_name?: string; // 🛡️ Added for Google metadata compatibility
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
    const initAuth = useCallback(async (forceSync = false) => {
        setAuthError(false);
        setLoading(true);
        const token = localStorage.getItem('token');
        const currentPath = window.location.pathname;

        // 🛡️ Imperial Guard: Never trigger a reload-loop if already at Login/Register
        const isAuthPath = currentPath === '/login' || currentPath === '/register' || currentPath === '/auth/callback';

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
            const { data } = await client.get('/auth/me', { 
                timeout: 10000,
                'axios-retry': { retries: 2 } 
            });

            if (data.success && data.user) {
                setUser(data.user);
                setStatus('authenticated');
                await loadProfile(data.user.id);
            } else if (!isAuthPath && !currentPath.startsWith('/store')) {
                setStatus('unauthenticated');
                window.location.href = '/login';
            }
        } catch (error: any) {
            console.warn('Session re-hydration failure:', error);
            
            // 🛡️ Post-Google Sync: If user is logged into Supabase but missing in DB, try auto-sync
            const { data: { user: sbUser } } = await supabase.auth.getUser();
            if (sbUser && forceSync) {
                await syncGoogleProfile(sbUser);
                // retry once after sync
                return initAuth(false);
            }

            setStatus('unauthenticated');
            if (!isAuthPath && !currentPath.startsWith('/store')) {
                window.location.href = '/login';
            }
        } finally {
            setLoading(false);
            setIsInitialized(true);
        }
    }, [loadProfile]);

    const syncGoogleProfile = async (supabaseUser: any) => {
        const role = localStorage.getItem('omnora_selected_role') || 'customer';
        console.log(`[Google Sync] Synchronizing for role: ${role}`, supabaseUser.id);
        
        try {
            // 🛡️ 1. Update Supabase User Metadata for role persistence
            // This is critical for backends that read role from Supabase metadata
            await supabase.auth.updateUser({
                data: { role: role }
            });

            // 🛡️ 2. Atomic Sync: Ensure backend profile for Google users
            if (role === 'seller' || role === 'admin') {
                const { error: profileError } = await supabase
                    .from('merchants')
                    .upsert({
                        id: supabaseUser.id,
                        display_name: supabaseUser.user_metadata?.full_name || supabaseUser.email,
                        email: supabaseUser.email,
                        store_name: `${supabaseUser.user_metadata?.full_name || 'My'}'s Store`,
                        created_at: new Date().toISOString(),
                    }, { onConflict: 'id' });
                
                if (profileError) console.error('[Google Profile Sync Fail]', profileError);
            }
            
            // Note: role is still in localStorage so we can use it for final redirect
        } catch (e) {
            console.error('[Google Sync Error]', e);
        }
    };

    useEffect(() => {
        let isMounted = true;

        const syncSession = async () => {
            try {
                // 🛡️ Guard against hanging locks (GoTrue) in tabs
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Supabase session fetch timed out')), 5000)
                );

                const { data } = await Promise.race([
                    supabase.auth.getSession(),
                    timeoutPromise
                ]) as any;

                const session = data?.session;
                
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
                
                if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                    // 🛡️ 1. Extract Role BEFORE sync (Google specific)
                    const { data: { user: sbUser } } = await supabase.auth.getUser();
                    
                    // 🛡️ 2. Load basic Supabase profile
                    await loadProfile(session.user.id);
                    
                    // 🛡️ 3. Sync role and backend state
                    await initAuth(true);
                    
                    // 🛡️ 4. Final Path Resolution for Callback
                    if (window.location.pathname === '/auth/callback') {
                        // Priority: 1. Supabase Meta 2. LocalStorage 3. Default
                        const metaRole = sbUser?.user_metadata?.role;
                        const savedRole = metaRole || localStorage.getItem('omnora_selected_role') || 'customer';
                        
                        const target = (savedRole === 'seller' || savedRole === 'admin') 
                            ? '/seller/dashboard?tab=builder' 
                            : '/profile';
                            
                        console.log(`[Google Auth Callback] Resolved Role: ${savedRole} -> Target: ${target}`);
                        localStorage.removeItem('omnora_selected_role');
                        window.location.href = target;
                    }
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

    // 5. GOOGLE LOGIN (Supabase OAuth)
    const loginWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            }
        });
        if (error) throw new Error(error.message);
        // After redirect, Supabase sets the session automatically.
        // The onAuthStateChange listener will pick it up.
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