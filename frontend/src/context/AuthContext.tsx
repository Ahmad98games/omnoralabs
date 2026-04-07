import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { User } from '@supabase/supabase-js';
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
    full_name?: string;
    avatar_url?: string;
}

export interface AuthContextValue {
    user: User | null;
    profile: MerchantProfile | CustomerProfile | null;
    isInitializing: boolean;
    isInitialized: boolean;
    loading: boolean;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isSeller: boolean;
    isCustomer: boolean;
    isAuthModalOpen: boolean;
    authModalMode: 'login' | 'signup';
    setAuthModalOpen: (open: boolean, mode?: 'login' | 'signup') => void;
    login: (email: string, password: string, role?: string) => Promise<unknown>;
    register: (name: string, email: string, password: string, role?: string, storeName?: string) => Promise<unknown>;
    loginWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    updateProfile: (data: Partial<MerchantProfile>) => Promise<void>;
    resetAuth: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<MerchantProfile | CustomerProfile | null>(null);
    const [isInitializing, setIsInitializing] = useState(true);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

    // ─── Deduplication Ref ───────────────────────────────────────────────────
    // Prevents ensureProfile from running twice for the same user simultaneously.
    // BUG this fixed: login() called supabase.auth.signInWithPassword() which
    // synchronously triggered onAuthStateChange(SIGNED_IN). Both login() and the
    // listener then called ensureProfile() concurrently. The second INSERT hit a
    // unique constraint, failed silently → profile stayed null → infinite loop.
    const profileFetchRef = useRef<Map<string, Promise<unknown>>>(new Map());

    const setAuthModalOpenCallback = useCallback((open: boolean, mode: 'login' | 'signup' = 'login') => {
        setAuthModalMode(mode);
        setIsAuthModalOpen(open);
    }, []);

