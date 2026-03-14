/**
 * MerchantAuthContext: Builder Multi-Tenancy Layer
 *
 * Separate from the customer-facing AuthContext.
 * Manages merchant sign-up/sign-in for the Builder environment.
 * Merchant identity drives: which StorefrontConfig to load, which orders to show,
 * and which domain the live storefront resolves to.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { databaseClient } from '../platform/core/DatabaseClient';
import type { MerchantUser } from '../platform/core/DatabaseTypes';

// ─── Context Shape ────────────────────────────────────────────────────────────

interface MerchantAuthContextType {
    merchant: MerchantUser | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    error: string | null;
    signUp: (email: string, password: string, displayName: string) => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    clearError: () => void;
}

const MerchantAuthContext = createContext<MerchantAuthContextType | null>(null);

export const useMerchantAuth = (): MerchantAuthContextType => {
    const ctx = useContext(MerchantAuthContext);
    if (!ctx) throw new Error('[MerchantAuth] useMerchantAuth must be used within MerchantAuthProvider.');
    return ctx;
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export const MerchantAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [merchant, setMerchant] = useState<MerchantUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Hydrate session on mount
    useEffect(() => {
        let mounted = true;
        databaseClient.getCurrentUser()
            .then(u => { if (mounted) setMerchant(u); })
            .catch(() => { /* no session */ })
            .finally(() => { if (mounted) setIsLoading(false); });
        return () => { mounted = false; };
    }, []);

    const signUp = useCallback(async (email: string, password: string, displayName: string) => {
        setError(null);
        setIsLoading(true);
        try {
            const u = await databaseClient.signUp(email, password, displayName);
            setMerchant(u);
        } catch (err: any) {
            const msg = err?.message || 'Sign up failed';
            setError(msg);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const signIn = useCallback(async (email: string, password: string) => {
        setError(null);
        setIsLoading(true);
        try {
            const u = await databaseClient.signIn(email, password);
            setMerchant(u);
        } catch (err: any) {
            const msg = err?.message || 'Sign in failed';
            setError(msg);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const signOut = useCallback(async () => {
        await databaseClient.signOut();
        setMerchant(null);
    }, []);

    const clearError = useCallback(() => setError(null), []);

    return (
        <MerchantAuthContext.Provider value={{
            merchant,
            isLoading,
            isAuthenticated: !!merchant,
            error,
            signUp,
            signIn,
            signOut,
            clearError,
        }}>
            {children}
        </MerchantAuthContext.Provider>
    );
};
