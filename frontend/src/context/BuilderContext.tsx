import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import client from '../api/client';
import { nodeStore, NodeStore } from '../platform/core/NodeStore';
import { dispatcher } from '../platform/core/Dispatcher';
import { getRegistryEntry, SectionType } from '../components/cms/BuilderRegistry';
import { resolveComponentType } from '../components/cms/ComponentRegistry';
import { deepMergeProps, reportRegistryError, safeDeepUpdate, verifyInvariants } from '../utils/builderUtils';
import { OmnoraContext } from './OmnoraContext';
import type { DropPosition } from '../components/cms/ComponentWrapper';
import { useSyncExternalStore } from 'react';
import { NewPageInitializer } from '../lib/kernel/utils/NewPageInitializer';
import { useBuilderStore } from '../stores/useBuilderStore';
import { getPreset } from '../components/cms/DevicePresetPanel';

const MAX_HISTORY_DEPTH = 100;

export interface PageMetadata {
    id: string;
    title: string;
    slug: string;
    status: 'draft' | 'live';
    lastUpdated?: string;
    seoMeta?: {
        title: string;
        description: string;
        ogImage?: string;
    };
    type?: 'system' | 'template' | 'custom';
    isLocked?: boolean;
    globalAnimations?: boolean;
}

export interface BuilderNode {
    id: string;
    type: string;
    parentId: string | null;
    children: string[];
    props: Record<string, unknown>;
    styles: Record<string, unknown>;
    link?: {
        type: 'INTERNAL' | 'EXTERNAL' | 'SCROLL' | 'NONE';
        target: string;
    };
    responsive?: {
        base?: Record<string, unknown>;
        md?: Record<string, unknown>;
        sm?: Record<string, unknown>;
    };
    hidden?: {
        mobile: boolean;
        tablet: boolean;
        desktop: boolean;
    };
    isLocked?: boolean;
    schemaVersion?: number;
    migrationVersion?: number;
    createdAt?: string;
    updatedAt?: string;
    interactions?: {
        hover?: Record<string, unknown>;
        active?: Record<string, unknown>;
        scrollReveal?: unknown;
    };
    motion?: {
        curve?: string;
        duration?: number;
    };
    binding?: string;
    forcedState?: 'hover' | 'active' | null;
    revision?: number;

    animations?: {
        type: 'fadeIn' | 'slideUp' | 'zoomIn' | 'blurReveal' | 'none';
        duration: number;
        delay: number;
        once: boolean;
    };
    symbolId?: string;
    animationPreviewKey?: number;
}

export enum InteractionPriority {
    IDLE = 0,
    HOVERING = 1,
    SELECTED = 2,
    NAVIGATING = 3,
    TYPING = 4,
    DRAGGING = 5,
    RESIZING = 6,
    MEDIA_PICKING = 7,
}

interface UIContextType {
    isLoading: boolean;
    pages: { byId: Record<string, PageMetadata>; allIds: string[] };
    activePageId: string;
    setActivePageId: (id: string) => void;
    addPage: (title: string, slug: string, type?: 'system'|'template'|'custom', templateData?: Record<string,unknown>) => void;
    deletePage: (id: string) => void;
    updatePageMeta: (id: string, path: string, value: unknown) => void;
    viewport: 'desktop' | 'tablet' | 'mobile';
    setViewport: (v: 'desktop' | 'tablet' | 'mobile') => void;
    devicePreset: string;
    setDevicePreset: (preset: string) => void;
    orientation: 'portrait' | 'landscape';
    setOrientation: (o: 'portrait' | 'landscape') => void;
    zoomLevel: number;
    setZoomLevel: (z: number) => void;
    showDeviceFrame: boolean;
    toggleDeviceFrame: () => void;
    showSafeAreaOverlay: boolean;
    toggleSafeAreaOverlay: () => void;
    mode: 'edit' | 'preview';
    setMode: (m: 'edit' | 'preview') => void;
    isPreview: boolean;
    saveStatus: 'idle' | 'saving' | 'processing' | 'saved' | 'error' | 'offline';
    activeJobId: string | null;
    isBuilderActive: boolean;
    setIsBuilderActive: (active: boolean) => void;
    hasUnsavedChanges: boolean;
    interactionPriority: InteractionPriority;
    setInteractionPriority: (p: InteractionPriority) => void;
    canInteract: (requested: InteractionPriority) => boolean;
    selectedNodeId?: string | null;
    isTyping: boolean;
    setIsTyping: (typing: boolean) => void;
    editingInfo: { nodeId: string; path: string; elementId?: string } | null;
    setEditingInfo: (info: { nodeId: string; path: string; elementId?: string } | null) => void;
    libraryState: { isOpen: boolean; index: number | null; parentId: string | null };
    setLibraryState: (state: { isOpen: boolean; index: number | null; parentId: string | null }) => void;
    diagnostics: { showPanel: boolean; renderCounts: Record<string, number>; focusLosses: number };
    setDiagnostics: (d: Partial<UIContextType['diagnostics']>) => void;
    theme: Theme;
    updateTheme: (newTheme: Partial<Theme>) => void;
    nodeStore: NodeStore; // OSTT FIX: Added generic accessor back since it was removed
}

export interface Theme {
    primaryColor: string;
    backgroundColor: string;
    cardColor: string;
    textColor: string;
    borderRadius: string;
}

