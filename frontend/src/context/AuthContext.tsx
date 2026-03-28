import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { CinematicLoader } from '../components/ui/CinematicLoader';

export interface MerchantProfile {
    id: string;
    email: string;
    store_name: string;
    theme_settings?: any;
    role: 'customer' | 'seller' | 'admin' | 'super-admin';
    created_at: string;
}

interface AuthContextValue {
    user: any | null;
    profile: MerchantProfile | null;
    isInitializing: boolean;
    loading: boolean;
    isAuthenticated: boolean;
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
    const [profile, setProfile] = useState<MerchantProfile | null>(null);
    const [isInitializing, setIsInitializing] = useState(true);

    const resetAuth = useCallback(async () => {
        await supabase.auth.signOut();
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('omnora-')) localStorage.removeItem(key);
        });
        window.location.href = '/login';
    }, []);

    const ensureMerchantProfile = useCallback(async (sbUser: any, name?: string, role: any = 'customer', storeName?: string) => {
        try {
            const { data: existing, error: fetchError } = await supabase
                .from('merchants')
                .select('*')
                .eq('id', sbUser.id)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

            if (!existing) {
                // 🛡️ RECOVERY: Read role from localStorage if it was saved during Login.tsx handleGoogleSignIn
                const savedRole = localStorage.getItem('omnora_selected_role');
                const finalRole = role || sbUser.user_metadata?.role || savedRole || 'customer';
                const finalStoreName = storeName || sbUser.user_metadata?.store_name || (finalRole === 'seller' ? `${sbUser.email?.split('@')[0]}'s Store` : 'My Store');

                const { data: newProfile, error: insertError } = await supabase
                    .from('merchants')
                    .insert({
                        id: sbUser.id,
                        email: sbUser.email,
                        store_name: finalStoreName,
                        role: finalRole as any,
                        created_at: new Date().toISOString(),
                    })
                    .select()
                    .single();

                if (insertError) throw insertError;
                setProfile(newProfile as any);
                return newProfile;
            } else {
                setProfile(existing as any);
                return existing;
            }
        } catch (err) {
            console.error('[Auth Shield] Profile Sync Failed:', err);
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
                await ensureMerchantProfile(sbUser);
            }
        } finally {
            setIsInitializing(false);
        }
    }, [ensureMerchantProfile]);

    useEffect(() => {
        verify();
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                setUser(session.user);
                await ensureMerchantProfile(session.user);
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setProfile(null);
            }
        });
        return () => subscription.unsubscribe();
    }, [verify, ensureMerchantProfile]);

    const login = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) {
            setUser(data.user);
            const prof = await ensureMerchantProfile(data.user);
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
            const prof = await ensureMerchantProfile(data.user, name, role, storeName);
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