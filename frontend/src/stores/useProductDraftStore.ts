/**
 * useProductDraftStore.ts — Zustand Atomic State for Product Editor
 * * Refactored for Operation Surgical Treatment of Tech (OSTT)
 * Fix: Removed unused 'file' variable in partialize to satisfy ESLint.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ─── Strict Type Definitions ────────────────────────────────────────────────

export interface VariantDraft {
    readonly id: string;
    optionName: string;   // e.g. 'Size', 'Color'
    optionValue: string;  // e.g. 'M', 'Black'
    price: number;
    compareAtPrice: number;
    sku: string;
    available: boolean;
}

export interface MediaQueueItem {
    readonly id: string;
    file: File;
    previewUrl: string;
    status: 'pending' | 'uploading' | 'done' | 'error';
    publicUrl?: string;
    error?: string;
}

export interface ProductDraftState {
    title: string;
    description: string;
    basePrice: number;
    compareAtPrice: number;
    tags: string;
    vendor: string;
    productType: string;
    mediaQueue: MediaQueueItem[];
    featuredImageUrl: string;
    variants: VariantDraft[];
    merchantId: string | null;
    isDirty: boolean;
}

export interface ProductDraftActions {
    setField: <K extends keyof ProductDraftState>(key: K, value: ProductDraftState[K]) => void;
    setMerchantId: (id: string) => void;
    addToMediaQueue: (item: MediaQueueItem) => void;
    updateMediaStatus: (id: string, status: MediaQueueItem['status'], publicUrl?: string, error?: string) => void;
    removeFromMediaQueue: (id: string) => void;
    setFeaturedImage: (url: string) => void;
    addVariant: () => void;
    updateVariant: (id: string, patch: Partial<Omit<VariantDraft, 'id'>>) => void;
    removeVariant: (id: string) => void;
    resetDraft: () => void;
    markClean: () => void;
}

// ─── Initial State ──────────────────────────────────────────────────────────

const INITIAL_STATE: ProductDraftState = {
    title: '',
    description: '',
    basePrice: 0,
    compareAtPrice: 0,
    tags: '',
    vendor: '',
    productType: '',
    mediaQueue: [],
    featuredImageUrl: '',
    variants: [],
    merchantId: null,
    isDirty: false,
};

const generateId = (): string =>
    `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

// ─── Store Implementation ───────────────────────────────────────────────────

export const useProductDraftStore = create<ProductDraftState & ProductDraftActions>()(
    persist(
        (set) => ({
            ...INITIAL_STATE,

            setField: (key, value) =>
                set((state) => {
                    if (state[key] === value) return state;
                    return { [key]: value, isDirty: true } as Partial<ProductDraftState>;
                }),

            setMerchantId: (id) => set({ merchantId: id }),

            addToMediaQueue: (item) =>
                set((state) => ({
                    mediaQueue: [...state.mediaQueue, item],
                    isDirty: true,
                })),

            updateMediaStatus: (id, status, publicUrl, error) =>
                set((state) => ({
                    mediaQueue: state.mediaQueue.map((m) =>
                        m.id === id ? { ...m, status, publicUrl, error } : m
                    ),
                })),

            removeFromMediaQueue: (id) =>
                set((state) => ({
                    mediaQueue: state.mediaQueue.filter((m) => m.id !== id),
                    isDirty: true,
                })),

            setFeaturedImage: (url) => set({ featuredImageUrl: url, isDirty: true }),

            addVariant: () =>
                set((state) => ({
                    variants: [
                        ...state.variants,
                        {
                            id: generateId(),
                            optionName: '',
                            optionValue: '',
                            price: state.basePrice,
                            compareAtPrice: state.compareAtPrice,
                            sku: '',
                            available: true,
                        },
                    ],
                    isDirty: true,
                })),

            updateVariant: (id, patch) =>
                set((state) => ({
                    variants: state.variants.map((v) =>
                        v.id === id ? { ...v, ...patch } : v
                    ),
                    isDirty: true,
                })),

            removeVariant: (id) =>
                set((state) => ({
                    variants: state.variants.filter((v) => v.id !== id),
                    isDirty: true,
                })),

            resetDraft: () => set({ ...INITIAL_STATE }),

            markClean: () => set({ isDirty: false }),
        }),
        {
            name: 'omnora-product-draft',
            storage: createJSONStorage(() => sessionStorage),
            // Logic: Exclude non-serializable File objects to keep storage clean
            partialize: (state) => ({
                ...state,
                mediaQueue: state.mediaQueue.map((item) => ({
                    ...item,
                    file: null as unknown as File, // Fixed: Overwriting 'file' directly instead of unused destructuring
                })),
            }),
        }
    )
);