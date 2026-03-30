/**
 * Publisher: The JSON Compiler (Phase 14 — Cloud-Enabled)
 * Refactored for OSTT: Removed 'any' and unused imports to secure the compilation pipeline.
 */

import { nodeStore } from '../core/NodeStore';
import { symbolManager } from '../core/SymbolManager'; 
import { defaultTheme, ThemeConfig } from '../../components/cms/ThemeManager';
import { PlatformBlock } from '../core/types';
import { databaseClient } from '../core/DatabaseClient';
import type { StorefrontConfig } from '../core/DatabaseTypes';
import { getRegistryEntry } from '../core/Registry';
import { useBuilderStore } from '../../stores/useBuilderStore';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * FIX: Replaced 'any' with 'unknown'. 
 * Logic: Stable stringify must handle primitive types and objects safely.
 */
function stableStringify(obj: unknown): string {
    if (typeof obj !== 'object' || obj === null) return JSON.stringify(obj);
    
    if (Array.isArray(obj)) {
        return `[${obj.map(stableStringify).join(',')}]`;
    }

    const typedObj = obj as Record<string, unknown>;
    const keys = Object.keys(typedObj).sort();
    return `{${keys.map(k => `"${k}":${stableStringify(typedObj[k])}`).join(',')}}`;
}

const STORAGE_KEY = 'omnora_storefront_config';

// ─── Publisher Class ──────────────────────────────────────────────────────────

class Publisher {
    private isLocked = false;

    /**
     * Compile: Extracts the full builder state into a StorefrontConfig.
     */
    compile(merchantId: string = 'default_merchant', themeOverrides?: Partial<ThemeConfig>): StorefrontConfig {
        const storeSnapshot = nodeStore.createSnapshot();
        const store = useBuilderStore.getState();

        const config: StorefrontConfig = {
            buildId: `build_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            publishedAt: new Date().toISOString(),
            schemaVersion: 1,
            merchantId,

            nodes: storeSnapshot.nodes as Record<string, PlatformBlock>,
            pageLayouts: storeSnapshot.pageLayouts,

            theme: { ...defaultTheme, ...themeOverrides },
            symbols: symbolManager.getAllSymbols(),
            
            pages: store.pages,
        };

        return config;
    }

    /**
     * publishSite: Compiles and persists to BOTH localStorage AND cloud.
     */
    async publishSite(
        merchantId?: string,
        domain?: string,
        themeOverrides?: Partial<ThemeConfig>,
    ): Promise<string> {
        const store = useBuilderStore.getState();
        store.setPublishStatus('publishing');
        store.setPublishError(null);

        try {
            const config = this.compile(merchantId, themeOverrides);

            // 1. Validate block types
            for (const [id, node] of Object.entries(config.nodes)) {
                if (!getRegistryEntry(node.type)) {
                    const err = `Publish rejected: Node "${id}" uses unknown block type "${node.type}".`;
                    store.setPublishStatus('error');
                    store.setPublishError(err);
                    throw new Error(err);
                }
            }

            // 2. localStorage fallback
            try {
                localStorage.setItem(STORAGE_KEY, stableStringify(config));
            } catch { /* storage full */ }

            // 3. Cloud Push
            if (merchantId && domain) {
                const lastRecord = await databaseClient.getStoreConfigByMerchant(merchantId);
                if (lastRecord && lastRecord.config) {
                    const lastConfig = lastRecord.config as StorefrontConfig;
                    const currentStr = stableStringify({ nodes: config.nodes, pageLayouts: config.pageLayouts });
                    const lastStr = stableStringify({ nodes: lastConfig.nodes || {}, pageLayouts: lastConfig.pageLayouts || {} });

                    if (currentStr === lastStr) {
                        console.log('%c[Omnora Publisher] ☁️ Cloud diff empty, skipping push.%c', 'color: #34d399; font-weight: bold;');
                        store.setPublishStatus('success');
                        
                        // OSTT FIX: Safely assert function exists before calling
                        if (typeof store.setLastPublishedAt === 'function') {
                            store.setLastPublishedAt(new Date().toISOString());
                        }
                        
                        return config.buildId;
                    }
                }

                const record = await databaseClient.saveStoreConfig(merchantId, config, domain);
                console.log(
                    `%c[Omnora Publisher] ☁️ Cloud published!%c\n  Build: ${config.buildId}\n  Domain: ${record.domain}`,
                    'color: #34d399; font-weight: bold;',
                    'color: #a1a1aa;'
                );
            }

            store.setPublishStatus('success');
            
            // OSTT FIX: Safely assert function exists before calling
            if (typeof store.setLastPublishedAt === 'function') {
                store.setLastPublishedAt(new Date().toISOString());
            }

            if (merchantId) {
                try {
                    localStorage.removeItem(`omnora_cache_${merchantId}`);
                    localStorage.removeItem(`omnora_cache_${domain}`);
                } catch { /* ignore */ }
            }

            return config.buildId;

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown publish error encountered.';
            console.error('[Omnora Publisher] ❌ Cloud publish failed:', errorMessage);
            store.setPublishStatus('error');
            store.setPublishError(errorMessage);
            throw err;
        }
    }

    /**
     * loadPublishedConfig: Reads from cloud or falls back to localStorage.
     */
    async loadPublishedConfig(merchantId?: string): Promise<StorefrontConfig | null> {
        if (merchantId) {
            try {
                const record = await databaseClient.getStoreConfigByMerchant(merchantId);
                if (record) {
                    const cfg = record.config as StorefrontConfig & { _isSuspended?: boolean };
                    cfg._isSuspended = record.isSuspended;
                    return cfg;
                }
            } catch {
                console.warn('[Omnora Publisher] Cloud fetch failed, falling back to localStorage.');
            }
        }

        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            return JSON.parse(raw) as StorefrontConfig;
        } catch {
            return null;
        }
    }

    /**
     * loadByDomain: Live Storefront domain resolver.
     */
    async loadByDomain(domain: string): Promise<StorefrontConfig | null> {
        try {
            const record = await databaseClient.getStoreConfigByDomain(domain);
            if (record) {
                const cfg = record.config as StorefrontConfig & { _isSuspended?: boolean };
                cfg._isSuspended = record.isSuspended;
                return cfg;
            }
            return null;
        } catch {
            return null;
        }
    }

    clearPublished(): void {
        localStorage.removeItem(STORAGE_KEY);
    }
}

export const publisher = new Publisher();