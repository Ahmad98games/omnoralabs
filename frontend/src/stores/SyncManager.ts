import debounce from 'lodash/debounce';
import { useBuilderStore } from './useBuilderStore';
import { Kernel } from '../lib/kernel/Kernel';
import { OmnoraLogger } from '../lib/kernel/utils/logger';

export class SyncManager {
    private static retryCount = 0;
    private static maxRetries = 3;
    private static backupNodes: Record<string, unknown> | null = null;
    private static isPaused = false;

    public static pause(durationMs: number) {
        this.isPaused = true;
        this.debouncedSync.cancel();
        setTimeout(() => {
            this.isPaused = false;
        }, durationMs);
    }

    public static debouncedSync = debounce(async () => {
        if (this.isPaused) return;

        const state = useBuilderStore.getState();
        if (!state.hasUnsavedChanges || !state.activePageId) return;

        // OSTT FIX: Using the newly implemented proper setter from the store
        state.setSaveStatus('saving');
        
        this.backupNodes = JSON.parse(JSON.stringify(state.nodes));

        try {
            const { data: pageData, error: fetchError } = await Kernel.readSystemState('STORE_PAGES', state.activePageId);

            if (fetchError && fetchError.code !== 'PGRST116') {
                throw fetchError;
            }

            const remoteTime = pageData?.updated_at ? new Date(pageData.updated_at as string).getTime() : 0;
            // OSTT FIX: Use proper property name implemented in store
            const lastRemoteTime = state.lastUpdatedRemote ? new Date(state.lastUpdatedRemote).getTime() : 0;

            if (remoteTime > lastRemoteTime && lastRemoteTime > 0) {
                 const proceed = window.confirm("⚠️ Version Conflict: This page was updated in another tab. Overwrite remote changes?");
                 if (!proceed) {
                     if (pageData?.ast_manifest) {
                          const nodesObj: Record<string, unknown> = {};
                          (pageData.ast_manifest as Array<Record<string, unknown>>).forEach(n => {
                              if (n.id) nodesObj[n.id as string] = n;
                          });
                          // OSTT FIX: Using the newly implemented proper setter
                          state.setNodes(nodesObj);
                     }
                     state.setSaveStatus('idle');
                     return;
                 }
            }

            const success = await Kernel.commitSystemState('STORE_PAGES', {
                id: state.activePageId,
                nodes: Object.values(state.nodes)
            });

            if (!success) throw new Error("Kernel state committal failed.");

            // OSTT FIX: All setter accesses are now strongly typed
            state.setSaveStatus('saved');
            state.setHasUnsavedChanges(false);
            state.setLastUpdatedRemote(new Date().toISOString());
            this.retryCount = 0;

        } catch (err) {
            OmnoraLogger.error('SYNC-MANAGER', `Sync Failure: ${err}`);
            this.retryCount++;

            if (this.retryCount >= this.maxRetries) {
                if (this.backupNodes) {
                    state.setNodes(this.backupNodes);
                }
                state.setSaveStatus('offline');
                alert("⚠️ Sync Failed after 3 attempts. Reverting state to last synced backup.");
                this.retryCount = 0;
            } else {
                setTimeout(() => this.debouncedSync(), 1000);
            }
        }
    }, 2000);

    public static syncNow() {
        if (this.isPaused) return;
        this.debouncedSync.cancel();
        this.debouncedSync();
    }
}