    const resetAuth = useCallback(async () => {
        await supabase.auth.signOut();
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('omnora-')) localStorage.removeItem(key);
        });
        window.location.href = '/login';
    }, []);

    const ensureProfile = useCallback(async (
        sbUser: User | { id: string; email?: string; user_metadata: Record<string, unknown> },
        name?: string,
        role: string | null = null,
        storeName?: string
    ) => {
        // Return the in-flight promise if one exists for this user ID.
        const existingFetch = profileFetchRef.current.get(sbUser.id);
        if (existingFetch) return existingFetch;

        const fetchPromise = (async () => {
            try {
                const savedRole = localStorage.getItem('omnora_selected_role');
                const targetRole = role || (sbUser.user_metadata?.role as string) || savedRole || 'customer';
                const fallbackName = name || (sbUser.user_metadata?.full_name as string) || sbUser.email?.split('@')[0] || '';

                console.log(`[Auth Profile] Convergence → ${sbUser.email} as ${targetRole}`);

                // ── Step 1: Check primary table ──────────────────────
                if (targetRole === 'seller' || targetRole === 'admin' || targetRole === 'super-admin') {
                    const { data: merchant } = await supabase.from('merchants').select('*').eq('id', sbUser.id).maybeSingle();
                    if (merchant) { setProfile(merchant as MerchantProfile); return merchant; }
                } else {
                    const { data: customer } = await supabase.from('customers').select('*').eq('id', sbUser.id).maybeSingle();
                    if (customer) { setProfile({ ...customer, role: 'customer' } as CustomerProfile); return customer; }
                }

                // ── Step 2: Cross-check alternate table ──────────────
                const { data: altMerchant } = await supabase.from('merchants').select('*').eq('id', sbUser.id).maybeSingle();
                if (altMerchant) { setProfile(altMerchant as MerchantProfile); return altMerchant; }

                const { data: altCustomer } = await supabase.from('customers').select('*').eq('id', sbUser.id).maybeSingle();
                if (altCustomer) {
                    if (targetRole === 'seller' || targetRole === 'admin' || targetRole === 'super-admin') {
                        const { data: upgradedMerchant, error: upgradeError } = await supabase.from('merchants').insert({
                            id: sbUser.id, email: sbUser.email,
                            password_hash: altCustomer.password_hash || 'auth-managed',
                            full_name: altCustomer.full_name,
                            store_name: storeName || `${fallbackName}'s Store`,
                            role: targetRole,
                        }).select().maybeSingle();
                        if (!upgradeError && upgradedMerchant) { setProfile(upgradedMerchant as MerchantProfile); return upgradedMerchant; }
                    }
                    setProfile({ ...altCustomer, role: 'customer' } as CustomerProfile);
                    return altCustomer;
                }

                // ── Step 3: Provision new record ─────────────────────
                if (targetRole === 'seller' || targetRole === 'admin' || targetRole === 'super-admin') {
                    const { data: newMerchant, error } = await supabase.from('merchants').insert({
                        id: sbUser.id, email: sbUser.email,
                        password_hash: 'auth-managed',
                        full_name: fallbackName,
                        store_name: storeName || (sbUser.user_metadata?.store_name as string) || `${fallbackName}'s Store`,
                        role: targetRole,
                    }).select().maybeSingle();

                    if (error) {
                        // Unique constraint = race condition, another call just won. Re-fetch.
                        if (error.code === '23505') {
                            const { data: raceWinner } = await supabase.from('merchants').select('*').eq('id', sbUser.id).maybeSingle();
                            if (raceWinner) { setProfile(raceWinner as MerchantProfile); return raceWinner; }
                        }
                        throw error;
                    }
                    if (newMerchant) { setProfile(newMerchant as MerchantProfile); return newMerchant; }
                } else {
                    const { data: newCustomer, error } = await supabase.from('customers').insert({
                        id: sbUser.id, email: sbUser.email,
                        password_hash: 'auth-managed',
                        full_name: fallbackName,
                    }).select().maybeSingle();

                    if (error) {
                        if (error.code === '23505') {
                            const { data: raceWinner } = await supabase.from('customers').select('*').eq('id', sbUser.id).maybeSingle();
                            if (raceWinner) { setProfile({ ...raceWinner, role: 'customer' } as CustomerProfile); return raceWinner; }
                        }
                        throw error;
                    }
                    if (newCustomer) {
                        const fullCustomer = { ...newCustomer, role: 'customer' } as CustomerProfile;
                        setProfile(fullCustomer);
                        return fullCustomer;
                    }
                }

                return null;
            } catch (err) {
                console.error('[Auth Profile] CONVERGENCE_ERROR:', err);
                return null;
            } finally {
                profileFetchRef.current.delete(sbUser.id);
            }
        })();

        profileFetchRef.current.set(sbUser.id, fetchPromise);
        return fetchPromise;
    }, []);

    const loginWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) throw error;
    };

    useEffect(() => {
        let isMounted = true;

        const emergencyTimeout = setTimeout(() => {
            if (isMounted) {
                console.warn('[Auth Shield] EMERGENCY_RESET: Forcing kernel to settle.');
                setIsInitializing(false);
            }
        }, 8000);

        const initialize = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) throw error;
                if (!isMounted) return;

                if (session?.user) {
                    setUser(session.user);
                    await ensureProfile(session.user);
                } else {
                    setUser(null);
                    setProfile(null);
                }
            } catch (err) {
                console.error('[Auth Shield] Initialization failure:', err);
            } finally {
                if (isMounted) {
                    clearTimeout(emergencyTimeout);
                    setIsInitializing(false);
                }
            }
        };

        initialize();

        // ─── Single canonical profile sync path ──────────────────────────────
        // login() and register() no longer call ensureProfile() directly.
        // This subscriber is the ONLY place profiles are loaded — it handles
        // email login, OAuth callbacks, magic links, and token refreshes uniformly.
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!isMounted) return;
            console.log(`[Auth Pulse] ${event}`);

            if (session?.user) {
                setUser(session.user);
                const savedRole = localStorage.getItem('omnora_selected_role');
                await ensureProfile(session.user, undefined, savedRole);
                if (!isMounted) return; // guard after async — component may have unmounted
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setProfile(null);
                profileFetchRef.current.clear();
            }
        });

        return () => {
            isMounted = false;
            clearTimeout(emergencyTimeout);
            subscription.unsubscribe();
        };
    }, [ensureProfile]);

    // ─── login / register: only call Supabase auth. ──────────────────────────
    // Profile loading is handled exclusively by onAuthStateChange above.
    // This eliminates the double-call race condition that caused the infinite loop.
    const login = async (email: string, password: string, requestedRole?: string) => {
        if (requestedRole) localStorage.setItem('omnora_selected_role', requestedRole);
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data.user;
    };

    const register = async (name: string, email: string, password: string, role = 'customer', storeName?: string) => {
        localStorage.setItem('omnora_selected_role', role);
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name,
                    store_name: storeName || (role === 'seller' ? `${name}'s Store` : null),
                    role,
                },
            },
        });
        if (error) throw error;
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
        const { error } = await supabase.from('merchants').update(data).eq('id', user.id);
        if (error) throw error;
        setProfile(prev => {
            if (!prev || prev.role === 'customer') return prev;
            return { ...prev, ...data } as MerchantProfile;
        });
    };

    if (isInitializing) return <CinematicLoader />;

    return (
        <AuthContext.Provider value={{
            user, profile,
            isInitializing,
            isInitialized: !isInitializing,
            loading: isInitializing,
            isAuthenticated: !!user,
            isAdmin: profile?.role === 'admin' || profile?.role === 'super-admin',
            isSeller: profile?.role === 'seller',
            isCustomer: !profile || profile?.role === 'customer',
            isAuthModalOpen,
            authModalMode,
            setAuthModalOpen: setAuthModalOpenCallback,
            login, loginWithGoogle, register, signOut,
            logout: signOut,
            resetPassword, updateProfile, resetAuth,
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