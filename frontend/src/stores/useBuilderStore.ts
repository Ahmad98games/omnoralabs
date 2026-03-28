import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { produce, enablePatches, applyPatches, Patch } from 'immer';

enablePatches();

// --- Types ---

export interface BuilderNode {
    id: string;
    type: string;
    props: Record<string, any>;
    parentId: string | null;
    children: string[];
    styles: Record<string, any>;
    schemaVersion: number;
    createdAt: string;
}

export interface PageMetadata {
    id: string;
    title: string;
    slug: string;
    status: 'draft' | 'live';
    type: 'system' | 'template' | 'custom';
    lastUpdated: string;
    createdAt: string;
    seoMeta: { title: string; description: string };
}

export interface ThemeSettings {
    colors: {
        primary: string;
        secondary: string;
        background: string;
        surface: string;
        text: string;
        textMuted: string;
        border: string;
    };
    typography: {
        headingFont: string;
        bodyFont: string;
        baseSize: number;
        bodyFontWeight?: number;
    };
    layout: {
        maxWidth: number;
        borderRadius: number;
        buttonRadius: number;
    };
}

interface Command {
    undo: Patch[];
    redo: Patch[];
}

export interface BuilderState {
    // 🧱 KERNEL STATE
    nodes: Record<string, BuilderNode[]>;
    pages: Record<string, PageMetadata>;
    nodePageIndex: Record<string, string>; // O(1) Reverse Lookup: nodeId -> pageId
    
    activePageId: string;
    lastValidPageId: string | null;
    selectedNodeId: string | null;
    lastDroppedNodeId: string | null;
    
    // 🚥 STATUS
    isDragging: boolean;
    isHydrating: boolean;
    isSidebarOpen: boolean;
    saveStatus: 'idle' | 'saving' | 'saved' | 'error';
    hasUnsavedChanges: boolean;
    publishStatus: 'idle' | 'publishing' | 'success' | 'error';
    publishError: string | null;
    lastPublishedAt: string | null;
    isPreviewMode: boolean;
    previewDevice: 'desktop' | 'tablet' | 'mobile';

    // 🎨 THEME
    themeSettings: ThemeSettings;

    // 🕒 HISTORY
    historyStack: Command[];
    historyIndex: number;

    // ⚡ ACTIONS
    // Page Management
    addPage: (title: string, type?: PageMetadata['type']) => void;
    deletePage: (pageId: string) => void;
    duplicatePage: (pageId: string) => void;
    reorderPages: (fromIndex: number, toIndex: number) => void;
    setActivePageId: (id: string) => void;

    // Node Management
    addNode: (node: BuilderNode) => void;
    deleteNode: (nodeId: string) => void;
    duplicateNode: (nodeId: string) => void;
    moveNode: (nodeId: string, direction: 'up' | 'down') => void;
    reorderNodes: (fromIndex: number, toIndex: number) => void;
    updateNodeProperty: (nodeId: string, path: string, value: any) => void;
    
    // UI & Status
    setSelectedNodeId: (id: string | null) => void;
    setIsPreviewMode: (val: boolean) => void;
    setPreviewDevice: (device: BuilderState['previewDevice']) => void;
    setSidebarOpen: (val: boolean) => void;
    setIsHydrating: (val: boolean) => void;
    
    // Theme & History
    updateTheme: (path: string, value: any) => void;
    undo: () => void;
    redo: () => void;
    resetPageNodes: (pageId: string) => void;
}

const DEFAULT_THEME: ThemeSettings = {
    colors: {
        primary: '#FFFFFF',
        secondary: '#A1A1AA',
        background: '#000000',
        surface: '#050505',
        text: '#FFFFFF',
        textMuted: 'rgba(255, 255, 255, 0.5)',
        border: 'rgba(255, 255, 255, 0.1)',
    },
    typography: {
        headingFont: 'Inter',
        bodyFont: 'Inter',
        baseSize: 16,
    },
    layout: {
        maxWidth: 1280,
        borderRadius: 0,
        buttonRadius: 0,
    },
};

const generateSlug = (title: string, existingSlugs: string[]) => {
    let slug = title.toLowerCase().trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    
    if (!slug) slug = 'untitled';
    
    let finalSlug = slug;
    let counter = 2;
    while (existingSlugs.includes(finalSlug)) {
        finalSlug = `${slug}-${counter}`;
        counter++;
    }
    return finalSlug;
};

