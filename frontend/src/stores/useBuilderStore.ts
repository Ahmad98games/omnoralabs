/**
 * 🛠️ OMNORA LABS | [BUILDER STORE]
 * ---------------------------------------------------------
 * Principal Architect: Ahmad Mahboob (@ahmad-labs)
 * Division: Universal Commerce OS / Kernel Core
 * "Precision is the foundation of industrial scale."
 * ---------------------------------------------------------
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import { produceWithPatches, applyPatches, enablePatches, Patch } from 'immer';
import type { BuilderNode, PageMetadata } from '../context/BuilderContext';
import { SyncManager } from './SyncManager';
import { OmnoraLogger } from '../lib/kernel/utils/logger';
import { NewPageInitializer } from '../lib/kernel/utils/NewPageInitializer';

// Enable Immer Patches for Undo/Redo
enablePatches();


export interface Command {
    undo: Patch[];
    redo: Patch[];
}

export interface BuilderState {
    // Data
    nodes: Record<string, BuilderNode>;
    pages: Record<string, PageMetadata>;
    activePageId: string;
    selectedNodeId: string | null;
    lastDroppedNodeId: string | null;

    // Status
    saveStatus: 'idle' | 'saving' | 'saved' | 'error' | 'offline';
    hasUnsavedChanges: boolean;
    lastUpdatedRemote: string | null;

    // 🚀 Publish Hardening State
    publishStatus: 'idle' | 'publishing' | 'success' | 'error';
    publishError: string | null;
    lastPublishedAt: string | null;

    // 👁️ Live Preview State
    isPreviewMode: boolean;
    previewDevice: 'desktop' | 'tablet' | 'mobile';

    // History (Max 50)
    historyStack: Command[];
    historyIndex: number;

    // Drag Tracking
    isDragging: boolean;
    setIsDragging: (val: boolean) => void;

    // Hydration stability
    isHydrating: boolean;
    setIsHydrating: (val: boolean) => void;

    // Sidebar states
    isSidebarOpen: boolean;
    setSidebarOpen: (val: boolean) => void;

    // Actions
    setNodes: (nodes: Record<string, BuilderNode>) => void;
    updateNode: (id: string, path: string, value: any) => void;
    addNode: (node: BuilderNode) => void;
    deleteNode: (id: string) => void;
    
    setPages: (pages: Record<string, PageMetadata>) => void;
    addPage: (title: string, slug: string, type?: 'system' | 'template' | 'custom') => string;
    setActivePageId: (id: string) => void;
    setSelectedNodeId: (id: string | null) => void;
    resetPageNodes: (pageId: string) => void;
    
    setSaveStatus: (status: BuilderState['saveStatus']) => void;
    setHasUnsavedChanges: (has: boolean) => void;
    setLastUpdatedRemote: (time: string) => void;

    // 🚀 Publish Setters
    setPublishStatus: (status: BuilderState['publishStatus']) => void;
    setPublishError: (err: string | null) => void;
    setLastPublishedAt: (time: string | null) => void;

    // 👁️ Preview Setters
    setIsPreviewMode: (val: boolean) => void;
    setPreviewDevice: (device: BuilderState['previewDevice']) => void;

    // History Actions
    executeCommand: (action: (draft: Record<string, BuilderNode>) => void) => void;
    undo: () => void;
    redo: () => void;
    loadHistorySession: () => void;
}

const saveHistoryToSession = (stack: Command[], index: number) => {
    try {
        sessionStorage.setItem('omnora-builder-history', JSON.stringify({ stack, index }));
    } catch (e) { /* ignore quota exceed */ }
};

