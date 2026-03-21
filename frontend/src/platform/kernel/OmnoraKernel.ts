import { supabase } from '../../lib/supabaseClient';
import { DEFAULT_PROPS } from '../../components/cms/ComponentRegistry';
import { runMigrations } from './MigrationScript';

export const CURRENT_KERNEL_VERSION = '2.1.0';

export class OmnoraKernel {
    private static instance: OmnoraKernel;
    
    // Remote config cache
    private emergencyPatches: any = null;

    private constructor() {}

    public static getInstance(): OmnoraKernel {
        if (!OmnoraKernel.instance) {
            OmnoraKernel.instance = new OmnoraKernel();
        }
        return OmnoraKernel.instance;
    }

    /**
     * Hydrate and repair the raw component tree before React mounts it
     */
    public async hydrate(storeManifest: any, merchantId?: string): Promise<any> {
        if (!storeManifest) return null;

        let ast = Array.isArray(storeManifest) ? {
            manifest_version: '1.0.0', // Legacy assumption if just passing an array
            merchant_id: merchantId,
            blocks: storeManifest
        } : { ...storeManifest, merchant_id: merchantId || storeManifest.merchant_id };

        // 1. Fetch Remote Patches
        await this.fetchKernelPatch();

        // 2. Migration Pipe -> Mutates legacy AST to latest spec
        if (this.compareVersions(ast.manifest_version || '1.0.0', CURRENT_KERNEL_VERSION) < 0) {
            ast = runMigrations(ast);
            ast.manifest_version = CURRENT_KERNEL_VERSION;
            this.logUpgrade(ast.merchant_id, ast.manifest_version);
        }

        // 3. Sanitizer (Self-Heal Missing Props)
        if (ast && Array.isArray(ast.blocks)) {
            ast.blocks = this.sanitizeBlocks(ast.blocks);
        }

        // Apply emergency remote config logic if necessary (e.g. forced CSS/classes)
        if (this.emergencyPatches) {
            console.log('[OmnoraKernel] Active Emergency Patches applied server-side.');
        }

        return ast; // Return the fully healed struct
    }

    private sanitizeBlocks(blocks: any[]): any[] {
        return blocks.map(block => {
            const schema = DEFAULT_PROPS[block.type];
            if (!schema || !schema.defaultProps) return block;

            // Deep clone default props
            const healedProps = { ...schema.defaultProps };
            
            // Loop over what the user has saved, overwrite if valid
            Object.keys(block.props || {}).forEach(key => {
                const userVal = block.props[key];
                if (userVal !== undefined) {
                    healedProps[key] = userVal;
                }
            });

            return {
                ...block,
                props: healedProps
            };
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
            console.log(`[OmnoraKernel] Store ${merchantId} natively upgraded to v${version}`);
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
}
