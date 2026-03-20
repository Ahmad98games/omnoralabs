import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { produceWithPatches, applyPatches, enablePatches, Patch } from 'immer';
import type { BuilderNode, PageMetadata } from '../context/BuilderContext';
import { SyncManager } from './SyncManager';

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
    
    // Status
    saveStatus: 'idle' | 'saving' | 'saved' | 'error' | 'offline';
    hasUnsavedChanges: boolean;
    lastUpdatedRemote: string | null;

    // History (Max 50)
    historyStack: Command[];
    historyIndex: number;

    // Actions
    setNodes: (nodes: Record<string, BuilderNode>) => void;
    updateNode: (id: string, path: string, value: any) => void;
    addNode: (node: BuilderNode) => void;
    deleteNode: (id: string) => void;
    
    setPages: (pages: Record<string, PageMetadata>) => void;
    setActivePageId: (id: string) => void;
    setSelectedNodeId: (id: string | null) => void;
    
    setSaveStatus: (status: BuilderState['saveStatus']) => void;
    setHasUnsavedChanges: (has: boolean) => void;
    setLastUpdatedRemote: (time: string) => void;

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

export const useBuilderStore = create<BuilderState>()(immer((set, get) => ({
    nodes: {},
    pages: {},
    activePageId: '',
    selectedNodeId: null,
    saveStatus: 'idle',
    hasUnsavedChanges: false,
    lastUpdatedRemote: null,
    historyStack: [],
    historyIndex: -1,

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
    },

    setPages: (pages) => set((state) => { state.pages = pages; }),
    setActivePageId: (id) => set((state) => { state.activePageId = id; }),
    setSelectedNodeId: (id) => set((state) => { state.selectedNodeId = id; }),
    setSaveStatus: (status) => set((state) => { state.saveStatus = status; }),
    setHasUnsavedChanges: (has) => set((state) => { state.hasUnsavedChanges = has; }),
    setLastUpdatedRemote: (time) => set((state) => { state.lastUpdatedRemote = time; }),

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
})));