export const useBuilderStore = create<BuilderState>()(
    persist(
        (set, get) => ({
            nodes: {},
            pages: {},
            nodePageIndex: {},
            activePageId: '',
            lastValidPageId: null,
            selectedNodeId: null,
            lastDroppedNodeId: null,
            isDragging: false,
            isHydrating: true,
            isSidebarOpen: true,
            saveStatus: 'idle',
            hasUnsavedChanges: false,
            publishStatus: 'idle',
            publishError: null,
            lastPublishedAt: null,
            isPreviewMode: false,
            previewDevice: 'desktop',
            themeSettings: DEFAULT_THEME,
            historyStack: [],
            historyIndex: -1,

            // --- HELPER: Execute Command with History ---
            _execute: (fn: (draft: BuilderState) => void) => {
                const state = get();
                const next = produce(state, (draft) => {
                    fn(draft);
                    draft.hasUnsavedChanges = true;
                }, (patches, inversePatches) => {
                    // History Tracking
                    const newStack = state.historyStack.slice(0, state.historyIndex + 1);
                    newStack.push({ undo: inversePatches, redo: patches });
                    if (newStack.length > 50) newStack.shift();
                    
                    set({ 
                        historyStack: newStack, 
                        historyIndex: newStack.length - 1 
                    });
                });
                set(next);
            },

            // --- PAGE ACTIONS ---
            addPage: (title, type = 'custom') => {
                const id = crypto.randomUUID();
                const existingSlugs = Object.values(get().pages).map(p => p.slug);
                const slug = generateSlug(title, existingSlugs);

                set(produce((draft: BuilderState) => {
                    draft.nodes[id] = [];
                    draft.pages[id] = {
                        id, title, slug, type,
                        status: 'draft',
                        createdAt: new Date().toISOString(),
                        lastUpdated: new Date().toISOString(),
                        seoMeta: { title: '', description: '' },
                    };
                    draft.lastValidPageId = draft.activePageId;
                    draft.isHydrating = false;
                    draft.activePageId = id;
                    draft.hasUnsavedChanges = true;
                }));
            },

            deletePage: (pageId) => {
                const state = get();
                const pageCount = Object.keys(state.pages).length;
                const page = state.pages[pageId];

                if (pageCount <= 1) return;
                if (page?.type === 'system') return;

                set(produce((draft: BuilderState) => {
                    delete draft.nodes[pageId];
                    delete draft.pages[pageId];
                    
                    // Cleanup index
                    Object.keys(draft.nodePageIndex).forEach(nodeId => {
                        if (draft.nodePageIndex[nodeId] === pageId) delete draft.nodePageIndex[nodeId];
                    });

                    if (draft.activePageId === pageId) {
                        draft.activePageId = draft.lastValidPageId || Object.keys(draft.pages)[0];
                    }
                    draft.hasUnsavedChanges = true;
                }));
            },

            duplicatePage: (pageId) => {
                const state = get();
                const originalPage = state.pages[pageId];
                const originalNodes = state.nodes[pageId] || [];
                if (!originalPage) return;

                const newId = crypto.randomUUID();
                const existingSlugs = Object.values(state.pages).map(p => p.slug);
                const newSlug = generateSlug(`${originalPage.title} (Copy)`, existingSlugs);

                set(produce((draft: BuilderState) => {
                    draft.pages[newId] = {
                        ...originalPage,
                        id: newId,
                        title: `${originalPage.title} (Copy)`,
                        slug: newSlug,
                        createdAt: new Date().toISOString()
                    };
                    
                    const newNodes = originalNodes.map(node => {
                        const newNodeId = crypto.randomUUID();
                        draft.nodePageIndex[newNodeId] = newId;
                        return { ...node, id: newNodeId };
                    });
                    
                    draft.nodes[newId] = newNodes;
                    draft.hasUnsavedChanges = true;
                    // Note: Task says NOT to set as active page
                }));
            },

            reorderPages: (from, to) => {
                // Reordering keys in a JS object is not strictly preserved, 
                // but we can manage a 'pageOrder' array if needed.
                // For now, we'll assume the list is derived and we just mark change.
                set({ hasUnsavedChanges: true }); 
            },

            setActivePageId: (id) => set({ activePageId: id, selectedNodeId: null }),

            // --- NODE ACTIONS ---
            addNode: (node) => {
                const activeId = get().activePageId;
                if (!activeId) return;

                set(produce((draft: BuilderState) => {
                    draft.nodes[activeId].push(node);
                    draft.nodePageIndex[node.id] = activeId;
                    draft.lastDroppedNodeId = node.id;
                    draft.hasUnsavedChanges = true;
                }));

                setTimeout(() => {
                    set({ lastDroppedNodeId: null });
                }, 400);
            },

            deleteNode: (nodeId) => {
                const state = get();
                const pageId = state.nodePageIndex[nodeId];
                if (!pageId) return;

                set(produce((draft: BuilderState) => {
                    draft.nodes[pageId] = draft.nodes[pageId].filter(n => n.id !== nodeId);
                    delete draft.nodePageIndex[nodeId];
                    if (draft.selectedNodeId === nodeId) draft.selectedNodeId = null;
                    draft.hasUnsavedChanges = true;
                }));
            },

            duplicateNode: (nodeId) => {
                const state = get();
                const pageId = state.nodePageIndex[nodeId];
                const nodes = state.nodes[pageId];
                const idx = nodes?.findIndex(n => n.id === nodeId);
                if (idx === -1 || idx === undefined) return;

                const newNode = { 
                    ...nodes[idx], 
                    id: crypto.randomUUID(), 
                    createdAt: new Date().toISOString() 
                };

                set(produce((draft: BuilderState) => {
                    draft.nodes[pageId].splice(idx + 1, 0, newNode);
                    draft.nodePageIndex[newNode.id] = pageId;
                    draft.hasUnsavedChanges = true;
                }));
            },

            moveNode: (nodeId, direction) => {
                const state = get();
                const pageId = state.nodePageIndex[nodeId];
                const nodes = [...(state.nodes[pageId] || [])];
                const idx = nodes.findIndex(n => n.id === nodeId);

                if (idx === -1) return;
                if (direction === 'up' && idx === 0) return;
                if (direction === 'down' && idx === nodes.length - 1) return;

                const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
                [nodes[idx], nodes[targetIdx]] = [nodes[targetIdx], nodes[idx]];

                set(produce((draft: BuilderState) => {
                    draft.nodes[pageId] = nodes;
                    draft.hasUnsavedChanges = true;
                }));
            },

            reorderNodes: (from, to) => {
                const activeId = get().activePageId;
                set(produce((draft: BuilderState) => {
                    const pageNodes = draft.nodes[activeId];
                    const [moved] = pageNodes.splice(from, 1);
                    pageNodes.splice(to, 0, moved);
                    draft.hasUnsavedChanges = true;
                }));
            },

            updateNodeProperty: (nodeId, path, value) => {
                const state = get();
                const pageId = state.nodePageIndex[nodeId];
                if (!pageId) return;

                set(produce((draft: BuilderState) => {
                    const nodes = draft.nodes[pageId];
                    const node = nodes.find(n => n.id === nodeId);
                    if (!node) return;

                    const keys = path.split('.');
                    let current: any = node.props;
                    const actualKeys = keys[0] === 'props' ? keys.slice(1) : keys;
                    
                    for (let i = 0; i < actualKeys.length - 1; i++) {
                        if (current[actualKeys[i]] === undefined) current[actualKeys[i]] = {};
                        current = current[actualKeys[i]];
                    }
                    current[actualKeys[actualKeys.length - 1]] = value;
                    draft.hasUnsavedChanges = true;
                }));
            },

            // --- UI & THEME ---
            setSelectedNodeId: (id) => set({ selectedNodeId: id }),
            setIsPreviewMode: (val) => set({ isPreviewMode: val }),
            setPreviewDevice: (device) => set({ previewDevice: device }),
            setSidebarOpen: (val) => set({ isSidebarOpen: val }),
            setIsHydrating: (val) => set({ isHydrating: val }),

            updateTheme: (path, value) => set(produce((draft: BuilderState) => {
                const keys = path.split('.');
                let current: any = draft.themeSettings;
                for (let i = 0; i < keys.length - 1; i++) {
                    current = current[keys[i]];
                }
                current[keys[keys.length - 1]] = value;
                draft.hasUnsavedChanges = true;
            })),

            undo: () => {
                const { historyIndex, historyStack } = get();
                if (historyIndex < 0) return;

                set(produce((draft: BuilderState) => {
                    applyPatches(draft, historyStack[historyIndex].undo);
                    draft.historyIndex -= 1;
                }));
            },

            redo: () => {
                const { historyIndex, historyStack } = get();
                if (historyIndex >= historyStack.length - 1) return;

                set(produce((draft: BuilderState) => {
                    applyPatches(draft, historyStack[historyIndex + 1].redo);
                    draft.historyIndex += 1;
                }));
            },

            resetPageNodes: (pageId) => set(produce((draft: BuilderState) => {
                draft.nodes[pageId] = [];
                // Cleanup index for nodes that were in this page
                Object.keys(draft.nodePageIndex).forEach(nid => {
                    if (draft.nodePageIndex[nid] === pageId) delete draft.nodePageIndex[nid];
                });
            })),
        }),
        {
            name: 'omnora-builder-storage',
            skipHydration: true,
            onRehydrateStorage: () => (state, error) => {
                if (error) {
                    state?.resetPageNodes(state.activePageId); // Fallback: try to clear active
                    return;
                }
                state?.setIsHydrating(false);
            }
        }
    )
);
