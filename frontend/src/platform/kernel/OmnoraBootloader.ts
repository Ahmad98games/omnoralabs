import { toast } from 'react-hot-toast';

export const OmnoraBootloader = {
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
                localStorage.clear();
                sessionStorage.clear();
                // Clear any IndexedDB offline caches if present
                indexedDB.databases().then(dbs => {
                    dbs.forEach(db => { if (db.name) indexedDB.deleteDatabase(db.name); });
                });
            } catch (e) {
                // Ignore storage clearing blocks
            } finally {
                window.location.reload();
            }
        }, 1500);
    }
};
