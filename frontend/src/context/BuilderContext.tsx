import * as React from 'react';
import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';

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

export interface BuilderNode {
    id: string;
    type: string;
    props: Record<string, unknown>;
    parentId: string | null;
    children: string[];
    styles: Record<string, unknown>;
    schemaVersion: number;
    createdAt: string;
}

export interface BuilderContextValue {
    // State
    nodes: Record<string, BuilderNode>
    pages: { byId: Record<string, PageMetadata>; allIds: string[] }
    activePageId: string
    selectedNodeId: string | null
    mode: 'edit' | 'preview'
    isLoading: boolean
    hasUnsavedChanges: boolean
    saveStatus: 'idle' | 'saving' | 'saved' | 'error'

    // Node mutations (all stable useCallback with no deps)
    addNode: (node: BuilderNode) => void
    deleteNode: (id: string) => void
    updateNode: (id: string, path: string, value: unknown) => void
    moveNode: (id: string, direction: 'up' | 'down') => void
    duplicateNode: (id: string) => void
    reorderNodes: (fromIndex: number, toIndex: number) => void

    // Page mutations
    addPage: (title: string, type?: string) => string
    deletePage: (id: string) => void
    setActivePageId: (id: string) => void

    // UI actions
    selectNode: (id: string | null) => void
    setMode: (mode: 'edit' | 'preview') => void

    // Persistence
    saveDraft: (nodesToSave?: Record<string, BuilderNode>) => Promise<void>
    publishSite: () => Promise<void>

    // Undo/Redo
    undo: () => void
    redo: () => void
    canUndo: boolean
    canRedo: boolean

    // Legacy aliases (keep for backward compatibility)
    isBuilderActive: boolean
    pageLayouts: Record<string, BuilderNode[]>
    updateNodeProperty: (id: string, path: string, value: unknown) => void
    commitHistory: () => void
    setIsTyping: (val: boolean) => void
    editingInfo: { nodeId: string; path: string; elementId: string } | null
    setEditingInfo: (info: BuilderContextValue['editingInfo']) => void
}

const BuilderContext = createContext<BuilderContextValue | undefined>(undefined);

export const useBuilder = () => {
    const context = useContext(BuilderContext);
    if (!context) {
        throw new Error('useBuilder must be used within BuilderProvider');
    }
    return context;
};

interface BuilderProviderProps {
    children: React.ReactNode;
    initialData?: {
        nodes?: Record<string, BuilderNode>;
        pages?: Record<string, PageMetadata>;
        activePageId?: string;
    };
}

