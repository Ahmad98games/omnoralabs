import { toast } from 'react-hot-toast';

/**
 * 🛠️ OMNORA LABS | [KERNEL]
 * ---------------------------------------------------------
 * Principal Architect: Ahmad Mahboob (@ahmad-labs)
 * Division: Universal Commerce OS / Kernel Core
 * "Precision is the foundation of industrial scale."
 * ---------------------------------------------------------
 */

import { supabase } from '../supabaseClient';
import { DEFAULT_PROPS } from '../../components/cms/ComponentRegistry';
import { runMigrations } from '../../platform/kernel/MigrationScript';
import { OmnoraLogger } from './utils/logger';

export const CURRENT_KERNEL_VERSION = '2.1.0';

export interface SystemManifest {
    id: string;
    version: string;
    entities: Record<string, any>;
    lastSynced: string | null;
}

export class OmnoraKernel {
    private static instance: OmnoraKernel;
    private emergencyPatches: any = null;

    private constructor() {
        OmnoraLogger.integrity("KERNEL", "Omnora Kernel Boot Sequence Initiated.");
    }

    public static getInstance(): OmnoraKernel {
        if (!OmnoraKernel.instance) {
            OmnoraKernel.instance = new OmnoraKernel();
        }
        return OmnoraKernel.instance;
    }

    /**
     * commitSystemState: The primary protocol for committing state changes to the registry.
     */
    public async commitSystemState(category: 'STORE_PAGES' | 'MERCHANT_SETTINGS', payload: any): Promise<boolean> {
        OmnoraLogger.info("SYSTEM-INTEGRITY", `Committing state for: ${category}`);
        
        try {
            const updatedAt = new Date().toISOString();
            let error;

            if (category === 'STORE_PAGES') {
                const { id, nodes } = payload;
                ({ error } = await supabase
                    .from('store_pages')
                    .update({
                        ast_manifest: nodes,
                        updated_at: updatedAt
                    })
                    .eq('id', id));
            } else if (category === 'MERCHANT_SETTINGS') {
                const { id, display_name, metadata } = payload;
                ({ error } = await supabase
                    .from('merchants')
                    .update({
                        display_name,
                        metadata
                    })
                    .eq('id', id));
            }

            if (error) throw error;

            OmnoraLogger.integrity("KERNEL", `State committal successful: ${category}`);
            return true;
        } catch (error) {
            OmnoraLogger.error("KERNEL", `State committal failed: ${category}`);
            console.error(error);
            return false;
        }
    }

    /**
     * readSystemState: Standardized protocol for retrieving system state from the authority.
     */
    public async readSystemState(category: 'STORE_PAGES' | 'MERCHANT_SETTINGS', id: string): Promise<{ data: any, error: any }> {
        OmnoraLogger.info("KERNEL", `Reading system state: ${category} [${id}]`);
        
        if (category === 'STORE_PAGES') {
            return await supabase
                .from('store_pages')
                .select('updated_at, ast_manifest')
                .eq('id', id)
                .single();
        } else if (category === 'MERCHANT_SETTINGS') {
            return await supabase
                .from('merchants')
                .select('id, display_name, custom_domain, metadata')
                .eq('id', id)
                .single();
        }

        return { data: null, error: new Error(`Unknown category: ${category}`) };
    }

    /**
     * hydrate: Hydrate and repair the raw component tree before React mounts it
     */
    public async hydrate(storeManifest: any, merchantId?: string): Promise<any> {
        if (!storeManifest) return null;

        let ast = Array.isArray(storeManifest) ? {
            manifest_version: '1.0.0',
            merchant_id: merchantId,
            blocks: storeManifest
        } : { ...storeManifest, merchant_id: merchantId || storeManifest.merchant_id };

        await this.fetchKernelPatch();

        // Migration Pipe
        if (this.compareVersions(ast.manifest_version || '1.0.0', CURRENT_KERNEL_VERSION) < 0) {
            ast = runMigrations(ast);
            ast.manifest_version = CURRENT_KERNEL_VERSION;
            this.logUpgrade(ast.merchant_id, ast.manifest_version);
        }

        if (ast && Array.isArray(ast.blocks)) {
            ast.blocks = this.sanitizeBlocks(ast.blocks);
        }

        return ast;
    }

    private sanitizeBlocks(blocks: any[]): any[] {
        return blocks.map(block => {
            const schema = DEFAULT_PROPS[block.type];
            if (!schema || !schema.defaultProps) return block;
            const healedProps = { ...schema.defaultProps };
            Object.keys(block.props || {}).forEach(key => {
                const userVal = block.props[key];
                if (userVal !== undefined) healedProps[key] = userVal;
            });
            return { ...block, props: healedProps };
        });
    }

    public async fetchKernelPatch() {
        if (this.emergencyPatches !== null) return;
        try {
            const { data } = await supabase
                .from('system_updates')
                .select('*')
                .eq('active', true)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
            this.emergencyPatches = data || false;
        } catch (e) {
            this.emergencyPatches = false;
        }
    }

    private async logUpgrade(merchantId: string | undefined, version: string) {
        if (!merchantId) return;
        try {
            await supabase.from('system_logs').insert({
                level: 'INFO',
                event: 'KERNEL_UPGRADE',
                details: { merchant_id: merchantId, upgraded_to: version }
            });
            OmnoraLogger.info("KERNEL", `Store ${merchantId} natively upgraded to v${version}`);
        } catch (e) {}
    }

    private compareVersions(v1: string, v2: string): number {
        const p1 = v1.split('.').map(Number);
        const p2 = v2.split('.').map(Number);
        for (let i = 0; i < 3; i++) {
            if ((p1[i] || 0) > (p2[i] || 0)) return 1;
            if ((p1[i] || 0) < (p2[i] || 0)) return -1;
        }
        return 0;
    }

    /**
     * syncKernel: Synchronizes the local entity registry with the remote authority.
     */
    public async syncKernel(): Promise<void> {
        OmnoraLogger.info("KERNEL", "Initiating synchronization protocol...");
        await this.fetchKernelPatch();
        OmnoraLogger.integrity("KERNEL", "Kernel synchronization finalized.");
    }
}

export const Kernel = OmnoraKernel.getInstance();
