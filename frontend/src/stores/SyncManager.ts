/**
 * 🛠️ OMNORA LABS | [SYNC MANAGER]
 * ---------------------------------------------------------
 * Principal Architect: Ahmad Mahboob (@ahmad-labs)
 * Division: Universal Commerce OS / Kernel Core
 * "Precision is the foundation of industrial scale."
 * ---------------------------------------------------------
 */

import debounce from 'lodash/debounce';
import { useBuilderStore } from './useBuilderStore';
import { Kernel } from '../lib/kernel/Kernel';
import { OmnoraLogger } from '../lib/kernel/utils/logger';

export class SyncManager {
    private static retryCount = 0;
    private static maxRetries = 3;
    private static backupNodes: any = null;
    private static isPaused = false;

    /**
     * Temporarily pauses syncing to avoid database hits during rapid local changes (e.g., Undo/Redo).
     */
    public static pause(durationMs: number) {
        this.isPaused = true;
        this.debouncedSync.cancel(); // Cancel any pending debounce immediately
        setTimeout(() => {
            this.isPaused = false;
        }, durationMs);
    }

    /**
     * Debounced Sync: Batches changes and sends to Supabase every 2000ms.
     * Only executes if hasUnsavedChanges is true.
     */
    public static debouncedSync = debounce(async () => {
        if (this.isPaused) return;

        const state = useBuilderStore.getState();
        if (!state.hasUnsavedChanges || !state.activePageId) return;

        state.setSaveStatus('saving');
        
        // Backup current node tree state for Rollback logic
        this.backupNodes = { ...state.nodes };

        try {
            // 1. Fetch Remote State Version (Conflict Check)
            // This read operation is still necessary for conflict detection before committing.
            const { data: pageData, error: fetchError } = await Kernel.readSystemState('STORE_PAGES', state.activePageId);

            if (fetchError && fetchError.code !== 'PGRST116') { // Ignore single row not found
                throw fetchError;
            }

            const remoteTime = pageData?.updated_at ? new Date(pageData.updated_at).getTime() : 0;
            const lastRemoteTime = state.lastUpdatedRemote ? new Date(state.lastUpdatedRemote).getTime() : 0;

            // Version Conflict Resolution (DB is building separately since our load)
            if (remoteTime > lastRemoteTime && lastRemoteTime > 0) {
                 const proceed = confirm("⚠️ Version Conflict: This page was updated in another tab. Overwrite remote changes?");
                 if (!proceed) {
                     // Rollback local state to match remote or trigger Merge dialog
                     if (pageData?.ast_manifest) {
                          const nodesObj: Record<string, any> = {};
                          (pageData.ast_manifest as any[]).forEach(n => nodesObj[n.id] = n);
                          state.setNodes(nodesObj);
                     }
                     state.setSaveStatus('idle');
                     return;
                 }
            }

            // 2. Perform Atomic Upsert Transaction via Kernel
            const success = await Kernel.commitSystemState('STORE_PAGES', {
                id: state.activePageId,
                nodes: Object.values(state.nodes)
            });

            if (!success) throw new Error("Kernel state committal failed.");

            // 3. Success Updates
            state.setSaveStatus('saved');
            state.setHasUnsavedChanges(false);
            // Re-fetch updatedAt from Kernel or use local approximation
            state.setLastUpdatedRemote(new Date().toISOString());
            this.retryCount = 0; // Reset retries

        } catch (err) {
            OmnoraLogger.error('SYNC-MANAGER', `Sync Failure: ${err}`);
            this.retryCount++;

            if (this.retryCount >= this.maxRetries) {
                // MAXIMUM RETRIES EXCEEDED: ROLLBACK Local State
                if (this.backupNodes) {
                    state.setNodes(this.backupNodes);
                }
                state.setSaveStatus('offline');
                alert("⚠️ Sync Failed after 3 attempts. Reverting state to last synced backup.");
                this.retryCount = 0;
            } else {
                // Retry in 1000ms
                setTimeout(() => this.debouncedSync(), 1000);
            }
        }
    }, 2000);

    /**
     * Trigger sync immediately on critical operations (e.g., delete, rename).
     */
    public static syncNow() {
        if (this.isPaused) return;
        this.debouncedSync.cancel(); // Cancel pending
        this.debouncedSync(); // Trigger immediately
    }
}
