import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { CinematicLoader } from '../components/ui/CinematicLoader';

export interface CustomerProfile {
    id: string;
    email: string;
    full_name: string;
    avatar_url?: string;
    role: 'customer';
    created_at: string;
}

export interface MerchantProfile {
    id: string;
    email: string;
    store_name: string;
    theme_settings?: any;
    role: 'seller' | 'admin' | 'super-admin';
    created_at: string;
}

interface AuthContextValue {
    user: any | null;
    profile: MerchantProfile | CustomerProfile | null;
    isInitializing: boolean;
    loading: boolean;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isSeller: boolean;
    isCustomer: boolean;
    login: (email, password) => Promise<any>;
    register: (name, email, password, role, storeName?: string) => Promise<any>;
    loginWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    updateProfile: (data: Partial<MerchantProfile>) => Promise<void>;
    resetAuth: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<any | null>(null);
    const [profile, setProfile] = useState<MerchantProfile | CustomerProfile | null>(null);
    const [isInitializing, setIsInitializing] = useState(true);

    const resetAuth = useCallback(async () => {
        await supabase.auth.signOut();
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('omnora-')) localStorage.removeItem(key);
        });
        window.location.href = '/login';
    }, []);

    const ensureProfile = useCallback(async (sbUser: any, name?: string, role: any = null, storeName?: string) => {
        try {
            // 🛡️ RECOVERY: Read role from localStorage if it was saved during Login.tsx handleGoogleSignIn
            const savedRole = localStorage.getItem('omnora_selected_role');
            const targetRole = role || sbUser.user_metadata?.role || savedRole || 'customer';
            
            console.log(`[AuthShield] Syncing ID: ${sbUser.id} as ${targetRole}`);

            // 1. Try fetching from Merchants first if seller
            if (targetRole === 'seller' || targetRole === 'admin' || targetRole === 'super-admin') {
                const { data: merchant } = await supabase.from('merchants').select('*').eq('id', sbUser.id).single();
                if (merchant) {
                    setProfile(merchant as any);
                    return merchant;
                }
            } else {
                // 2. Try fetching from Customers
                const { data: customer } = await supabase.from('customers').select('*').eq('id', sbUser.id).single();
                if (customer) {
                    setProfile({ ...customer, role: 'customer' } as any);
                    return customer;
                }
            }

            // 3. If not found in primary table, check the OTHER table just in case (Account Crossover Protection)
            const { data: altMerchant } = await supabase.from('merchants').select('*').eq('id', sbUser.id).single();
            if (altMerchant) { setProfile(altMerchant as any); return altMerchant; }
            
            const { data: altCustomer } = await supabase.from('customers').select('*').eq('id', sbUser.id).single();
            if (altCustomer) { setProfile({ ...altCustomer, role: 'customer' } as any); return altCustomer; }

            // 4. Initialization Phase (Record creation)
            if (targetRole === 'seller') {
                const finalStoreName = storeName || sbUser.user_metadata?.store_name || `${sbUser.email?.split('@')[0]}'s Store`;
                const { data: newMerchant, error } = await supabase.from('merchants').insert({
                    id: sbUser.id,
                    email: sbUser.email,
                    store_name: finalStoreName,
                    role: 'seller',
                }).select().single();
                if (error) throw error;
                setProfile(newMerchant as any);
                return newMerchant;
            } else {
                const { data: newCustomer, error } = await supabase.from('customers').insert({
                    id: sbUser.id,
                    email: sbUser.email,
                    full_name: name || sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0],
                }).select().single();
                if (error) throw error;
                const fullCustomer = { ...newCustomer, role: 'customer' };
                setProfile(fullCustomer as any);
                return fullCustomer;
            }
        } catch (err) {
            console.error('[Auth Shield] Profile Convergence Failed:', err);
            return null;
        }
    }, []);

    const verify = useCallback(async () => {
        try {
            const { data: { user: sbUser }, error } = await supabase.auth.getUser();
            if (error || !sbUser) {
                setUser(null);
                setProfile(null);
            } else {
                setUser(sbUser);
                await ensureProfile(sbUser);
            }
        } finally {
            setIsInitializing(false);
        }
    }, [ensureProfile]);

    useEffect(() => {
        verify();
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                setUser(session.user);
                await ensureProfile(session.user);
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setProfile(null);
            }
        });
        return () => subscription.unsubscribe();
    }, [verify, ensureProfile]);

    const login = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) {
            setUser(data.user);
            const prof = await ensureProfile(data.user);
            return { ...data.user, ...prof };
        }
        return data.user;
    };

    const register = async (name, email, password, role = 'customer', storeName) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { 
                data: { 
                    full_name: name,
                    store_name: storeName || (role === 'seller' ? `${name}'s Store` : null),
                    role: role 
                } 
            }
        });
        if (error) throw error;
        if (data.user) {
            setUser(data.user);
            const prof = await ensureProfile(data.user, name, role, storeName);
            return { ...data.user, ...prof };
        }
        return data.user;
    };

    const loginWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`
            }
        });
        if (error) throw error;
    };

    const resetPassword = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    const updateProfile = async (data: Partial<MerchantProfile>) => {
        if (!user) return;
        const { error } = await supabase
            .from('merchants')
            .update(data)
            .eq('id', user.id);
        if (error) throw error;
        setProfile(prev => prev ? { ...prev, ...data } : null);
    };

    if (isInitializing) return <CinematicLoader />;

    return (
        <AuthContext.Provider value={{ 
            user, profile, isInitializing, 
            loading: isInitializing,
            isAuthenticated: !!user,
            isAdmin: profile?.role === 'admin' || profile?.role === 'super-admin',
            isSeller: profile?.role === 'seller',
            isCustomer: !profile || profile?.role === 'customer',
            login, register, loginWithGoogle, signOut, resetPassword, updateProfile, resetAuth 
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};