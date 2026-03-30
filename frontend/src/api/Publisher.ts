import { supabase } from '../lib/supabaseClient';
import { useBuilderStore } from '../stores/useBuilderStore';

// OSTT FIX: Strongly typed interface replacing any
interface MinimalNode {
    id?: string;
    type?: string;
    [key: string]: unknown;
}

/**
 * 🚀 OMNORA PUBLISHER (Task 3.4)
 * Atomic Pipeline: Validate -> Diff -> Compile -> Upload.
 * OSTT Refactored: Removed 'any' from catch blocks and validation loop.
 */
export class Publisher {
    private static isLocked = false;

    static async publishSite() {
        if (this.isLocked) throw new Error('Publishing already in progress');
        this.isLocked = true;

        const store = useBuilderStore.getState();
        store.setPublishStatus('publishing');

        try {
            // 1. Validate (Industrial Rule)
            // OSTT FIX: Using unknown typecast before MinimalNode[] cast to prevent typescript signature mismatch
            this.validateManifest((store.nodes as unknown) as Record<string, MinimalNode[]>);

            // 2. Compile Manifest
            const manifest = {
                pages: store.pages,
                nodes: store.nodes,
                themeSettings: store.themeSettings,
                publishedAt: new Date().toISOString(),
                version: '2.0.0'
            };

            const manifestString = JSON.stringify(manifest);
            const merchantId = store.merchantId;

            // OSTT FIX: Safely assert merchantId exists
            if (!merchantId) throw new Error('Merchant ID is missing from state.');

            // 3. Upload to Supabase Storage (Industrial Rule)
            const { error: uploadError } = await supabase.storage
                .from('manifests')
                .upload(`${merchantId}/manifest.json`, manifestString, {
                    upsert: true,
                    contentType: 'application/json'
                });

            if (uploadError) throw uploadError;

            // 4. Update Merchant Table
            const { error: dbError } = await supabase
                .from('merchants')
                .update({ 
                    last_published_at: manifest.publishedAt,
                    published_manifest_url: `${merchantId}/manifest.json`
                })
                .eq('id', merchantId);

            if (dbError) throw dbError;

            // 5. Success State
            store.setPublishStatus('success');
            setTimeout(() => store.setPublishStatus('idle'), 3000);

        } catch (err) {
            console.error('[Publisher] Failure:', err instanceof Error ? err.message : String(err));
            store.setPublishStatus('error');
        } finally {
            this.isLocked = false;
        }
    }

    /**
     * 🛡️ AUTOSAVE (Task 3.4)
     * Debounced background save to draft_content.
     */
    static async autosave() {
        if (this.isLocked) return;
        
        const store = useBuilderStore.getState();
        const merchantId = store.merchantId;

        // OSTT FIX: Safely assert merchantId
        if (!merchantId) return;

        const draft = {
            nodes: store.nodes,
            pages: store.pages,
            themeSettings: store.themeSettings,
            timestamp: new Date().toISOString()
        };

        const { error } = await supabase
            .from('merchants')
            .update({ draft_content: draft })
            .eq('id', merchantId);

        if (error) console.warn('[Autosave] Failed:', error.message);
    }

    private static validateManifest(nodes: Record<string, MinimalNode[]>) {
        // Ensure every node type is known (Industrial Rule)
        Object.values(nodes).flat().forEach(node => {
            if (!node.type) throw new Error(`Invalid Node found: ${node.id}`);
        });
    }
}