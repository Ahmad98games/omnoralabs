import { toast } from 'react-hot-toast';

export const OmnoraBootloader = {
    /**
     * Persistence triggers for isolating safe routing switch frames
     */
    saveLastValidPageId: (pageId: string) => {
        if (!pageId) return;
        localStorage.setItem('omnora-last-valid-pageId', pageId);
    },

    getLastValidPageId: () => {
        try {
            return localStorage.getItem('omnora-last-valid-pageId') || 'home';
        } catch (e) {
            return 'home';
        }
    },

    /**
     * ZOMBIE-TAB KILLER
     * If initialization stays TRUE for > 4000ms, it bypasses LocalStorage
     * and forces an external synchronization.
     */
    watchZombieTab: (
        isHydrating: boolean, 
        setIsHydrating: (val: boolean) => void, 
        fetchLatestManifest: () => Promise<void>
    ) => {
        if (!isHydrating) return () => {};

        const timer = setTimeout(() => {
            console.warn('[OmnoraBootloader] Zombie-Tab detected (>4000ms hydration). Engaging Auto-Repair.');
            setIsHydrating(false);
            toast.loading('Auto-Repairing Connection...', { duration: 3000 });
            
            fetchLatestManifest().then(() => {
                toast.success('Connection restored natively.');
            }).catch(() => {
                toast.error('Fatal sync failure. Please refresh.');
            });
        }, 4000);

        return () => clearTimeout(timer);
    },

    /**
     * THE PANIC BUTTON
     * Executes a complete volatile memory flush and reboots the interface.
     */
    executeHardReset: () => {
        console.error('[OmnoraBootloader] SYSTEM HARD RESET INITIATED.');
        toast.error('Emergency Protocol Engaged: Wiping Volatile Memory.', { duration: 2000 });
        
        setTimeout(() => {
            try {
                // Scoped memory flush: Only remove Omnora-prefixed keys to avoid breaking session tokens
                const keysToRemove: string[] = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && (key.startsWith('omnora') || key.includes('omnora'))) {
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach(k => localStorage.removeItem(k));
                
                sessionStorage.clear(); // Safe to clear or scoped similarly
                
                // Scoped IndexedDB wipes
                indexedDB.databases().then(dbs => {
                    dbs.forEach(db => { if (db.name && db.name.includes('omnora')) indexedDB.deleteDatabase(db.name); });
                });
            } catch (e) {
                // Ignore storage clearing blocks
            } finally {
                window.location.reload();
            }
        }, 1500);
    }
};
