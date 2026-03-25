import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

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
    [key: string]: any;
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
        try {
            const { data, error } = await supabase
                .from('merchants')
                .select('id, display_name, custom_domain, metadata')
                .eq('id', userId)
                .single();

            if (error) throw error;
            
            set({ 
                settings: {
                    ...data,
                    metadata: data.metadata || {}
                }, 
                loading: false 
            });
        } catch (err: any) {
            set({ error: err.message || 'Failed to load settings', loading: false });
        }
    },

    updateSettings: async (userId: string, updates: { display_name?: string; metadata: MerchantMetadata }) => {
        const previousSettings = get().settings;
        if (!previousSettings) return false;

        // Optimistic Update
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
            const { error } = await supabase
                .from('merchants')
                .update({
                    display_name: newSettings.display_name,
                    metadata: newSettings.metadata
                })
                .eq('id', userId);

            if (error) throw error;

            set({ saving: false });
            return true;
        } catch (err: any) {
            // Rollback on failure
            set({ settings: previousSettings, saving: false, error: err.message || 'Update failed' });
            return false;
        }
    }
}));
