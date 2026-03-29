import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, AuthError } from '@supabase/supabase-js';
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
    theme_settings?: Record<string, unknown>;
    role: 'seller' | 'admin' | 'super-admin';
    created_at: string;
}

interface AuthContextValue {
    user: User | null;
    profile: MerchantProfile | CustomerProfile | null;
    isInitializing: boolean;
    loading: boolean;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isSeller: boolean;
    isCustomer: boolean;
    login: (email: string, password: string) => Promise<unknown>;
    register: (name: string, email: string, password: string, role?: string, storeName?: string) => Promise<unknown>;
    loginWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    updateProfile: (data: Partial<MerchantProfile>) => Promise<void>;
    resetAuth: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<MerchantProfile | CustomerProfile | null>(null);
    const [isInitializing, setIsInitializing] = useState(true);

    const resetAuth = useCallback(async () => {
        await supabase.auth.signOut();
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('omnora-')) localStorage.removeItem(key);
        });
        window.location.href = '/login';
    }, []);

    const ensureProfile = useCallback(async (sbUser: User | { id: string; email?: string; user_metadata: Record<string, unknown> }, name?: string, role: string | null = null, storeName?: string) => {
        try {
            // 🛡️ RECOVERY: Read role from localStorage if it was saved during Login.tsx handleGoogleSignIn
            const savedRole = localStorage.getItem('omnora_selected_role');
            const targetRole = role || sbUser.user_metadata?.role || savedRole || 'customer';
            
            console.log(`[Auth Profile] Commencing Convergence for ${sbUser.email} as ${targetRole}`);

            const fallbackName = name || sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0];

            // 1. Try fetching from Merchants first if seller/admin
            if (targetRole === 'seller' || targetRole === 'admin' || targetRole === 'super-admin') {
                const { data: merchant } = await supabase.from('merchants').select('*').eq('id', sbUser.id).maybeSingle();
                if (merchant) {
                    console.log(`[Auth Profile] Merchant Record Found: ${merchant.store_name}`);
                    setProfile(merchant as any);
                    return merchant;
                }
            } else {
                // 2. Try fetching from Customers
                const { data: customer } = await supabase.from('customers').select('*').eq('id', sbUser.id).maybeSingle();
                if (customer) {
                    console.log(`[Auth Profile] Customer Record Found: ${customer.full_name}`);
                    setProfile({ ...customer, role: 'customer' } as any);
                    return customer;
                }
            }

            // 3. Identification Phase (Manual record cross-check)
            console.log('[Auth Profile] No record found in target table. Performing global cross-check...');
            const { data: altMerchant } = await supabase.from('merchants').select('*').eq('id', sbUser.id).maybeSingle();
            if (altMerchant) { 
                console.log('[Auth Profile] Cross-Check Match: MERCHANT');
                setProfile(altMerchant as any); return altMerchant; 
            }
            
            const { data: altCustomer } = await supabase.from('customers').select('*').eq('id', sbUser.id).maybeSingle();
            if (altCustomer) { 
                console.log('[Auth Profile] Cross-Check Match: CUSTOMER');
                setProfile({ ...altCustomer, role: 'customer' } as any); return altCustomer; 
            }

            // 4. Initial Provisioning (First-time users)
            console.log(`[Auth Profile] Initializing new ${targetRole} record for ${sbUser.id}...`);
            if (targetRole === 'seller' || targetRole === 'admin' || targetRole === 'super-admin') {
                const finalStoreName = storeName || sbUser.user_metadata?.store_name || `${fallbackName}'s Store`;
                const { data: newMerchant, error } = await supabase.from('merchants').insert({
                    id: sbUser.id,
                    email: sbUser.email,
                    full_name: fallbackName,
                    store_name: finalStoreName,
                    role: targetRole,
                }).select().maybeSingle();
                if (error) throw error;
                console.log(`[Auth Profile] Provisioned MERCHANT: ${newMerchant.id}`);
                setProfile(newMerchant as any);
                return newMerchant;
            } else {
                const { data: newCustomer, error } = await supabase.from('customers').insert({
                    id: sbUser.id,
                    email: sbUser.email,
                    full_name: fallbackName,
                }).select().maybeSingle();
                if (error) throw error;
                console.log(`[Auth Profile] Provisioned CUSTOMER: ${newCustomer.id}`);
                const fullCustomer = { ...newCustomer, role: 'customer' };
                setProfile(fullCustomer as any);
                return fullCustomer;
            }
        } catch (err) {
            console.error('[Auth Profile] CONVERGENCE_ERROR:', err);
            return null;
        }
    }, []);

    const verify = useCallback(async () => {
        try {
            console.log('[Auth Shield] Core Kernel Initialization Initiated...');
            
            // 🛡️ RACE CONDITION PROTECTION: Timeout the Supabase call
            const authPromise = supabase.auth.getUser();
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('SUPABASE_TIMEOUT')), 5000)
            );

            const { data: { user: sbUser }, error } = await Promise.race([authPromise, timeoutPromise]) as { data: { user: User | null }; error: AuthError | null };
            
            if (error || !sbUser) {
                console.warn('[Auth Shield] No valid session found in Kernel.');
                setUser(null);
                setProfile(null);
            } else {
                console.log(`[Auth Shield] Valid session found: ${sbUser.id}. Converging profile...`);
                setUser(sbUser);
                await ensureProfile(sbUser);
            }
        } catch (err) {
            console.error('[Auth Shield] VERIFICATION_FAULT:', err);
            // Default to Guest if blocked
            setUser(null);
            setProfile(null);
        } finally {
            console.log('[Auth Shield] Kernel Settled.');
            setIsInitializing(false);
        }
    }, [ensureProfile]);

    useEffect(() => {
        if (!isInitializing && profile) {
            const targetPath = profile.role === 'seller' ? '/seller/dashboard' : '/';
            console.log('[Auth Shield] Redirecting to:', targetPath);
            navigate(targetPath);
        }
    }, [profile, isInitializing, navigate]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (isInitializing) {
                console.warn('[Auth Shield] Kernel Init timed out after 6s. Forcing settlement.');
                setIsInitializing(false);
            }
        }, 6000);

        verify();
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log(`[Auth Pulse] State Change Triggered: ${event}`);
            if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user) {
                setUser(session.user);
                await ensureProfile(session.user);
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setProfile(null);
            }
        });

        return () => {
            clearTimeout(timeoutId);
            subscription.unsubscribe();
        };
    }, [verify, ensureProfile, isInitializing]);

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
            login, register, signOut, resetPassword, updateProfile, resetAuth 
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