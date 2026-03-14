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

        const config: StorefrontConfig = {
            buildId: `build_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            publishedAt: new Date().toISOString(),
            schemaVersion: 1,
            merchantId,

            nodes: storeSnapshot.nodes as Record<string, PlatformBlock>,
            pageLayouts: storeSnapshot.pageLayouts,

            theme: { ...defaultTheme, ...themeOverrides },
            symbols: symbolManager.getAllSymbols(),
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
        const config = this.compile(merchantId, themeOverrides);

        // 1. Always save to localStorage as fallback
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
        } catch { /* storage full */ }

        // 2. If merchant context is available, push to cloud
        if (merchantId && domain) {
            try {
                const record = await databaseClient.saveStoreConfig(merchantId, config, domain);
                console.log(
                    `%c[Omnora Publisher] ☁️ Cloud published!%c\n  Build: ${config.buildId}\n  Domain: ${record.domain}\n  Nodes: ${Object.keys(config.nodes).length}`,
                    'color: #34d399; font-weight: bold;',
                    'color: #a1a1aa;'
                );
            } catch (err) {
                console.error('[Omnora Publisher] ❌ Cloud publish failed (localStorage OK):', err);
            }
        } else {
            console.log(
                `%c[Omnora Publisher] 💾 Local publish (no merchant context)%c\n  Build: ${config.buildId}`,
                'color: #facc15; font-weight: bold;',
                'color: #a1a1aa;'
            );
        }

        return config.buildId;
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