interface NodesContextType {
    nodes: Record<string, BuilderNode>;
    pageLayouts: Record<string, string[]>;
    activePageId: string;
    nodeTree: Record<string, BuilderNode>;
    selectedNodeId: string | null;
    designSystem: Record<string, unknown>;
    selectNode: (id: string | null) => void;
    updateNode: (id: string, path: string, value: unknown) => void;
    updateDesignSystem: (path: string, value: unknown) => void;
    setNodeForcedState: (id: string, state: 'hover' | 'active' | null) => void;
    addNode: (type: string, props?: Record<string, unknown>, parentId?: string | null, index?: number | null) => string;
    deleteNode: (id: string) => void;
    duplicateNode: (id: string) => string;
    reorderNode: (id: string, direction: 'up' | 'down') => void;
    moveNodeToIndex: (id: string, index: number) => void;
    reorderPageLayout: (newLayout: string[]) => void;
    systemHealth: unknown;
    undo: () => void;
    redo: () => void;
    commitHistory: () => void;
    saveDraft: () => Promise<void>;
    publishLive: () => Promise<void>;
    injectAST: (data: Record<string, unknown>) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);
export const NodesContext = createContext<NodesContextType | undefined>(undefined);
const BuilderContext = createContext<(UIContextType & NodesContextType) | undefined>(undefined);

