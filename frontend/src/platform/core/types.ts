import React from 'react';

/**
 * PlatformBlock: The fundamental unit of the Omnora runtime.
 * This is a pure data structure, agnostic of the editor.
 */
export interface PlatformBlock {
    id: string;
    type: string;
    parentId: string | null;
    props: Record<string, unknown>;
    styles: React.CSSProperties;
    children: string[]; // Standardized to non-optional for renderer stability
    schemaVersion: number; // Added for v3 resilience
    responsive?: {
        base?: React.CSSProperties;
        md?: React.CSSProperties;
        sm?: React.CSSProperties;
        desktop?: React.CSSProperties;
        tablet?: React.CSSProperties;
        mobile?: React.CSSProperties;
    };

    // Optional metadata preserved for runtime logic
    binding?: string;    // Data binding path (e.g. "product.price")
    motion?: {
        preset?: string;
        duration?: number;
        curve?: string;
    };
    interactions?: {
        hover?: React.CSSProperties;
        active?: React.CSSProperties;
    };
    hidden?: {
        desktop?: boolean;
        tablet?: boolean;
        mobile?: boolean;
    };
    forcedState?: 'hover' | 'active' | null;

    // ─── Phase 12: Animations & Symbols ───
    animations?: {
        type: 'fadeIn' | 'slideUp' | 'zoomIn' | 'blurReveal' | 'none';
        duration: number;  // ms
        delay: number;     // ms
        once: boolean;     // trigger only once per scroll
    };
    symbolId?: string;
    animationPreviewKey?: number; // ephemeral — triggers re-play in builder

    // ─── v5 Semantic Metadata (AI-Native Schema) ───
    semanticRole?: 'primary-conversion-point' | 'trust-builder' | 'navigation-anchor' | 'content-body' | 'discovery-tool';
    intent?: 'urgency' | 'social-proof' | 'clarity' | 'scarcity' | 'brand-story';
    deviceSensitivity?: 'desktop-only' | 'mobile-only';
}

/**
 * PlatformRegistryNode: The shape expected by the Component Registry.
 */
export interface PlatformRegistryNode {
    nodeId: string;
    props: Record<string, unknown>;
    children?: React.ReactNode;
}

/**
 * PlatformContextValue: The minimal runtime state required to render.
 */
export interface PlatformContextValue {
    mode: 'production' | 'preview' | 'edit';
    viewport: 'desktop' | 'tablet' | 'mobile';
    nodes: Record<string, PlatformBlock>;
    adjacencyMap: Record<string, string[]>; // Precomputed for performance
}

// ─── Phase 15: Universal Hardening (Batch 3) ───

export interface CopilotAction {
    action: 'addNode' | 'updateNode' | 'removeNode' | 'updateProps' | 'updateStyle';
    type?: string;
    id?: string;
    props?: Record<string, unknown>;
}

export interface MinifiedStoreState {
    time: string;
    metrics: {
        rev_7d: number;
        orders_7d: number;
        capi_fidelity: number;
        wallet_days: number;
    };
    alerts: {
        low_stock: Array<{ item: string; stock: number }>;
    };
}

export interface KernelPatch {
    id: string;
    active: boolean;
    version_target: string;
    // OSTT FIX: Replaced any with unknown
    patch_data: Record<string, unknown>;
}

export interface StorePagePayload {
    id: string;
    nodes: Record<string, PlatformBlock>;
}

export interface MerchantSettingsPayload {
    id: string;
    display_name: string;
    // OSTT FIX: Replaced any with unknown
    metadata: Record<string, unknown>;
}