/**
 * Publisher: The JSON Compiler (Phase 14 — Cloud-Enabled)
 *
 * Extracts the entire builder ecosystem into a single serializable
 * `StorefrontConfig` object. Now supports both:
 *   - localStorage persistence (fallback/offline)
 *   - Cloud persistence via IDatabaseClient (primary)
 *
 * ARCHITECTURE:
 *   Builder State → Publisher.compile() → StorefrontConfig JSON
 *     → databaseClient.saveStoreConfig(merchantId, config, domain)
 *     → StorefrontApp fetches by domain/storeId via CleanRenderer
 */

import { nodeStore } from '../core/NodeStore';
import { symbolManager, SymbolBlueprint } from '../core/SymbolManager';
import { defaultTheme, ThemeConfig } from '../../components/cms/ThemeManager';
import { PlatformBlock } from '../core/types';
import { databaseClient } from '../core/DatabaseClient';
import type { StorefrontConfig } from '../core/DatabaseTypes';
import { getRegistryEntry } from '../core/Registry';
import { useBuilderStore } from '../../stores/useBuilderStore';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stableStringify(obj: any): string {
    if (typeof obj !== 'object' || obj === null) return JSON.stringify(obj);
    if (Array.isArray(obj)) {
        return `[${obj.map(stableStringify).join(',')}]`;
    }
    const keys = Object.keys(obj).sort();
    return `{${keys.map(k => `"${k}":${stableStringify(obj[k])}`).join(',')}}`;
}

// ─── Interfaces ───────────────────────────────────────────────────────────────

// StorefrontConfig moved to DatabaseTypes.ts to break circular dependency

const STORAGE_KEY = 'omnora_storefront_config';

// ─── Publisher Class ──────────────────────────────────────────────────────────

class Publisher {

    /**
     * Compile: Extracts the full builder state into a StorefrontConfig.
     * This is a pure read operation — no side effects.
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
            
            pages: store.pages, // 📖 Serialize pages metadata Continuous animation maps
        };

        return config;
    }

    /**
     * publishSite: Compiles and persists to BOTH localStorage AND cloud.
     * Cloud push requires merchantId and domain.
     *
     * @returns The build ID for reference.
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

            // 1. Validate block types before publishing limits triggers
            for (const [id, node] of Object.entries(config.nodes)) {
                if (!getRegistryEntry(node.type)) {
                    const err = `Publish rejected: Node "${id}" uses unknown block type "${node.type}".`;
                    store.setPublishStatus('error');
                    store.setPublishError(err);
                    throw new Error(err);
                }
            }

            // 2. Always save to localStorage as fallback
            try {
                localStorage.setItem(STORAGE_KEY, stableStringify(config));
            } catch { /* storage full */ }

            // 3. If merchant context is available, push to cloud
            if (merchantId && domain) {
                // Atomic Diff comparison checks
                const lastRecord = await databaseClient.getStoreConfigByMerchant(merchantId);
                if (lastRecord && lastRecord.config) {
                    const lastConfig = lastRecord.config as StorefrontConfig;
                    const currentStr = stableStringify({ nodes: config.nodes, pageLayouts: config.pageLayouts });
                    const lastStr = stableStringify({ nodes: lastConfig.nodes || {}, pageLayouts: lastConfig.pageLayouts || {} });

                    if (currentStr === lastStr) {
                        console.log('%c[Omnora Publisher] ☁️ Cloud diff empty, skipping push.%c', 'color: #34d399; font-weight: bold;');
                        store.setPublishStatus('success');
                        store.setLastPublishedAt(new Date().toISOString());
                        return config.buildId;
                    }
                }

                const record = await databaseClient.saveStoreConfig(merchantId, config, domain);
                console.log(
                    `%c[Omnora Publisher] ☁️ Cloud published!%c\n  Build: ${config.buildId}\n  Domain: ${record.domain}`,
                    'color: #34d399; font-weight: bold;',
                    'color: #a1a1aa;'
                );
            } else {
                console.log(
                    `%c[Omnora Publisher] 💾 Local publish (no merchant context)%c\n  Build: ${config.buildId}`,
                    'color: #facc15; font-weight: bold;',
                    'color: #a1a1aa;'
                );
            }

            store.setPublishStatus('success');
            store.setLastPublishedAt(new Date().toISOString());

            // 💾 ON-DEMAND REVALIDATION: Clear local cache to force fresh manifest load
            if (merchantId) {
                try {
                    localStorage.removeItem(`omnora_cache_${merchantId}`);
                    localStorage.removeItem(`omnora_cache_${domain}`);
                } catch { /* ignore */ }
            }

            return config.buildId;

        } catch (err: any) {
            console.error('[Omnora Publisher] ❌ Cloud publish failed:', err);
            store.setPublishStatus('error');
            store.setPublishError(err.message || 'Unknown publish error encountered.');
            throw err;
        }
    }

    /**
     * loadPublishedConfig: Reads from cloud (by merchantId) or falls back to localStorage.
     */
    async loadPublishedConfig(merchantId?: string): Promise<StorefrontConfig | null> {
        // Try cloud first
        if (merchantId) {
            try {
                const record = await databaseClient.getStoreConfigByMerchant(merchantId);
                if (record) {
                    const cfg = record.config as any;
                    cfg._isSuspended = record.isSuspended;
                    return cfg as StorefrontConfig;
                }
            } catch {
                console.warn('[Omnora Publisher] Cloud fetch failed, falling back to localStorage.');
            }
        }

        // Fallback: localStorage
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            return JSON.parse(raw) as StorefrontConfig;
        } catch {
            return null;
        }
    }

    /**
     * loadByDomain: Used by the Live Storefront to resolve a store by its domain.
     */
    async loadByDomain(domain: string): Promise<StorefrontConfig | null> {
        try {
            const record = await databaseClient.getStoreConfigByDomain(domain);
            if (record) {
                const cfg = record.config as any;
                cfg._isSuspended = record.isSuspended;
                return cfg as StorefrontConfig;
            }
            return null;
        } catch {
            return null;
        }
    }

    /**
     * clearPublished: Removes the published config (for testing/reset).
     */
    clearPublished(): void {
        localStorage.removeItem(STORAGE_KEY);
    }
}

export const publisher = new Publisher();
