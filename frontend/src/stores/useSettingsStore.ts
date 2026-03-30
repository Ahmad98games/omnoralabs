import { create } from 'zustand';
import { Kernel } from '../lib/kernel/Kernel';
import { OmnoraLogger } from '../lib/kernel/utils/logger';

export interface MerchantMetadata {
    store_name?: string;
    store_description?: string;
    store_category?: string;
    phone_number?: string;
    currency?: string;
    locale?: string;
    logo?: string | null;
    favicon?: string | null;
    fb_pixel_id?: string;
    tt_pixel_id?: string;
    // FIX: Replaced any with a safe JSON-serializable type
    [key: string]: string | number | boolean | undefined | null;
}

export interface MerchantSettings {
    id: string;
    display_name: string;
    custom_domain: string | null;
    metadata: MerchantMetadata;
}

interface SettingsState {
    settings: MerchantSettings | null;
    loading: boolean;
    saving: boolean;
    error: string | null;
    loadSettings: (userId: string) => Promise<void>;
    updateSettings: (userId: string, updates: { display_name?: string; metadata: MerchantMetadata }) => Promise<boolean>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
    settings: null,
    loading: false,
    saving: false,
    error: null,

    loadSettings: async (userId: string) => {
        set({ loading: true, error: null });

        const timeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Settings load timed out (8s)')), 8000)
        );

        try {
            // FIX: Explicitly typed the Kernel result
            const result = await Promise.race([
                Kernel.readSystemState('MERCHANT_SETTINGS', userId),
                timeout
            ]) as { data: MerchantSettings | null; error: { message: string } | null };

            const { data, error } = result;

            if (error) throw error;
            if (!data) throw new Error('No merchant record found');
            
            set({ 
                settings: {
                    ...data,
                    metadata: data.metadata || {}
                }, 
                loading: false 
            });
            OmnoraLogger.info("SETTINGS", "Merchant settings loaded successfully via Kernel.");
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            OmnoraLogger.error("SETTINGS", `Failed to load settings: ${errorMessage}`);
            set({ 
                settings: {
                    id: userId,
                    display_name: '',
                    custom_domain: null,
                    metadata: {}
                },
                error: errorMessage, 
                loading: false 
            });
        }
    },

    updateSettings: async (userId: string, updates: { display_name?: string; metadata: MerchantMetadata }) => {
        const previousSettings = get().settings;
        if (!previousSettings) return false;

        const newSettings = {
            ...previousSettings,
            display_name: updates.display_name !== undefined ? updates.display_name : previousSettings.display_name,
            metadata: {
                ...previousSettings.metadata,
                ...updates.metadata
            }
        };

        set({ settings: newSettings, saving: true, error: null });

        try {
            const success = await Kernel.commitSystemState('MERCHANT_SETTINGS', {
                id: userId,
                display_name: newSettings.display_name,
                metadata: newSettings.metadata
            });

            if (!success) throw new Error("Kernel state committal failed.");

            set({ saving: false });
            return true;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Update failed';
            OmnoraLogger.error("SETTINGS", `Update failed: ${errorMessage}`);
            set({ settings: previousSettings, saving: false, error: errorMessage });
            return false;
        }
    }
}));