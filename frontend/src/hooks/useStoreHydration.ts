import { useState, useEffect } from 'react';

/**
 * useStoreHydration Hook
 * Prevents hydration mismatches in SSR/Hydration environments
 * by guarding UI rendering until the Zustand store has rehydrated from localStorage.
 */
interface HydratableState { _hasHydrated?: boolean; [key: string]: unknown; }

export const useStoreHydration = (store: { getState: () => HydratableState; subscribe: (listener: (state: HydratableState) => void) => () => void }) => {
    // OSTT FIX: Initialize directly from state if possible to avoid set-state-in-effect
    const [hydrated, setHydrated] = useState(() => {
        try {
            return !!store.getState()._hasHydrated;
        } catch {
            return false;
        }
    });

    useEffect(() => {
        const state = store.getState();
        if (state._hasHydrated) {
            if (!hydrated) {
                // Use next tick to satisfy linter and avoid synchronous cascade
                Promise.resolve().then(() => setHydrated(true));
            }
            return;
        }

        const unsub = store.subscribe((newState: HydratableState) => {
            if (newState._hasHydrated) {
                setHydrated(true);
            }
        });
        
        return unsub;
    }, [store, hydrated]);

    return hydrated;
};
