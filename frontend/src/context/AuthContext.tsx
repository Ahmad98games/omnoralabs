import * as React from 'react';
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { CinematicLoader } from '../components/ui/CinematicLoader';

export interface MerchantProfile {
    id: string;
    display_name: string;
    email: string;
    store_slug?: string;
    subscription?: string;
    metadata?: {
        role?: string;
        firstName?: string;
        lastName?: string;
    };
    created_at?: string;
}

export interface AuthContextValue {
    user: User | null;
    profile: MerchantProfile | null;
    isInitializing: boolean;
    isInitialized: boolean;
    isAuthenticated: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, storeName: string) => Promise<void>;
    login: (email: string, password: string, role?: string) => Promise<void>;
    register: (name: string, email: string, password: string, role?: string, storeName?: string) => Promise<void>;
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
    const [profile, setProfile] = useState<MerchantProfile | null>(null);
    const [isInitializing, setIsInitializing] = useState(true);
    const [isProfileLoading, setIsProfileLoading] = useState(false);
    const alreadyRedirectingRef = useRef(false);

    const ensuresMerchantProfile = async (sbUser: User, storeName?: string) => {
        console.log('[AuthContext] Checking merchant profile for:', sbUser.id);
        const { data: existing, error: fetchError } = await supabase
            .from('merchants')
            .select('id')
            .eq('id', sbUser.id)
            .maybeSingle();

        if (fetchError) {
            console.error('[AuthContext] Profile fetch error:', fetchError);
        }

        if (!existing) {
            console.log('[AuthContext] No profile found. Creating...');
            const finalDisplayName = storeName || 
                             sbUser.user_metadata?.store_name || 
                             sbUser.user_metadata?.full_name ||
                             sbUser.email?.split('@')[0] || 
                             'My Omnora Store';

            const slug = finalDisplayName.toLowerCase().replace(/\s+/g, '-');

            const { error: insertError } = await supabase.from('merchants').insert({
                id: sbUser.id,
                display_name: finalDisplayName,
                email: sbUser.email ?? '',
                store_slug: slug,
                subscription: 'basic',
                metadata: {
                    role: sbUser.user_metadata?.role || 'seller'
                }
            });

            if (insertError) {
                console.error('[AuthContext] Profile creation failed:', insertError);
            } else {
                console.log('[AuthContext] Profile created successfully.');
            }
        } else {
             console.log('[AuthContext] Existing profile found.');
        }
    };

    useEffect(() => {
        let mounted = true;

        const init = async () => {
            console.log('[AuthContext] Initializing Kernel Auth...');
            try {
                // getUser() verifies with Supabase server every time (essential for Vercel)
                const { data: { user: verifiedUser }, error } = await supabase.auth.getUser();

                if (!mounted) return;

                if (error || !verifiedUser) {
                    console.log('[AuthContext] No active session found.');
                    setUser(null);
                    setProfile(null);
                    return;
                }

                console.log('[AuthContext] User verified:', verifiedUser.id);
                setUser(verifiedUser);
                
                // 🛡️ NON-BLOCKING HYDRATION: Start profile work but don't hold up the app
                setIsProfileLoading(true);
                ensuresMerchantProfile(verifiedUser).then(async () => {
                   if (!mounted) return;
                   console.log('[AuthContext] Fetching full profile...');
                   const { data: merchantProfile } = await supabase
                        .from('merchants')
                        .select('*')
                        .eq('id', verifiedUser.id)
                        .maybeSingle();

                   if (mounted) setProfile(merchantProfile);
                }).catch(() => {
                    // Fail silently but log internally if needed
                }).finally(() => {
                   if (mounted) setIsProfileLoading(false);
                });
            } catch {
                if (mounted) { setUser(null); setProfile(null); }
            } finally {
                if (mounted) setIsInitializing(false);
            }
        };

        init();

        // 🛡️ KERNEL SAFETY TIMEOUT (Task 8.2)
        // Ensure the app NEVER hangs on the loader indefinitely, even if Supabase is slow/blocked.
        const safetyTimeout = setTimeout(() => {
            if (mounted && isInitializing) {
                console.warn('[AuthContext] Kernel Boot Timeout. Forcing transition...');
                setIsInitializing(false);
            }
        }, 12000); // 12-second grace period

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (!mounted) return;

                if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
                    setUser(session.user);
                    await ensuresMerchantProfile(session.user);
                    const { data: p } = await supabase
                        .from('merchants').select('*').eq('id', session.user.id).single();
                    if (mounted) setProfile(p);
                    setIsInitializing(false);
                }

                if (event === 'SIGNED_OUT') {
                    setUser(null);
                    setProfile(null);
                }
            }
        );

        return () => {
            mounted = false;
            clearTimeout(safetyTimeout);
            subscription.unsubscribe();
        };
    }, []); 

    const signIn = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        await ensuresMerchantProfile(data.user);
        const { data: p } = await supabase
            .from('merchants').select('*').eq('id', data.user.id).single();
        setUser(data.user);
        setProfile(p);

        // Explicit physical redirect (essential for Vercel SPA state)
        window.location.href = '/seller';
    };

    const signUp = async (email: string, password: string, storeName: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { store_name: storeName } }
        });
        if (error) throw error;
        if (!data.user) throw new Error('Sign up failed — no user returned');

        await supabase.from('merchants').upsert({
            id: data.user.id,
            store_name: storeName,
            email,
            role: 'seller',
            created_at: new Date().toISOString(),
        });

        window.location.href = '/seller';
    };

    const loginWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${window.location.origin}/auth/callback` }
        });
        if (error) throw error;
    };

    const resetAuth = useCallback(async () => {
        if (alreadyRedirectingRef.current) return;
        alreadyRedirectingRef.current = true;

        await supabase.auth.signOut();

        Object.keys(localStorage)
            .filter(k => k.startsWith('omnora-'))
            .forEach(k => localStorage.removeItem(k));

        setUser(null);
        setProfile(null);
        window.location.href = '/login';
    }, []);

    const resetPassword = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
    };

    const updateProfile = async (data: Partial<MerchantProfile>) => {
        if (!user) return;
        const { error } = await supabase.from('merchants').update(data).eq('id', user.id);
        if (error) throw error;
        setProfile(prev => prev ? { ...prev, ...data } : null);
    };

    // --- Component Compatibility Mappings ---
    const login = async (email: string, password: string) => signIn(email, password);
    const register = async (name: string, email: string, password: string, _role?: string, storeName?: string) => 
        signUp(email, password, storeName || `${name}'s Store`);

    if (isInitializing) return <CinematicLoader />;

    return (
        <AuthContext.Provider value={{
            user, profile,
            isInitializing,
            isProfileLoading,
            isInitialized: !isInitializing,
            isAuthenticated: !!user,
            isSeller: (profile?.metadata?.role === 'seller' || profile?.metadata?.role === 'admin'),
            isAdmin: profile?.metadata?.role === 'admin',
            loading: isInitializing || (!!user && isProfileLoading), // 🛡️ Smart Loading
            signIn, signUp, 
            login, register, // Internal compatibility
            loginWithGoogle,
            signOut: resetAuth,
            logout: resetAuth,
            resetPassword,
            updateProfile,
            resetAuth
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