export const BuilderProvider: React.FC<{ children: React.ReactNode, initialData: { layout?: Record<string, unknown>[], configuration?: Record<string, unknown> }, isPreview: boolean, tenantId?: string, userName?: string }> = ({ children, initialData, isPreview, tenantId, userName }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isBuilderActive, setIsBuilderActive] = useState(false);
    const [mode, setMode] = useState<'edit' | 'preview'>('edit');
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [designSystem, setDesignSystem] = useState<Record<string, unknown>>(initialData?.configuration || {});
    const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
    const [devicePreset, setDevicePresetRaw] = useState<string>('desktop_1440');
    const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
    const [zoomLevel, setZoomLevel] = useState<number>(100);
    const [showDeviceFrame, setShowDeviceFrame] = useState<boolean>(true);
    const [showSafeAreaOverlay, setShowSafeAreaOverlay] = useState<boolean>(false);

    const setDevicePreset = (preset: string) => {
        setDevicePresetRaw(preset);
        const p = getPreset(preset);
        if (p?.category) {
            setViewport(p.category as 'desktop' | 'tablet' | 'mobile');
        }
    };
    const toggleDeviceFrame = () => setShowDeviceFrame(v => !v);
    const toggleSafeAreaOverlay = () => setShowSafeAreaOverlay(v => !v);

    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'processing' | 'saved' | 'error' | 'offline'>('idle');
    const [activeJobId, setActiveJobId] = useState<string | null>(null);
    const [isTyping, setIsTypingRaw] = useState(false);
    const [editingInfo, setEditingInfo] = useState<{ nodeId: string; path: string; elementId?: string } | null>(null);

    const setIsTyping = useCallback((typing: boolean) => {
        setIsTypingRaw(typing);
        if (!typing) setEditingInfo(null);
    }, []);

    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [libraryState, setLibraryState] = useState<{ isOpen: boolean; index: number | null; parentId: string | null }>({ isOpen: false, index: null, parentId: null });

    const [pages, setPages] = useState<{ byId: Record<string, PageMetadata>; allIds: string[] }>({ byId: {}, allIds: [] });
    const [activePageId, setActivePageId] = useState<string>('home');

    const [theme, setTheme] = useState<Theme>({
        primaryColor: '#7c6dfa',
        backgroundColor: '#0a0a0f',
        cardColor: '#1a1a24',
        textColor: '#ffffff',
        borderRadius: '16px'
    });
    const updateTheme = useCallback((newTheme: Partial<Theme>) => {
        setTheme(prev => ({ ...prev, ...newTheme }));
    }, []);

    const nodes = useSyncExternalStore(
        useCallback(onStoreChange => nodeStore.subscribe(onStoreChange), []),
        () => nodeStore.getState().nodes
    );
    const pageLayouts = useSyncExternalStore(
        useCallback(onStoreChange => nodeStore.subscribe(onStoreChange), []),
        () => nodeStore.getState().pageLayouts
    );

    const setNodes = useCallback((updater: React.SetStateAction<Record<string, BuilderNode>>) => {
        nodeStore._update((state) => {
            const nextNodes = typeof updater === 'function' ? updater(state.nodes) : updater;
            return { nodes: nextNodes };
        });
    }, []);

    const setPageLayouts = useCallback((updater: React.SetStateAction<Record<string, string[]>>) => {
        nodeStore._update((state) => {
            const nextLayouts = typeof updater === 'function' ? updater(state.pageLayouts) : updater;
            return { pageLayouts: nextLayouts };
        });
    }, []);
    const [diagnostics, setDiagnosticsRaw] = useState({ showPanel: false, renderCounts: {} as Record<string, number>, focusLosses: 0 });

    const setDiagnostics = useCallback((d: Partial<typeof diagnostics>) => {
        setDiagnosticsRaw(prev => ({ ...prev, ...d }));
    }, []);

    const [interactionPriority, setInteractionPriority] = useState<InteractionPriority>(InteractionPriority.IDLE);

    const canInteract = useCallback((requested: InteractionPriority) => {
        return requested >= interactionPriority;
    }, [interactionPriority]);

    const systemHealth = useMemo(() => verifyInvariants(nodes, pageLayouts), [nodes, pageLayouts]);

    const nodesRef = useRef<Record<string, BuilderNode>>(nodes);
    const layoutsRef = useRef<Record<string, string[]>>(pageLayouts);
    const pagesRef = useRef(pages);
    const designSystemRef = useRef(designSystem);
    const isTypingRef = useRef(isTyping);
    const saveStatusRef = useRef(saveStatus);
    const activePageIdRef = useRef(activePageId);

    const [history, setHistory] = useState<Record<string, unknown>[]>([]);
    const [historyPointer, setHistoryPointer] = useState(-1);

    useEffect(() => { nodesRef.current = nodes; }, [nodes]);
    useEffect(() => { layoutsRef.current = pageLayouts; }, [pageLayouts]);
    useEffect(() => { pagesRef.current = pages; }, [pages]);
    useEffect(() => { designSystemRef.current = designSystem; }, [designSystem]);
    useEffect(() => { isTypingRef.current = isTyping; }, [isTyping]);
    useEffect(() => { saveStatusRef.current = saveStatus; }, [saveStatus]);
    useEffect(() => { activePageIdRef.current = activePageId; }, [activePageId]);

    const commitHistory = useCallback(() => {
        const snapshot = {
            nodes: nodesRef.current,
            pageLayouts: layoutsRef.current,
            designSystem: designSystemRef.current,
            activePageId: activePageIdRef.current,
            timestamp: new Date().toISOString()
        };

        setHistory(prev => {
            const newHistory = prev.slice(0, historyPointer + 1);
            if (newHistory.length >= MAX_HISTORY_DEPTH) newHistory.shift();
            return [...newHistory, snapshot];
        });
        setHistoryPointer(prev => Math.min(prev + 1, MAX_HISTORY_DEPTH - 1));
        setHasUnsavedChanges(true);
    }, [historyPointer]);

    const injectAST = useCallback((data: Record<string, unknown>) => {
        if (!data || !data.nodes) return;

        nodeStore._update(() => ({
            nodes: (data.nodes as Record<string, BuilderNode>) || {},
            pageLayouts: (data.pageLayouts as Record<string, string[]>) || {},
            revisions: Object.keys((data.nodes as Record<string, unknown>) || {}).reduce((acc, id) => ({ ...acc, [id]: 1 }), {}),
        }));

        if (data.pages) setPages(data.pages as { byId: Record<string, PageMetadata>; allIds: string[] });
        if (data.designSystem) setDesignSystem(data.designSystem as Record<string, unknown>);
        if (data.activePageId) setActivePageId(data.activePageId as string);

        commitHistory();
        console.log('[Omnora AI] AST Injected successfully');
    }, [commitHistory]);

    const lastContentIdRef = useRef<string | null>(null);

    useEffect(() => {
        const bootstrap = () => {
            const incomingId = (initialData as { id?: string })?.id || null;
            if (incomingId && incomingId === lastContentIdRef.current) {
                console.log('[Omnora Kernel] Content ID match. Skipping re-bootstrap.');
                setIsLoading(false);
                return;
            }
            lastContentIdRef.current = incomingId;

            nodeStore.reset();
            dispatcher.reset();

            const storageKey = tenantId ? `omnora_builder_state_${tenantId}` : 'omnora_builder_state';
            const savedState = localStorage.getItem(storageKey);
            if (savedState) {
                try {
                    const parsed = JSON.parse(savedState);
                    const report = verifyInvariants(parsed.nodes || {}, parsed.pageLayouts || {});
                    if (report.status === 'CORRUPTED') {
                        console.error('[Omnora Safety] Hydration blocked due to critical invariants:', report.invariants);
                        if (process.env.NODE_ENV === 'development') {
                            setDiagnostics({ showPanel: true });
                        }
                    }

                    // OSTT FIX: Removed TS index mapping errors using strongly mapped models
                    if (parsed.pages && !parsed.pages.byId) {
                        const normalizedPages: { byId: Record<string, PageMetadata>; allIds: string[] } = { byId: {}, allIds: [] };
                        const normalizedLayouts: Record<string, string[]> = {};
                        const normalizedNodes: Record<string, BuilderNode> = {};

                        Object.values(parsed.pages as Record<string, Partial<PageMetadata> & { nodeTree?: Record<string, BuilderNode> }>).forEach((p) => {
                            if (p.id) {
                                normalizedPages.byId[p.id] = {
                                    id: p.id,
                                    title: p.title || 'Untitled',
                                    slug: p.slug || '/',
                                    status: p.status || 'draft',
                                    lastUpdated: p.lastUpdated || '',
                                    seoMeta: p.seoMeta || { title: '', description: '' },
                                    type: p.type || 'custom',
                                };
                                normalizedPages.allIds.push(p.id);

                                const pageNodes = p.nodeTree || {};
                                const rootNodeIds = Object.values(pageNodes)
                                    .filter(n => n.parentId === null)
                                    .map(n => n.id);

                                normalizedLayouts[p.id] = rootNodeIds;
                                Object.assign(normalizedNodes, pageNodes);
                            }
                        });

                        setPages(normalizedPages);
                        setPageLayouts(normalizedLayouts);
                        setNodes(normalizedNodes);
                        setActivePageId(parsed.activePageId || 'home');
                    } else {
                        setPages(parsed.pages || { byId: {}, allIds: [] });
                        setPageLayouts(parsed.pageLayouts || {});
                        setNodes(parsed.nodes || {});
                        setActivePageId(parsed.activePageId || 'home');
                    }
                    setDesignSystem(parsed.designSystem || {});
                    setIsLoading(false);
                    return;
                } catch (e) {
                    console.error('[Omnora Boot] Local storage corruption detected. Rolling back.', e);
                }
            }

            const now = new Date().toISOString();

            if (initialData?.layout) {
                const tree: Record<string, BuilderNode> = {};
                const rootIds: string[] = [];

                initialData.layout.forEach((block: Record<string, unknown>, idx: number) => {
                    const id = String(block.id || `node_${block.type}_${idx}`);
                    tree[id] = {
                        id,
                        type: String(block.type),
                        parentId: null,
                        children: [],
                        props: (block.data as Record<string, unknown>) || {},
                        styles: (block.styles as Record<string, unknown>) || {},
                        schemaVersion: 2,
                        createdAt: now,
                        updatedAt: now,
                        revision: 1
                    };
                    rootIds.push(id);
                });

                const homeMeta: PageMetadata = {
                    id: 'home',
                    title: 'Home',
                    slug: '/',
                    type: 'system',
                    isLocked: true,
                    status: 'live',
                    lastUpdated: now,
                    seoMeta: { title: 'Home | Omnora', description: 'Luxury Ecommerce' }
                };

                setPages({ byId: { home: homeMeta }, allIds: ['home'] });
                setPageLayouts({ home: rootIds });
                setNodes(tree);
                setActivePageId('home');
                setDesignSystem(initialData.configuration || {});
            } else {
                const defaultHeroId = `node_hero_${Date.now()}`;
                const tree: Record<string, BuilderNode> = {
                    [defaultHeroId]: {
                        id: defaultHeroId,
                        type: 'hero_banner',
                        parentId: null,
                        children: [],
                        props: {
                            headline: `Welcome to ${userName || 'Your'}'s Collection`,
                            subheadline: "Start building your dream business",
                            ctaText: "Shop Now"
                        },
                        styles: {},
                        schemaVersion: 2,
                        createdAt: now,
                        updatedAt: now,
                        revision: 1
                    }
                };

                const homeMeta: PageMetadata = {
                    id: 'home',
                    title: 'Home',
                    slug: '/',
                    type: 'system',
                    isLocked: true,
                    status: 'live',
                    lastUpdated: now,
                    seoMeta: { title: 'Home', description: '' }
                };

                setPages({ byId: { home: homeMeta }, allIds: ['home'] });
                setPageLayouts({ home: [defaultHeroId] });
                setNodes(tree);
                setActivePageId('home');
                setDesignSystem({});
            }
            setIsLoading(false);
        };

        bootstrap();
    }, [initialData, tenantId, userName, setDiagnostics, setNodes, setPageLayouts]);

    const switchPage = useCallback((newId: string) => {
        const previousId = activePageIdRef.current;
        if (!pagesRef.current.byId[newId]) {
            console.warn(`[PageSwitcher] Page ${newId} not found. Falling back to 'home'.`);
            if (pagesRef.current.byId['home']) {
                setActivePageId('home');
            }
            return;
        }

        setInteractionPriority(InteractionPriority.NAVIGATING);
        setSelectedNodeId(null);
        setLibraryState({ isOpen: false, index: null, parentId: null });
        setIsTyping(false);

        try {
            setActivePageId(newId);
            setTimeout(() => {
                setInteractionPriority(InteractionPriority.IDLE);
            }, 300);
        } catch (err) {
            console.error('[Omnora Router] Switch failed. Rolling back.', err);
            setActivePageId(previousId);
            setInteractionPriority(InteractionPriority.IDLE);
        }
    }, [setIsTyping]);

    const migrateNode = useCallback((node: BuilderNode): BuilderNode => {
        const entry = getRegistryEntry(node.type);
        if (!entry) return node;

        const currentSchema = entry.schemaVersion || 0;
        const nodeSchema = node.schemaVersion || 0;

        if (nodeSchema < currentSchema && entry.migrate) {
            console.log(`[Omnora Evolution] Migrating ${node.type} from v${nodeSchema} to v${currentSchema}`);
            const migrated = entry.migrate(node as unknown as Record<string, unknown> & { schemaVersion?: number, props?: Record<string, unknown> });
            return { ...migrated, schemaVersion: currentSchema } as BuilderNode;
        }

        return node;
    }, []);

    const nodeTree = useMemo(() => {
        const layout = pageLayouts[activePageId] || [];
        const tree: Record<string, BuilderNode> = {};

        const collect = (id: string) => {
            const rawNode = nodes[id];
            if (!rawNode) return;
            const node = migrateNode(rawNode);
            tree[id] = node;
            (node.children || []).forEach(collect);
        };

        layout.forEach(collect);
        return tree;
    }, [nodes, pageLayouts, activePageId, migrateNode]);

    const selectNode = useCallback((id: string | null) => {
        if (mode === 'preview' || !canInteract(InteractionPriority.SELECTED)) return;
        setSelectedNodeId(id);
    }, [mode, canInteract]);

    const undo = useCallback(() => {
        if (historyPointer > 0) {
            const prev = history[historyPointer - 1] as Record<string, unknown>;
            setNodes(prev.nodes as Record<string, BuilderNode>);
            setPageLayouts(prev.pageLayouts as Record<string, string[]>);
            setDesignSystem(prev.designSystem as Record<string, unknown>);
            setActivePageId(prev.activePageId as string);
            setHistoryPointer(historyPointer - 1);
            setHasUnsavedChanges(true);
        }
    }, [history, historyPointer, setNodes, setPageLayouts]);

    const redo = useCallback(() => {
        if (historyPointer < history.length - 1) {
            const next = history[historyPointer + 1] as Record<string, unknown>;
            setNodes(next.nodes as Record<string, BuilderNode>);
            setPageLayouts(next.pageLayouts as Record<string, string[]>);
            setDesignSystem(next.designSystem as Record<string, unknown>);
            setActivePageId(next.activePageId as string);
            setHistoryPointer(historyPointer + 1);
            setHasUnsavedChanges(true);
        }
    }, [history, historyPointer, setNodes, setPageLayouts]);

    const updateNode = useCallback((id: string, path: string, value: unknown) => {
        if (!canInteract(InteractionPriority.HOVERING)) return;

        setNodes(prev => {
            if (!prev[id]) return prev;
            const updatedNodes = safeDeepUpdate(prev, `${id}.${path}`, value);
            updatedNodes[id] = { ...updatedNodes[id], updatedAt: new Date().toISOString() };
            return updatedNodes;
        });
        setHasUnsavedChanges(true);
    }, [canInteract, setNodes]);

    const updateDesignSystem = useCallback((path: string, value: unknown) => {
        setDesignSystem(prev => {
            const next = { ...prev };
            const keys = path.split('.');
            let current: Record<string, unknown> = next;
            for (let i = 0; i < keys.length - 1; i++) {
                current[keys[i]] = { ...(current[keys[i]] as Record<string, unknown> || {}) };
                current = current[keys[i]] as Record<string, unknown>;
            }
            current[keys[keys.length - 1]] = value;
            next.version = (Number(next.version) || 0) + 1;
            next.lastUpdated = new Date().toISOString();
            return next;
        });
        setHasUnsavedChanges(true);
    }, []);

    const setNodeForcedState = useCallback((id: string, state: 'hover' | 'active' | null) => {
        setNodes(prev => {
            const next = { ...prev };
            if (!next[id]) return prev;
            next[id] = { ...next[id], forcedState: state };
            return next;
        });
    }, [setNodes]);

    const addNode = useCallback((type: string, props: Record<string, unknown> = {}, parentId: string | null = null, index: number | null = null) => {
        if (mode === 'preview' || !canInteract(InteractionPriority.DRAGGING)) return '';

        const resolvedType = resolveComponentType(type);
        const entry = getRegistryEntry(resolvedType as SectionType);
        
        if (!entry) {
            reportRegistryError({
                type: resolvedType,
                context: 'Attempted node insertion',
                pageId: activePageId,
                viewport
            });
            return '';
        }

        const id = `${resolvedType}_${Date.now()}`;
        const hydratedProps = deepMergeProps(resolvedType, entry.defaultProps || {}, props);

        const newNode: BuilderNode = {
            id,
            type: resolvedType,
            parentId,
            children: [],
            props: hydratedProps,
            styles: { padding: '0', margin: '0' },
            schemaVersion: 2,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        setNodes(prev => {
            const next = { ...prev };
            next[id] = newNode;

            if (parentId && next[parentId]) {
                const parent = { ...next[parentId] };
                const siblings = [...parent.children];
                const targetIndex = index !== null ? index : siblings.length;
                siblings.splice(targetIndex, 0, id);
                parent.children = siblings;
                next[parentId] = parent;
            }
            return next;
        });

        if (!parentId) {
            setPageLayouts(prev => {
                const currentLayout = prev[activePageId] || [];
                const nextLayout = [...currentLayout];
                const targetIndex = index !== null ? index : nextLayout.length;
                nextLayout.splice(targetIndex, 0, id);
                return { ...prev, [activePageId]: nextLayout };
            });
        }

        setLibraryState({ isOpen: false, index: null, parentId: null });
        commitHistory();
        requestAnimationFrame(() => setSelectedNodeId(id));
        return id;
    }, [activePageId, commitHistory, mode, canInteract, viewport, setNodes, setPageLayouts]);

    const deleteNode = useCallback((id: string) => {
        setNodes(prev => {
            const next = { ...prev };
            const node = next[id];
            if (!node) return prev;

            if (node.parentId && next[node.parentId]) {
                const parent = { ...next[node.parentId] };
                parent.children = parent.children.filter(cid => cid !== id);
                next[node.parentId] = parent;
            }

            const removeRecursive = (targetId: string) => {
                const target = next[targetId];
                if (!target) return;
                target.children.forEach(removeRecursive);
                delete next[targetId];
            };
            removeRecursive(id);
            return next;
        });

        setPageLayouts(prev => {
            const layout = prev[activePageId] || [];
            if (layout.includes(id)) {
                return { ...prev, [activePageId]: layout.filter(nodeId => nodeId !== id) };
            }
            return prev;
        });

        if (selectedNodeId === id) setSelectedNodeId(null);
        commitHistory();
    }, [activePageId, selectedNodeId, commitHistory, setNodes, setPageLayouts]);

    // OSTT FIX: Included templateData directly into method signature to bypass type conflicts
    const addPage = useCallback((
        title: string, 
        slug: string, 
        type: 'system' | 'template' | 'custom' = 'custom',
        templateData?: Record<string, unknown>
    ) => {
        useBuilderStore.getState().addPage(title, type);
        const activePages = useBuilderStore.getState().pages;
        // Search through the record for the newly created page
        let newPageId = '';
        for(const pId in activePages) {
            if(activePages[pId].slug === slug) newPageId = pId;
        }

        const newPage = activePages[newPageId];
        if(!newPage) return; // Silent fail if creation failed

        setPages(prev => ({
            byId: { ...prev.byId, [newPageId]: newPage as PageMetadata },
            allIds: [...prev.allIds, newPageId]
        }));
        
        if (templateData && templateData.layout) {
            setPageLayouts(prev => ({ ...prev, [newPageId]: templateData.layout as string[] }));
            if (templateData.nodes) {
                setNodes(prev => ({ ...prev, ...(templateData.nodes as Record<string, BuilderNode>) }));
            }
        } else {
            const blankAST = NewPageInitializer.generateBlankAST();
            setPageLayouts(prev => ({ ...prev, [newPageId]: blankAST.layout }));
        }

        switchPage(newPageId);
    }, [switchPage, setPageLayouts, setNodes]);

    const deletePage = useCallback((id: string) => {
        const page = pagesRef.current.byId[id];
        if (!page || page.isLocked || id === activePageId) return;

        setPages(prev => {
            const nextById = { ...prev.byId };
            delete nextById[id];
            return {
                byId: nextById,
                allIds: prev.allIds.filter(pid => pid !== id)
            };
        });
        setPageLayouts(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
    }, [activePageId, setPageLayouts]);

    const updatePageMeta = useCallback((id: string, path: string, value: unknown) => {
        const page = pagesRef.current.byId[id];
        if (!page) return;

        if (page.isLocked && path === 'slug') return;

        setPages(prev => {
            const nextById = { ...prev.byId };
            const pageClone = { ...nextById[id] };

            const keys = path.split('.');
            let current = pageClone as Record<string, unknown>;
            for (let i = 0; i < keys.length - 1; i++) {
                current[keys[i]] = { ...(current[keys[i]] as Record<string, unknown>) };
                current = current[keys[i]] as Record<string, unknown>;
            }
            current[keys[keys.length - 1]] = value;

            nextById[id] = pageClone as PageMetadata;
            return { ...prev, byId: nextById };
        });
    }, []);

    const duplicateNode = useCallback((id: string) => {
        setNodes(prev => {
            const original = prev[id];
            if (!original) return prev;

            const newId = `${original.type}_${Date.now()}`;
            const copy = JSON.parse(JSON.stringify(original));
            copy.id = newId;
            copy.updatedAt = new Date().toISOString();

            if (copy.parentId && prev[copy.parentId]) {
                const parent = { ...prev[copy.parentId] };
                parent.children = [...parent.children, newId];
                return { ...prev, [newId]: copy, [parent.id]: parent };
            }

            return { ...prev, [newId]: copy };
        });

        setPageLayouts(prev => {
            const layout = prev[activePageId] || [];
            if (layout.includes(id)) {
                const nextLayout = [...layout];
                const idx = nextLayout.indexOf(id);
                // Cannot access state inside here synchronously, safe random gen
                nextLayout.splice(idx + 1, 0, `node_copy_${Date.now()}`);
                return { ...prev, [activePageId]: nextLayout };
            }
            return prev;
        });
        commitHistory();
    }, [activePageId, commitHistory, setNodes, setPageLayouts]);

    const saveDraft = useCallback(async () => {
        if (!hasUnsavedChanges && saveStatus !== 'error') return;

        setSaveStatus('saving');
        try {
            const payload = {
                pages: pagesRef.current,
                pageLayouts: layoutsRef.current,
                nodes: nodesRef.current,
                designSystem: designSystemRef.current,
                activePageId,
                version: '5.2.0 (Normalized+MultiPage)'
            };

            localStorage.setItem('omnora_builder_state', JSON.stringify(payload));

            if (navigator.onLine) {
                const response = await client.post('/cms/content', payload);
                if (response.status === 202) {
                    setActiveJobId(response.data.jobId);
                    setSaveStatus('processing');
                    return;
                }
            }

            setSaveStatus('saved');
            setHasUnsavedChanges(false);
            setTimeout(() => {
                if (saveStatusRef.current === 'saved') setSaveStatus('idle');
            }, 3000);
        } catch (err) {
            console.error('Save Draft Failed:', err);
            setSaveStatus('error');
        }
    }, [hasUnsavedChanges, saveStatus, activePageId]);

    useEffect(() => {
        const autosaveInterval = setInterval(() => {
            if (hasUnsavedChanges && !isTypingRef.current && saveStatusRef.current !== 'saving') {
                saveDraft();
            }
        }, 30000);

        return () => clearInterval(autosaveInterval);
    }, [hasUnsavedChanges, saveDraft]);

    useEffect(() => {
        if (isTyping) return;
        const timer = setTimeout(() => {
            if (hasUnsavedChanges && saveStatus !== 'saving') {
                saveDraft();
            }
        }, 3000);
        return () => clearTimeout(timer);
    }, [isTyping, hasUnsavedChanges, saveDraft, saveStatus]);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);

    const reorderNode = useCallback((id: string, direction: 'up' | 'down') => {
        setPageLayouts(prev => {
            const layout = prev[activePageId] || [];
            const currentIndex = layout.indexOf(id);
            if (currentIndex === -1) return prev;
            const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
            if (nextIndex < 0 || nextIndex >= layout.length) return prev;
            const nextLayout = [...layout];
            const [moved] = nextLayout.splice(currentIndex, 1);
            nextLayout.splice(nextIndex, 0, moved);
            return { ...prev, [activePageId]: nextLayout };
        });
        commitHistory();
    }, [activePageId, commitHistory, setPageLayouts]);

    const moveNodeToIndex = useCallback((id: string, targetIndex: number) => {
        setPageLayouts(prev => {
            const layout = prev[activePageId] || [];
            const currentIndex = layout.indexOf(id);
            if (currentIndex === -1) return prev;
            const nextLayout = [...layout];
            const [moved] = nextLayout.splice(currentIndex, 1);
            const clampedTarget = Math.max(0, Math.min(targetIndex, nextLayout.length));
            nextLayout.splice(clampedTarget, 0, moved);
            return { ...prev, [activePageId]: nextLayout };
        });
        commitHistory();
    }, [activePageId, commitHistory, setPageLayouts]);

    const reorderPageLayout = useCallback((newLayout: string[]) => {
        setPageLayouts(prev => ({ ...prev, [activePageId]: newLayout }));
        setHasUnsavedChanges(true);
    }, [activePageId, setPageLayouts]);

    const publishLive = useCallback(async () => {
        setSaveStatus('saving');
        try {
            const payload = {
                pages: pagesRef.current,
                pageLayouts: layoutsRef.current,
                nodes: nodesRef.current,
                activePageId,
                designSystem: designSystemRef.current,
                publishedAt: new Date().toISOString()
            };

            await client.post('/cms/content', payload);
            const response = await client.post('/cms/content/publish', {});

            if (response.status === 202) {
                setActiveJobId(response.data.jobId);
                setSaveStatus('processing');
                return;
            }

            setSaveStatus('saved');
            setHasUnsavedChanges(false);
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (err) {
            console.error('Publish failed:', err);
            setSaveStatus('error');
        }
    }, [activePageId]);

    const [dragState, setDragState] = useState<{
        draggingNodeId: string | null;
        dragOverNodeId: string | null;
        dropPosition: DropPosition | null;
        isDragging: boolean;
    }>({ draggingNodeId: null, dragOverNodeId: null, dropPosition: null, isDragging: false });

    const dragStateRef = useRef(dragState);
    useEffect(() => {
        dragStateRef.current = dragState;
    }, [dragState]);
    const rafRef = useRef<number | null>(null);

    const startDrag = useCallback((_e: React.DragEvent, nodeId: string) => {
        setInteractionPriority(InteractionPriority.DRAGGING);
        setDragState({ draggingNodeId: nodeId, dragOverNodeId: null, dropPosition: null, isDragging: true });
    }, []);

    const endDrag = useCallback((_e: React.DragEvent | string, _nodeId: string) => {
        setInteractionPriority(InteractionPriority.IDLE);
        setDragState({ draggingNodeId: null, dragOverNodeId: null, dropPosition: null, isDragging: false });
    }, []);

    const onDragOver = useCallback((_e: React.DragEvent, nodeId: string, position: DropPosition) => {
        const cur = dragStateRef.current;
        if (cur.dragOverNodeId === nodeId && cur.dropPosition === position) return;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
            setDragState(prev => ({ ...prev, dragOverNodeId: nodeId, dropPosition: position }));
        });
    }, []);

    const onDragLeave = useCallback((_e: React.DragEvent, _nodeId: string) => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        setDragState(prev => ({ ...prev, dragOverNodeId: null, dropPosition: null }));
    }, []);

    const commitDrop = useCallback((_e: React.DragEvent, targetNodeId: string, position: DropPosition) => {
        const draggingNodeId = dragStateRef.current.draggingNodeId;
        if (!draggingNodeId || draggingNodeId === targetNodeId) {
            endDrag('', '');
            return;
        }
        const state = nodeStore.getState();
        const dragging = state.nodes[draggingNodeId];
        const target = state.nodes[targetNodeId];
        if (!dragging || !target) { endDrag('', ''); return; }

        const draggingParent = dragging.parentId;
        const targetParent = target.parentId;

        if (draggingParent === null && targetParent === null) {
            const layout = [...(state.pageLayouts[activePageIdRef.current] ?? [])];
            const from = layout.indexOf(draggingNodeId);
            const to = layout.indexOf(targetNodeId);
            if (from === -1 || to === -1) { endDrag('', ''); return; }
            layout.splice(from, 1);
            const insertAt = position === 'before' ? to : to + 1;
            layout.splice(insertAt > from ? insertAt - 1 : insertAt, 0, draggingNodeId);
            nodeStore._update(() => ({
                pageLayouts: { ...state.pageLayouts, [activePageIdRef.current]: layout }
            }));
        } else if (draggingParent !== null && draggingParent === targetParent) {
            const parent = state.nodes[draggingParent];
            if (!parent) { endDrag('', ''); return; }
            const children = [...(parent.children ?? [])];
            const from = children.indexOf(draggingNodeId);
            const to = children.indexOf(targetNodeId);
            if (from === -1 || to === -1) { endDrag('', ''); return; }
            children.splice(from, 1);
            const insertAt = position === 'before' ? to : to + 1;
            children.splice(insertAt > from ? insertAt - 1 : insertAt, 0, draggingNodeId);
            dispatcher.dispatch({ nodeId: draggingParent, path: 'children', value: children, type: 'structural', source: 'editor' });
        } else if (position === 'inside') {
            if (draggingParent === null) {
                nodeStore._update(() => ({
                    pageLayouts: {
                        ...state.pageLayouts,
                        [activePageIdRef.current]: (state.pageLayouts[activePageIdRef.current] ?? [])
                            .filter(id => id !== draggingNodeId)
                    }
                }));
            } else if (state.nodes[draggingParent]) {
                dispatcher.dispatch({
                    nodeId: draggingParent,
                    path: 'children',
                    value: (state.nodes[draggingParent].children ?? []).filter(id => id !== draggingNodeId),
                    type: 'structural', source: 'editor'
                });
            }
            dispatcher.dispatch([
                { nodeId: draggingNodeId, path: 'parentId', value: targetNodeId, type: 'structural', source: 'editor' },
                { nodeId: targetNodeId, path: 'children', value: [...(target.children ?? []), draggingNodeId], type: 'structural', source: 'editor' }
            ]);
        } else {
            const newParentId = targetParent;
            if (draggingParent === null) {
                nodeStore._update(() => ({
                    pageLayouts: {
                        ...state.pageLayouts,
                        [activePageIdRef.current]: (state.pageLayouts[activePageIdRef.current] ?? [])
                            .filter(id => id !== draggingNodeId)
                    }
                }));
            } else if (draggingParent !== newParentId && state.nodes[draggingParent]) {
                dispatcher.dispatch({
                    nodeId: draggingParent,
                    path: 'children',
                    value: (state.nodes[draggingParent].children ?? []).filter(id => id !== draggingNodeId),
                    type: 'structural', source: 'editor'
                });
            }
            if (newParentId === null) {
                const layout = [...(state.pageLayouts[activePageIdRef.current] ?? [])];
                const to = layout.indexOf(targetNodeId);
                layout.splice(position === 'before' ? to : to + 1, 0, draggingNodeId);
                nodeStore._update(() => ({
                    pageLayouts: { ...state.pageLayouts, [activePageIdRef.current]: layout }
                }));
            } else if (state.nodes[newParentId]) {
                const children = [...(state.nodes[newParentId].children ?? [])];
                const to = children.indexOf(targetNodeId);
                children.splice(position === 'before' ? to : to + 1, 0, draggingNodeId);
                dispatcher.dispatch([
                    { nodeId: draggingNodeId, path: 'parentId', value: newParentId, type: 'structural', source: 'editor' },
                    { nodeId: newParentId, path: 'children', value: children, type: 'structural', source: 'editor' }
                ]);
            }
        }
        commitHistory();
        endDrag('', '');
    }, [endDrag, commitHistory]);

    const uiValues: UIContextType = {
        isLoading,
        pages, activePageId, setActivePageId: switchPage, addPage, deletePage, updatePageMeta,
        viewport, setViewport, devicePreset, setDevicePreset, orientation, setOrientation,
        zoomLevel, setZoomLevel, showDeviceFrame, toggleDeviceFrame, showSafeAreaOverlay, toggleSafeAreaOverlay,
        mode, setMode, isPreview, saveStatus, activeJobId, isBuilderActive, setIsBuilderActive, hasUnsavedChanges,
        interactionPriority, setInteractionPriority, canInteract, isTyping, setIsTyping,
        editingInfo, setEditingInfo, libraryState, setLibraryState, diagnostics, setDiagnostics,
        theme, updateTheme, nodeStore // OSTT FIX: Attached nodeStore back into context
    };

    const nodeValues: NodesContextType = {
        nodes, pageLayouts, activePageId, nodeTree, selectedNodeId, designSystem, selectNode,
        updateNode, updateDesignSystem, setNodeForcedState, addNode, deleteNode, duplicateNode,
        reorderNode, moveNodeToIndex, reorderPageLayout, undo, redo, commitHistory, saveDraft, publishLive, injectAST, systemHealth
    };

    const omnoraValues = {
        mode,
        viewport,
        nodes,
        selectNode,
        updateNode,
        selectedNodeId,
        isBuilderActive,
        setIsTyping,
        setEditingInfo,
        editingInfo,
        commitHistory,
        diagnostics,
        setLibraryState: uiValues.setLibraryState,
        dragState,
        startDrag,
        endDrag,
        onDragOver,
        onDragLeave,
        commitDrop,
    };

    return (
        <OmnoraContext.Provider value={omnoraValues}>
            <UIContext.Provider value={uiValues}>
                <NodesContext.Provider value={nodeValues}>
                    <BuilderContext.Provider value={{ ...uiValues, ...nodeValues }}>
                        {children}
                    </BuilderContext.Provider>
                </NodesContext.Provider>
            </UIContext.Provider>
        </OmnoraContext.Provider>
    );
};

export const useUI = () => {
    const context = useContext(UIContext);
    if (!context) throw new Error('useUI must be used within a BuilderProvider');
    return context;
};

export const useNodes = () => {
    const context = useContext(NodesContext);
    if (!context) throw new Error('useNodes must be used within a BuilderProvider');
    return context;
};

export const useBuilder = () => {
    const context = useContext(BuilderContext);
    if (!context) throw new Error('useBuilder must be used within a BuilderProvider');
    return context;
};

export const useNode = (id: string) => {
    const { nodes } = useNodes();
    return useMemo(() => nodes[id], [nodes, id]);
};