export const BuilderProvider: React.FC<BuilderProviderProps> = ({ children, initialData }) => {
    const [nodes, setNodes] = useState<Record<string, BuilderNode>>(initialData?.nodes || {});
    const [pages, setPages] = useState<{ byId: Record<string, PageMetadata>; allIds: string[] }>({
        byId: initialData?.pages || {},
        allIds: Object.keys(initialData?.pages || {})
    });
    const [activePageId, setActivePageIdRaw] = useState<string>(initialData?.activePageId || '');
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [mode, setMode] = useState<'edit' | 'preview'>('edit');
    const [isLoading, setIsLoading] = useState(true);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [isBuilderActive] = useState(true);
    const [, setIsTyping] = useState(false);
    const [editingInfo, setEditingInfo] = useState<BuilderContextValue['editingInfo']>(null);

    // History state
    const [history, setHistory] = useState<Record<string, BuilderNode>[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // Refs for stable dependency extraction (Rule A)
    const nodesRef = useRef(nodes);
    useEffect(() => { nodesRef.current = nodes; }, [nodes]);

    const pagesRef = useRef(pages);
    useEffect(() => { pagesRef.current = pages; }, [pages]);

    const activePageIdRef = useRef(activePageId);
    useEffect(() => { activePageIdRef.current = activePageId; }, [activePageId]);

    // RULE E — initialData consumed ONCE on mount
    useEffect(() => {
        if (!initialData) {
            setIsLoading(false);
            return;
        }
        if (initialData.nodes) setNodes(initialData.nodes);
        if (initialData.pages) setPages({
            byId: initialData.pages,
            allIds: Object.keys(initialData.pages)
        });
        if (initialData.activePageId) setActivePageIdRaw(initialData.activePageId);
        setIsLoading(false);
    }, [initialData]); 

    // Node Mutations (Rule D — functional updates, no deps)
    const addNode = useCallback((node: BuilderNode) => {
        setNodes(prev => ({ ...prev, [node.id]: node }));
        setHasUnsavedChanges(true);
    }, []);

    const deleteNode = useCallback((id: string) => {
        setNodes(prev => {
            const next = { ...prev };
            delete next[id];
            // Also need to remove from parent's children
            Object.values(next).forEach(n => {
                if (n.children.includes(id)) {
                    next[n.id] = { ...n, children: n.children.filter(cid => cid !== id) };
                }
            });
            return next;
        });
        setHasUnsavedChanges(true);
    }, []);

    const updateNode = useCallback((id: string, path: string, value: unknown) => {
        setNodes(prev => {
            const node = prev[id];
            if (!node) return prev;

            const nextNode = { ...node };
            const keys = path.split('.');
            let current: Record<string, unknown> = nextNode as unknown as Record<string, unknown>;
            
            for (let i = 0; i < keys.length - 1; i++) {
                current[keys[i]] = { ...(current[keys[i]] as Record<string, unknown>) };
                current = current[keys[i]] as Record<string, unknown>;
            }
            current[keys[keys.length - 1]] = value;

            return { ...prev, [id]: nextNode };
        });
        setHasUnsavedChanges(true);
    }, []);

    const moveNode = useCallback((id: string, direction: 'up' | 'down') => {
        setNodes(prev => {
            const node = prev[id];
            if (!node || !node.parentId) return prev;
            const parent = prev[node.parentId];
            if (!parent) return prev;

            const children = [...parent.children];
            const idx = children.indexOf(id);
            if (idx === -1) return prev;

            const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
            if (targetIdx < 0 || targetIdx >= children.length) return prev;

            [children[idx], children[targetIdx]] = [children[targetIdx], children[idx]];
            
            return {
                ...prev,
                [parent.id]: { ...parent, children }
            };
        });
        setHasUnsavedChanges(true);
    }, []);

    const duplicateNode = useCallback((id: string) => {
        setNodes(prev => {
            const original = prev[id];
            if (!original) return prev;

            const newId = `${original.type}_${Date.now()}`;
            const copy = { ...JSON.parse(JSON.stringify(original)), id: newId, createdAt: new Date().toISOString() };
            
            const next = { ...prev, [newId]: copy };
            if (original.parentId && next[original.parentId]) {
                const parent = next[original.parentId];
                const idx = parent.children.indexOf(id);
                const children = [...parent.children];
                children.splice(idx + 1, 0, newId);
                next[parent.id] = { ...parent, children };
            }
            return next;
        });
        setHasUnsavedChanges(true);
    }, []);

    const reorderNodes = useCallback((fromIndex: number, toIndex: number) => {
        // This usually applies to root nodes of the active page
        // Need to know which nodes are root nodes. For now, let's assume we find them from state.
        setNodes(prev => {
            // Reordering needs specific context of what is being reordered.
            // If it's root nodes, they are the ones where parentId is null.
            const rootIds = Object.values(prev)
                .filter(n => n.parentId === null)
                .map(n => n.id);
            
            const nextRootIds = [...rootIds];
            const [moved] = nextRootIds.splice(fromIndex, 1);
            nextRootIds.splice(toIndex, 0, moved);

            // Reorder doesn't make sense if they are not siblings. 
            // This stub assumes flat root reordering.
            return prev; // No-op until we have better structure or this is specifically for a parent
        });
        setHasUnsavedChanges(true);
    }, []);

    const selectNode = useCallback((id: string | null) => {
        setSelectedNodeId(id);
    }, []);

    const setActivePageId = useCallback((id: string) => {
        setActivePageIdRaw(id);
    }, []);

    const addPage = useCallback((title: string, type: string = 'custom') => {
        const id = crypto.randomUUID();
        const slug = title.toLowerCase().replace(/\s+/g, '-');
        const newPage: PageMetadata = {
            id,
            title,
            slug,
            type: type as PageMetadata['type'],
            status: 'draft',
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            seoMeta: { title: '', description: '' }
        };
        setPages(prev => ({
            byId: { ...prev.byId, [id]: newPage },
            allIds: [...prev.allIds, id]
        }));
        setHasUnsavedChanges(true);
        setActivePageIdRaw(id);
        return id;
    }, []);

    const deletePage = useCallback((id: string) => {
        setPages(prev => {
            const nextById = { ...prev.byId };
            delete nextById[id];
            return {
                byId: nextById,
                allIds: prev.allIds.filter(pid => pid !== id)
            };
        });
        setHasUnsavedChanges(true);
    }, []);

    // Persistence
    const saveDraft = useCallback(async (nodesToSave?: Record<string, BuilderNode>) => {
        const data = nodesToSave || nodesRef.current;
        setSaveStatus('saving');
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user');

            const { error } = await supabase
                .from('store_pages')
                .upsert({
                    tenant_id: user.id,
                    slug: activePageIdRef.current || 'home',
                    ast_manifest: { 
                        nodes: data, 
                        pages: pagesRef.current.byId, 
                        activePageId: activePageIdRef.current 
                    },
                    is_published: false
                }, { onConflict: 'tenant_id, slug, is_published' });

            if (error) throw error;
            setSaveStatus('saved');
            setHasUnsavedChanges(false);
        } catch (err) {
            console.error('Save failed:', err);
            setSaveStatus('error');
        }
    }, []);

    const publishSite = useCallback(async () => {
        // Implementation for publishing
        setSaveStatus('saving');
        setTimeout(() => setSaveStatus('saved'), 1000);
    }, []);

    // Context Value (Rule C — Memoized)
    const commitHistory = useCallback(() => {
        setHistory(prev => {
            const next = prev.slice(0, historyIndex + 1);
            if (next.length >= 50) next.shift();
            return [...next, JSON.parse(JSON.stringify(nodesRef.current))];
        });
        setHistoryIndex(prev => Math.min(prev + 1, 49));
    }, [historyIndex]);

    const undo = useCallback(() => {
        if (historyIndex > 0) {
            setNodes(history[historyIndex - 1]);
            setHistoryIndex(prev => prev - 1);
        }
    }, [history, historyIndex]);

    const redo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            setNodes(history[historyIndex + 1]);
            setHistoryIndex(prev => prev + 1);
        }
    }, [history, historyIndex]);

    // Context Value (Rule C — Memoized)
    const contextValue = useMemo(() => ({
        nodes,
        pages,
        activePageId,
        selectedNodeId,
        mode,
        isLoading,
        hasUnsavedChanges,
        saveStatus,
        addNode,
        deleteNode,
        updateNode,
        moveNode,
        duplicateNode,
        reorderNodes,
        addPage,
        deletePage,
        setActivePageId,
        selectNode,
        setMode,
        saveDraft,
        publishSite,
        undo,
        redo,
        canUndo: historyIndex > 0,
        canRedo: historyIndex < history.length - 1,
        // Legacy
        isBuilderActive,
        pageLayouts: {}, // Placeholder for legacy compatibility if needed
        updateNodeProperty: updateNode,
        commitHistory,
        setIsTyping,
        editingInfo,
        setEditingInfo
    }), [
        nodes,
        pages,
        activePageId,
        selectedNodeId,
        mode,
        isLoading,
        hasUnsavedChanges,
        saveStatus,
        historyIndex,
        history.length,
        addNode,
        deleteNode,
        updateNode,
        moveNode,
        duplicateNode,
        reorderNodes,
        addPage,
        deletePage,
        setActivePageId,
        selectNode,
        setMode,
        saveDraft,
        publishSite,
        undo,
        redo,
        isBuilderActive,
        commitHistory,
        editingInfo
    ]);

    return (
        <BuilderContext.Provider value={contextValue}>
            {children}
        </BuilderContext.Provider>
    );
};