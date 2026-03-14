import { useState, useEffect } from 'react';

/**
 * useStoreHydration Hook
 * Prevents hydration mismatches in SSR/Hydration environments (like Next.js or pure React hydration)
 * by guarding UI rendering until the Zustand store has rehydrated from localStorage.
 * 
 * @param store The store to check for hydration
 * @returns boolean indicating if the store has finished rehydrating
 */
export const useStoreHydration = (store: any) => {
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        // Use the internal _hasHydrated flag if available
        if (store.getState()._hasHydrated) {
            setHydrated(true);
        } else {
            // Subscribe to changes until hydrated is true
            const unsub = store.subscribe((state: any) => {
                if (state._hasHydrated) {
                    setHydrated(true);
                    unsub();
                }
            });
            return unsub;
        }
    }, [store]);

    return hydrated;
};
