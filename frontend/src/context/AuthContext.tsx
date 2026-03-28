import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import client from '../api/client';
import { CinematicLoader } from '../components/ui/CinematicLoader';

export interface MerchantProfile {
    id: string;
    email: string;
    store_name: string;
    theme_settings?: any;
    created_at: string;
}

interface AuthContextValue {
    user: any | null;
    profile: MerchantProfile | null;
    isInitializing: boolean;
    isAuthenticated: boolean;
    signIn: (email, password) => Promise<void>;
    signUp: (email, password, storeName) => Promise<void>;
    signOut: () => Promise<void>;
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
        // Remove all localStorage keys starting with 'omnora-'
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('omnora-')) localStorage.removeItem(key);
        });
        // Clear Supabase auth cookies implicitly via signOut(), but we can do a hard reset
        window.location.href = '/login';
    }, []);

    const ensureMerchantProfile = useCallback(async (sbUser: any) => {
        try {
            const { data: existing, error: fetchError } = await supabase
                .from('merchants')
                .select('*')
                .eq('id', sbUser.id)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

            if (!existing) {
                const storeName = sbUser.user_metadata?.store_name 
                    || sbUser.email?.split('@')[0] 
                    || 'My Store';

                const { data: newProfile, error: insertError } = await supabase
                    .from('merchants')
                    .insert({
                        id: sbUser.id,
                        email: sbUser.email,
                        store_name: storeName,
                        created_at: new Date().toISOString(),
                    })
                    .select()
                    .single();

                if (insertError) throw insertError;
                setProfile(newProfile);
            } else {
                setProfile(existing);
            }
        } catch (err) {
            console.error('[Auth Shield] Profile Sync Failed:', err);
        }
    }, []);

    const verify = useCallback(async () => {
        try {
            // 🛡️ LAW 2: Always use getUser() for verification, not getSession()
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

    const signIn = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) {
            setUser(data.user);
            await ensureMerchantProfile(data.user);
        }
    };

    const signUp = async (email, password, storeName) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { store_name: storeName } }
        });
        if (error) throw error;
        if (data.user) {
            setUser(data.user);
            // Higher-order insertion to ensure no gaps
            await supabase.from('merchants').insert({
                id: data.user.id,
                email: data.user.email,
                store_name: storeName,
                created_at: new Date().toISOString(),
            });
            await verify();
        }
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
            isAuthenticated: !!user,
            signIn, signUp, signOut, updateProfile, resetAuth 
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