export const useBuilderStore = create<BuilderState>()(persist(immer((set, get) => ({
    nodes: {},
    pages: {},
    activePageId: '',
    selectedNodeId: null,
    lastDroppedNodeId: null,

    saveStatus: 'idle',
    hasUnsavedChanges: false,
    lastUpdatedRemote: null,

    publishStatus: 'idle',
    publishError: null,
    lastPublishedAt: null,

    isPreviewMode: false,
    previewDevice: 'desktop',

    historyStack: [],
    historyIndex: -1,
    isHydrating: false,
    isDragging: false,
    isSidebarOpen: true,

    setIsDragging: (val) => set((state) => { state.isDragging = val; }),
    setIsHydrating: (val) => set((state) => { state.isHydrating = val; }),
    setSidebarOpen: (val) => set((state) => { state.isSidebarOpen = val; }),

    setNodes: (nodes) => set((state) => {
        state.nodes = nodes;
        state.hasUnsavedChanges = true;
    }),

    /**
     * executeCommand: Wrapper that records changes as an atomic Immer-patch Command
     */
    executeCommand: (action) => {
        const state = get();
        
        // 1. Run the action through produceWithPatches
        const [nextNodes, redoPatches, undoPatches] = produceWithPatches(state.nodes, action);

        if (redoPatches.length === 0) return; // No change

        set((draft) => {
            draft.nodes = nextNodes;
            draft.hasUnsavedChanges = true;

            // 2. Truncate any "Redo" history if we made a new action
            const newStack = draft.historyStack.slice(0, draft.historyIndex + 1);
            newStack.push({ redo: redoPatches, undo: undoPatches });

            // 3. Cap limit at 50
            if (newStack.length > 50) newStack.shift();

            draft.historyStack = newStack;
            draft.historyIndex = newStack.length - 1;

            saveHistoryToSession(draft.historyStack, draft.historyIndex);
        });
    },

    updateNode: (id, path, value) => {
        get().executeCommand((draft) => {
            if (!draft[id]) return;
            const keys = path.split('.');
            let current = draft[id] as any;
            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) current[keys[i]] = {};
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
        });
    },

    addNode: (node) => {
        get().executeCommand((draft) => {
            draft[node.id] = node;
        });
    },

    deleteNode: (id) => {
        get().executeCommand((draft) => {
            delete draft[id];
        });
        set((state) => {
            if (state.selectedNodeId === id) {
                state.selectedNodeId = null;
            }
        });
    },

    setPages: (pages) => set((state) => { state.pages = pages; }),
    
    addPage: (title, slug, type = 'custom') => {
        const id = crypto.randomUUID();
        
        set((state: any) => {
            // Step 2 — Generate safe slug
            const existingSlugs = Object.values(state.pages).map((p: any) => p.slug);
            let baseSlug = (slug || title)
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
            
            if (!baseSlug) baseSlug = 'untitled';
            
            // Step 3 — Resolve slug collision
            let counter = 2;
            let finalSlug = baseSlug;
            while (existingSlugs.includes(finalSlug)) {
                finalSlug = `${baseSlug}-${counter}`;
                counter++;
            }
            
            // 3. Write nodes entry BEFORE switching activePageId
            state.nodes[id] = [] as any;
            
            // 4. Write page metadata
            state.pages[id] = {
                id,
                title: title.trim() || 'Untitled Page',
                slug: finalSlug,
                type,
                isLocked: type === 'system',
                status: 'draft',
                lastUpdated: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                seoMeta: { title: `${title.trim() || 'Untitled Page'} | Omnora`, description: '' }
            };
            
            // 5. Persist last valid page for error boundary recovery
            if (state.activePageId) {
                state.lastValidPageId = state.activePageId;
            }
            
            // 6. Clear hydrating flag
            state.isHydrating = false;
            
            // 7. Switch active page LAST — nodes[id] already exists
            state.activePageId = id;
            state.hasUnsavedChanges = true;
        });

        return id;
    },

    setActivePageId: (id) => set((state) => { state.activePageId = id; }),
    setSelectedNodeId: (id) => set((state) => { state.selectedNodeId = id; }),
    resetPageNodes: (pageId) => set((state) => {
        state.nodes[pageId] = [] as any;
        state.isHydrating = false;
    }),
    setSaveStatus: (status) => set((state) => { state.saveStatus = status; }),
    setHasUnsavedChanges: (has) => set((state) => { state.hasUnsavedChanges = has; }),
    setLastUpdatedRemote: (time) => set((state) => { state.lastUpdatedRemote = time; }),

    setPublishStatus: (status) => set((state) => { state.publishStatus = status; }),
    setPublishError: (err) => set((state) => { state.publishError = err; }),
    setLastPublishedAt: (time) => set((state) => { state.lastPublishedAt = time; }),

    setIsPreviewMode: (val) => set((state) => { state.isPreviewMode = val; }),
    setPreviewDevice: (device) => set((state) => { state.previewDevice = device; }),

    undo: () => {
        const { historyIndex, historyStack, nodes } = get();
        if (historyIndex < 0) return;

        SyncManager.pause(500); // Spec 4: pause sync updates on undo

        const command = historyStack[historyIndex];
        const prevNodes = applyPatches(nodes, command.undo);

        set((state) => {
            state.nodes = prevNodes;
            state.historyIndex -= 1;
            saveHistoryToSession(state.historyStack, state.historyIndex);
        });
    },

    redo: () => {
        const { historyIndex, historyStack, nodes } = get();
        if (historyIndex >= historyStack.length - 1) return;

        SyncManager.pause(500);

        const command = historyStack[historyIndex + 1];
        const nextNodes = applyPatches(nodes, command.redo);

        set((state) => {
            state.nodes = nextNodes;
            state.historyIndex += 1;
            saveHistoryToSession(state.historyStack, state.historyIndex);
        });
    },

    loadHistorySession: () => {
        try {
            const saved = sessionStorage.getItem('omnora-builder-history');
            if (saved) {
                const { stack, index } = JSON.parse(saved);
                set((state) => {
                    state.historyStack = stack || [];
                    state.historyIndex = index !== undefined ? index : -1;
                });
            }
        } catch (e) { /* ignore restore failures */ }
    }
})), {
    name: 'omnora-builder-storage',
    skipHydration: true, // 🛡️ Spec 4: skip automatic hydration
    onRehydrateStorage: () => (state) => {
        // Set isHydrating to true before rehydration starts
        if (state) {
            state.setIsHydrating(true);
        }

        return (state, error) => {
            if (error || !state || !state.nodes || Object.keys(state.nodes).length === 0) {
                OmnoraLogger.error('BUILDER-STORE', `Boot-Guard Triggered: Storage payload is null, empty, or corrupted. Wiping persist. ${error}`);
                
                if (state) {
                    // Reset to initial state logic
                    state.nodes = {};
                    state.pages = {}; 
                    state.activePageId = Kernel.getLastValidPageId();
                }
            }
            // Set isHydrating to false after rehydration finishes (or fails)
            if (state) {
                state.setIsHydrating(false);
            }
        };
    }
}));
