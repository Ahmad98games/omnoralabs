/**
 * ElementControlLayer.tsx — Omnora OS v6.2
 *
 * FIXES vs v6.1:
 * - [CRITICAL] ToolBtn was receiving `action` prop but declared `onClick` — buttons were dead.
 * - [CRITICAL] Inner element duplication via setTimeout was racy. Replaced with synchronous duplicateInnerElement().
 * - [CRITICAL] pasteElement() for inner-element was reading selectedNodeId from builder context instead of
 *              the source node's own id, causing wrong-target paste on Cmd+D.
 * - ContextMenu handleDelete: node?.props.elements could be undefined — guarded.
 * - useFreePositionDrag: snapTolerance was missing from useCallback deps.
 * - Keyframe <style> tags were being injected into JSX on every render — moved to a single document injection.
 * - useMemo in Provider was missing openMediaPicker / closeMediaPicker in dep array.
 * - MediaPickerModal useEffect had stale interactionPriority capture with empty dep array.
 * - copyElement for 'node' type now deep-clones to prevent shared reference mutation.
 */

import React, {
    useState, useRef, useCallback, useEffect,
    createContext, useContext, useMemo
} from 'react';
import { useBuilder, InteractionPriority } from '../../../context/BuilderContext';
import { useMediaStore } from '../../client/AssetContext';
import { dispatcher } from '../../../platform/core/Dispatcher';
import { nodeStore } from '../../../platform/core/NodeStore';

// ─── Types ────────────────────────────────────────────────────────────────────
export type ElementType = 'image' | 'text' | 'button' | 'badge' | 'container' | 'logo';
export type ResizeDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
export type AnimationPreset =
    | 'none' | 'fadeIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight'
    | 'zoomIn' | 'zoomOut' | 'bounce' | 'pulse' | 'shake' | 'flip';

export interface ElementSelection {
    nodeId: string;
    elementId: string;
    elementType: ElementType;
    rect: DOMRect;
    props?: Record<string, any>;
}

interface MediaPickerTarget {
    nodeId: string;
    propPath: string;
    currentUrl?: string;
    onSelect: (url: string) => void;
}

// ─── Clipboard ────────────────────────────────────────────────────────────────
interface ClipboardEntry {
    type: 'node' | 'inner-element' | 'styles';
    nodeId: string;
    elementId?: string;
    data?: Record<string, any>;
    styles?: Record<string, any>;
}
let _clipboard: ClipboardEntry | null = null;

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
    accent: '#818cf8', accentDim: 'rgba(129,140,248,0.12)', accentGlow: 'rgba(129,140,248,0.3)',
    teal: '#2dd4bf', tealDim: 'rgba(45,212,191,0.1)',
    danger: '#f87171', dangerDim: 'rgba(248,113,113,0.12)',
    warn: '#fbbf24', green: '#34d399', greenDim: 'rgba(52,211,153,0.1)',
    bg0: '#09090b', bg1: '#141417', bg2: '#1c1c21', bg3: '#26262d',
    border0: 'rgba(255,255,255,0.04)', border1: 'rgba(255,255,255,0.08)', border2: 'rgba(255,255,255,0.14)',
    t0: '#f4f4f5', t1: '#a1a1aa', t2: '#71717a', white: '#ffffff',
} as const;

// ─── Keyframe injection — runs once at module evaluation ──────────────────────
const KEYFRAMES = `
    @keyframes ctxIn { from { opacity:0; transform:scale(0.93) translateY(-6px); } to { opacity:1; transform:scale(1) translateY(0); } }
    @keyframes tbIn  { from { opacity:0; transform:scale(0.88) translateY(6px); filter:blur(4px); } to { opacity:1; transform:scale(1) translateY(0); filter:blur(0); } }
    @keyframes mpIn  { from { opacity:0; transform:scale(0.9) translateY(20px); filter:blur(8px); } to { opacity:1; transform:scale(1) translateY(0); filter:blur(0); } }
    @keyframes mpT   { from { opacity:0; transform:translateY(10px) scale(0.94); } to { opacity:1; transform:translateY(0) scale(1); } }
`;
(function injectKeyframes() {
    if (typeof document === 'undefined' || document.getElementById('omnora-ecl-keyframes')) return;
    const el = document.createElement('style');
    el.id = 'omnora-ecl-keyframes';
    el.textContent = KEYFRAMES;
    document.head.appendChild(el);
})();

// ─── Context ──────────────────────────────────────────────────────────────────
interface ElementControlState {
    selectedElement: ElementSelection | null;
    selectElement: (sel: ElementSelection | null) => void;
    hoveredElementId: string | null;
    setHoveredElementId: (id: string | null) => void;
    mediaPickerOpen: boolean;
    openMediaPicker: (target: MediaPickerTarget) => void;
    closeMediaPicker: () => void;
    mediaPickerTarget: MediaPickerTarget | null;
    copyElement: (sel: ElementSelection | string) => void;
    pasteElement: (intoNodeId?: string) => void;
    copyStyles: (sel: ElementSelection | string) => void;
    pasteStyles: (targetId: string) => void;
    duplicateInnerElement: (sel: ElementSelection) => void;
    hasClipboard: boolean;
    clipboardType: ClipboardEntry['type'] | null;
    contextMenu: { x: number; y: number; sel: ElementSelection | string } | null;
    openContextMenu: (x: number, y: number, sel: ElementSelection | string) => void;
    closeContextMenu: () => void;
}

export const ElementControlContext = createContext<ElementControlState>({
    selectedElement: null, selectElement: () => { },
    hoveredElementId: null, setHoveredElementId: () => { },
    mediaPickerOpen: false, openMediaPicker: () => { },
    closeMediaPicker: () => { }, mediaPickerTarget: null,
    copyElement: () => { }, pasteElement: () => { },
    copyStyles: () => { }, pasteStyles: () => { },
    duplicateInnerElement: () => { },
    hasClipboard: false, clipboardType: null,
    contextMenu: null, openContextMenu: () => { }, closeContextMenu: () => { },
});

export const useElementControl = () => useContext(ElementControlContext);

// ─── Provider ─────────────────────────────────────────────────────────────────
export const ElementControlProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { deleteNode, duplicateNode, selectNode, selectedNodeId, addNode } = useBuilder();

    const [selectedElement, setSelectedElement] = useState<ElementSelection | null>(null);
    const [hoveredElementId, setHoveredElementId] = useState<string | null>(null);
    const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
    const [mediaPickerTarget, setMediaPickerTarget] = useState<MediaPickerTarget | null>(null);
    const [hasClipboard, setHasClipboard] = useState(false);
    const [clipboardType, setClipboardType] = useState<ClipboardEntry['type'] | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; sel: ElementSelection | string } | null>(null);

    const copyElement = useCallback((target: ElementSelection | string) => {
        const nodeId = typeof target === 'string' ? target : target.nodeId;
        const elementId = typeof target === 'string' ? nodeId : target.elementId;
        const node = nodeStore.getNode(nodeId);
        if (!node) return;

        if (elementId === nodeId) {
            // Deep-clone to prevent shared-reference mutation between copy and source.
            _clipboard = {
                type: 'node',
                nodeId,
                data: JSON.parse(JSON.stringify(node.props ?? {})),
                styles: JSON.parse(JSON.stringify(node.styles ?? {})),
            };
        } else {
            const innerData = node.props?.elements?.[elementId];
            if (!innerData) return;
            _clipboard = {
                type: 'inner-element',
                nodeId,
                elementId,
                data: JSON.parse(JSON.stringify(innerData)),
            };
        }

        setClipboardType(_clipboard.type);
        setHasClipboard(true);
    }, []);

    // FIX: accepts an explicit targetNodeId so Cmd+D inner-element duplication
    // pastes into the *source* node rather than whatever the builder has selected.
    const pasteElement = useCallback((intoNodeId?: string) => {
        if (!_clipboard) return;

        if (_clipboard.type === 'node') {
            const src = nodeStore.getNode(_clipboard.nodeId);
            if (src) addNode(src.type, _clipboard.data, src.parentId);
            return;
        }

        if (_clipboard.type === 'inner-element') {
            const targetId = intoNodeId ?? selectedNodeId;
            if (!targetId) return;
            const targetNode = nodeStore.getNode(targetId);
            if (!targetNode?.props?.elements) return;

            const newId = `el_${Date.now()}`;
            const cloned = JSON.parse(JSON.stringify(_clipboard.data)) as Record<string, any>;
            cloned.id = newId;

            if (cloned.style) {
                cloned.style.top = `${(parseInt(cloned.style.top as string) || 0) + 20}px`;
                cloned.style.left = `${(parseInt(cloned.style.left as string) || 0) + 20}px`;
            }

            dispatcher.dispatch({
                nodeId: targetId,
                path: 'props.elements',
                value: { ...targetNode.props.elements, [newId]: cloned },
                type: 'structural',
                source: 'editor',
            });
        }
    }, [addNode, selectedNodeId]);

    // FIX: synchronous — no setTimeout, no clipboard mutation between operations.
    const duplicateInnerElement = useCallback((sel: ElementSelection) => {
        const node = nodeStore.getNode(sel.nodeId);
        const src = node?.props?.elements?.[sel.elementId];
        if (!src) return;

        const newId = `el_${Date.now()}`;
        const cloned = JSON.parse(JSON.stringify(src)) as Record<string, any>;
        cloned.id = newId;

        if (cloned.style) {
            cloned.style.top = `${(parseInt(cloned.style.top as string) || 0) + 20}px`;
            cloned.style.left = `${(parseInt(cloned.style.left as string) || 0) + 20}px`;
        }

        dispatcher.dispatch({
            nodeId: sel.nodeId,
            path: 'props.elements',
            value: { ...node!.props.elements, [newId]: cloned },
            type: 'structural',
            source: 'editor',
        });
    }, []);

    const copyStyles = useCallback((target: ElementSelection | string) => {
        const nodeId = typeof target === 'string' ? target : target.nodeId;
        const node = nodeStore.getNode(nodeId);
        if (!node) return;
        _clipboard = { type: 'styles', nodeId, styles: JSON.parse(JSON.stringify(node.styles ?? {})) };
        setHasClipboard(true);
        setClipboardType('styles');
    }, []);

    const pasteStyles = useCallback((targetId: string) => {
        if (!_clipboard?.styles) return;
        dispatcher.dispatch({
            nodeId: targetId,
            path: 'styles',
            value: JSON.parse(JSON.stringify(_clipboard.styles)),
            type: 'visual',
            source: 'editor',
        });
    }, []);

    const openContextMenu = useCallback((x: number, y: number, sel: ElementSelection | string) => setContextMenu({ x, y, sel }), []);
    const closeContextMenu = useCallback(() => setContextMenu(null), []);
    const openMediaPicker = useCallback((t: MediaPickerTarget) => { setMediaPickerTarget(t); setMediaPickerOpen(true); }, []);
    const closeMediaPicker = useCallback(() => { setMediaPickerOpen(false); setMediaPickerTarget(null); }, []);

    // ── Global Keyboard Shortcuts ─────────────────────────────────────────────
    // Wrap mutable context in refs so the handler never goes stale between renders.
    const kbRef = useRef({
        selectedNodeId, selectedElement,
        deleteNode, duplicateNode, selectNode,
        copyElement, pasteElement, pasteStyles, duplicateInnerElement, closeContextMenu,
    });
    useEffect(() => {
        kbRef.current = {
            selectedNodeId, selectedElement,
            deleteNode, duplicateNode, selectNode,
            copyElement, pasteElement, pasteStyles, duplicateInnerElement, closeContextMenu,
        };
    });

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const {
                selectedNodeId: nodeIdCtx, selectedElement: sel,
                deleteNode: del, duplicateNode: dup, selectNode: selNode,
                copyElement: copy, pasteElement: paste, pasteStyles: pasteStyle,
                duplicateInnerElement: dupInner, closeContextMenu: closeCtx,
            } = kbRef.current;

            // Resolve actual target through Shadow DOM
            const target = (e.composedPath()?.[0] as HTMLElement) || (e.target as HTMLElement);
            const tag = target.tagName;
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || target.isContentEditable) return;

            const isInner = sel && sel.elementId !== sel.nodeId;
            const targetNodeId = sel ? sel.nodeId : nodeIdCtx;
            if (!targetNodeId) return;

            const meta = e.metaKey || e.ctrlKey;

            // Delete / Backspace
            if ((e.key === 'Delete' || e.key === 'Backspace') && !meta) {
                e.preventDefault();
                if (isInner && sel) {
                    const node = nodeStore.getNode(sel.nodeId);
                    const elements = node?.props?.elements;
                    if (elements && sel.elementId in elements) {
                        const next = { ...elements };
                        delete next[sel.elementId];
                        dispatcher.dispatch({ nodeId: sel.nodeId, path: 'props.elements', value: next, type: 'structural', source: 'editor' });
                    }
                } else {
                    del(targetNodeId);
                    selNode(null);
                }
                setSelectedElement(null);
                return;
            }

            if (e.key === 'Escape') {
                selNode(null); setSelectedElement(null); closeCtx();
                return;
            }

            // Cmd+D — FIX: inner elements use synchronous duplicateInnerElement.
            if (meta && e.key === 'd') {
                e.preventDefault();
                if (isInner && sel) {
                    dupInner(sel);
                } else {
                    dup(targetNodeId);
                }
                return;
            }

            if (meta && e.key === 'c') { copy(sel ?? targetNodeId); return; }

            // Cmd+V
            if (meta && !e.shiftKey && e.key === 'v') {
                e.preventDefault();
                // FIX: for inner-element paste, explicitly target the active node.
                paste(targetNodeId);
                return;
            }

            // Cmd+Shift+V
            if (meta && e.shiftKey && (e.key === 'v' || e.key === 'V')) {
                e.preventDefault();
                pasteStyle(targetNodeId);
                return;
            }

            // Arrow nudge
            if (!e.key.startsWith('Arrow')) return;
            e.preventDefault();
            const nudge = e.shiftKey ? 10 : 1;
            const node = nodeStore.getNode(targetNodeId);
            if (!node) return;

            let pathX = 'styles.left';
            let pathY = 'styles.top';
            let posX = parseInt(node.styles?.left as string || '0') || 0;
            let posY = parseInt(node.styles?.top as string || '0') || 0;

            if (isInner && sel) {
                const inner = node.props?.elements?.[sel.elementId]?.style;
                pathX = `props.elements.${sel.elementId}.style.left`;
                pathY = `props.elements.${sel.elementId}.style.top`;
                posX = parseInt(inner?.left || '0') || 0;
                posY = parseInt(inner?.top || '0') || 0;
            }

            const [dx, dy] = ({
                ArrowLeft: [-nudge, 0], ArrowRight: [nudge, 0],
                ArrowUp: [0, -nudge], ArrowDown: [0, nudge],
            } as Record<string, [number, number]>)[e.key] ?? [0, 0];

            if (dx !== 0) dispatcher.dispatch({ nodeId: targetNodeId, path: pathX, value: `${posX + dx}px`, type: 'visual', source: 'editor' });
            if (dy !== 0) dispatcher.dispatch({ nodeId: targetNodeId, path: pathY, value: `${posY + dy}px`, type: 'visual', source: 'editor' });
        };

        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
        // Intentionally empty: kbRef keeps all deps current without re-subscribing.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const value = useMemo<ElementControlState>(() => ({
        selectedElement, selectElement: setSelectedElement,
        hoveredElementId, setHoveredElementId,
        mediaPickerOpen, openMediaPicker, closeMediaPicker, mediaPickerTarget,
        copyElement, pasteElement, copyStyles, pasteStyles, duplicateInnerElement,
        hasClipboard, clipboardType,
        contextMenu, openContextMenu, closeContextMenu,
    }), [
        selectedElement, hoveredElementId,
        mediaPickerOpen, openMediaPicker, closeMediaPicker, mediaPickerTarget,
        copyElement, pasteElement, copyStyles, pasteStyles, duplicateInnerElement,
        hasClipboard, clipboardType,
        contextMenu, openContextMenu, closeContextMenu,
    ]);

    return (
        <ElementControlContext.Provider value={value}>
            {children}
            {mediaPickerOpen && mediaPickerTarget && (
                <MediaPickerModal
                    target={mediaPickerTarget}
                    onClose={closeMediaPicker}
                    onSelect={url => { mediaPickerTarget.onSelect(url); closeMediaPicker(); }}
                />
            )}
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x} y={contextMenu.y}
                    sel={contextMenu.sel}
                    onClose={closeContextMenu}
                />
            )}
        </ElementControlContext.Provider>
    );
};

// ─── Context Menu ─────────────────────────────────────────────────────────────
const ContextMenu: React.FC<{
    x: number; y: number;
    sel: ElementSelection | string;
    onClose: () => void;
}> = ({ x, y, sel, onClose }) => {
    const { deleteNode, duplicateNode, selectNode } = useBuilder();
    const {
        copyElement, pasteElement, copyStyles, pasteStyles,
        hasClipboard, clipboardType, duplicateInnerElement,
    } = useElementControl();

    const isInner = typeof sel !== 'string' && sel.elementId !== sel.nodeId;
    const nodeId = typeof sel === 'string' ? sel : sel.nodeId;
    const node = nodeStore.getNode(nodeId);

    useEffect(() => {
        const onDown = (e: MouseEvent) => {
            // Only close if the click is outside this menu.
            // The menu itself calls e.stopPropagation() so this only fires for outside clicks.
            onClose();
        };
        window.addEventListener('mousedown', onDown);
        return () => window.removeEventListener('mousedown', onDown);
    }, [onClose]);

    const W = 220;
    const cx = Math.min(x, window.innerWidth - W - 8);
    const cy = Math.min(y, window.innerHeight - 340);

    const handleDuplicate = () => {
        // FIX: use synchronous inner-element duplication; no setTimeout hack.
        if (isInner && typeof sel !== 'string') {
            duplicateInnerElement(sel);
        } else {
            duplicateNode(nodeId);
        }
        onClose();
    };

    const handleDelete = () => {
        if (isInner && typeof sel !== 'string') {
            const elements = node?.props?.elements;
            // FIX: guard — elements may be undefined.
            if (elements && sel.elementId in elements) {
                const next = { ...elements };
                delete next[sel.elementId];
                dispatcher.dispatch({ nodeId, path: 'props.elements', value: next, type: 'structural', source: 'editor' });
            }
        } else {
            deleteNode(nodeId);
            selectNode(null);
        }
        onClose();
    };

    type Item = {
        icon: string; label: string; shortcut?: string;
        action: () => void; danger?: boolean; disabled?: boolean;
    };

    const items: (Item | 'sep')[] = [
        {
            icon: '⬡', label: isInner ? 'Select Container' : 'Select Parent',
            action: () => {
                if (isInner) selectNode(nodeId);
                else if (node?.parentId) selectNode(node.parentId);
                onClose();
            },
        },
        'sep',
        { icon: '⎘', label: 'Duplicate', shortcut: '⌘D', action: handleDuplicate },
        { icon: '⊞', label: 'Copy Element', shortcut: '⌘C', action: () => { copyElement(sel); onClose(); } },
        { icon: '⎙', label: 'Copy Styles', action: () => { copyStyles(sel); onClose(); }, disabled: isInner },
        {
            icon: '⊟', label: 'Paste Element', shortcut: '⌘V',
            disabled: !hasClipboard || clipboardType === 'styles',
            action: () => { pasteElement(nodeId); onClose(); },
        },
        {
            icon: '◈', label: 'Paste Styles', shortcut: '⌘⇧V',
            disabled: !hasClipboard || clipboardType !== 'styles' || isInner,
            action: () => { pasteStyles(nodeId); onClose(); },
        },
        'sep',
        {
            icon: node?.isLocked ? '🔓' : '🔒',
            label: node?.isLocked ? 'Unlock Layer' : 'Lock Layer',
            disabled: isInner,
            action: () => {
                dispatcher.dispatch({ nodeId, path: 'isLocked', value: !node?.isLocked, type: 'structural', source: 'editor' });
                onClose();
            },
        },
        'sep',
        { icon: '✕', label: 'Delete', shortcut: '⌫', danger: true, action: handleDelete },
    ];

    return (
        <div
            style={{
                position: 'fixed', top: cy, left: cx, zIndex: 99998, width: W,
                background: T.bg1, border: `1px solid ${T.border1}`,
                borderRadius: 12, padding: 6,
                boxShadow: `0 24px 64px rgba(0,0,0,0.75), 0 0 0 1px ${T.border0}`,
                fontFamily: "'DM Mono', monospace",
                animation: 'ctxIn 0.12s cubic-bezier(0.16,1,0.3,1)',
            }}
            onMouseDown={e => e.stopPropagation()}
        >
            <div style={{ padding: '6px 10px 8px', borderBottom: `1px solid ${T.border0}`, marginBottom: 4 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: T.accent, letterSpacing: '0.12em' }}>
                    {isInner ? 'ELEMENT' : node?.type?.toUpperCase() ?? 'NODE'}
                </span>
                <span style={{ fontSize: 9, color: T.t2, marginLeft: 6 }}>
                    #{(typeof sel === 'string' ? sel : sel.elementId).slice(-6)}
                </span>
            </div>
            {items.map((item, i) =>
                item === 'sep'
                    ? <div key={i} style={{ height: 1, background: T.border0, margin: '4px 0' }} />
                    : <CtxBtn key={i} {...item} />
            )}
        </div>
    );
};

const CtxBtn: React.FC<{
    icon: string; label: string; shortcut?: string;
    action: () => void; danger?: boolean; disabled?: boolean;
}> = ({ icon, label, shortcut, action, danger, disabled }) => {
    const [hov, setHov] = useState(false);
    return (
        <button
            onClick={disabled ? undefined : action}
            onMouseEnter={() => !disabled && setHov(true)}
            onMouseLeave={() => setHov(false)}
            disabled={disabled}
            style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 10px', border: 'none', borderRadius: 7,
                background: hov ? (danger ? T.dangerDim : T.bg3) : 'transparent',
                color: disabled ? T.t2 : hov ? (danger ? T.danger : T.t0) : T.t1,
                fontSize: 12, fontWeight: 500, cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.1s', fontFamily: 'inherit', textAlign: 'left',
                opacity: disabled ? 0.4 : 1,
            }}
        >
            <span style={{ width: 16, textAlign: 'center', fontSize: 11 }}>{icon}</span>
            <span style={{ flex: 1 }}>{label}</span>
            {shortcut && <span style={{ fontSize: 10, color: T.t2 }}>{shortcut}</span>}
        </button>
    );
};

// ─── Element Toolbar ──────────────────────────────────────────────────────────
interface ElementToolbarProps {
    rect: DOMRect;
    nodeId: string;
    elementType: ElementType;
    elementId?: string;
    label?: string;
    onReplace?: () => void;
    onEdit?: () => void;
    onFitToggle?: () => void;
}

export const ElementToolbar: React.FC<ElementToolbarProps> = ({
    rect, nodeId, elementType, elementId, label = elementType,
    onReplace, onEdit, onFitToggle,
}) => {
    const { deleteNode, duplicateNode, selectNode } = useBuilder();
    const {
        copyElement, pasteStyles, hasClipboard, clipboardType,
        selectedElement, duplicateInnerElement,
    } = useElementControl();

    const node = nodeStore.getNode(nodeId);
    const isInner = !!(elementId && elementId !== nodeId);
    const isLocked = node?.isLocked ?? false;

    let zVal = parseInt(node?.styles?.zIndex as string || '0') || 0;
    let zPath = 'styles.zIndex';
    if (isInner && elementId) {
        zVal = parseInt(node?.props?.elements?.[elementId]?.style?.zIndex || '0') || 0;
        zPath = `props.elements.${elementId}.style.zIndex`;
    }

    const handleDuplicate = () => {
        // FIX: synchronous — no setTimeout.
        if (isInner && selectedElement) {
            duplicateInnerElement(selectedElement);
        } else {
            duplicateNode(nodeId);
        }
    };

    const handleDelete = () => {
        if (isInner && elementId) {
            const elements = node?.props?.elements;
            if (elements && elementId in elements) {
                const next = { ...elements };
                delete next[elementId];
                dispatcher.dispatch({ nodeId, path: 'props.elements', value: next, type: 'structural', source: 'editor' });
            }
        } else {
            deleteNode(nodeId);
            selectNode(null);
        }
    };

    // FIX: tools array now uses `action` key consistently to match ToolBtn's actual prop name.
    type ToolItem = { icon: string; tip: string; action?: () => void; primary?: boolean; danger?: boolean; active?: boolean; disabled?: boolean };
    const tools: (ToolItem | 'sep')[] = [
        ...(elementType === 'image' || elementType === 'logo'
            ? [
                { icon: '⊞', tip: 'Replace Image', action: onReplace, primary: true },
                { icon: '⊡', tip: 'Toggle Fit', action: onFitToggle },
            ] satisfies ToolItem[]
            : []),
        ...(elementType === 'text' || elementType === 'button'
            ? [{ icon: '✎', tip: 'Edit Content', action: onEdit, primary: true }] satisfies ToolItem[]
            : []),
        'sep',
        { icon: '↑', tip: 'Bring Forward', action: () => dispatcher.dispatch({ nodeId, path: zPath, value: String(zVal + 1), type: 'visual', source: 'editor' }) },
        { icon: '↓', tip: 'Send Backward', action: () => dispatcher.dispatch({ nodeId, path: zPath, value: String(Math.max(0, zVal - 1)), type: 'visual', source: 'editor' }) },
        'sep',
        { icon: '⎘', tip: 'Copy (⌘C)', action: () => copyElement(selectedElement ?? nodeId) },
        {
            icon: '◈', tip: 'Paste Styles (⌘⇧V)',
            action: () => pasteStyles(nodeId),
            disabled: isInner || !hasClipboard || clipboardType !== 'styles',
        },
        'sep',
        { icon: '⊕', tip: 'Duplicate (⌘D)', action: handleDuplicate },
        {
            icon: isLocked ? '🔓' : '🔒',
            tip: isLocked ? 'Unlock' : 'Lock',
            action: () => dispatcher.dispatch({ nodeId, path: 'isLocked', value: !isLocked, type: 'structural', source: 'editor' }),
            active: isLocked, disabled: isInner,
        },
        'sep',
        { icon: '✕', tip: 'Delete (⌫)', action: handleDelete, danger: true },
    ];

    const topPos = rect.top > 52 ? rect.top - 48 : rect.bottom + 10;
    const leftPos = Math.max(8, Math.min(rect.left, window.innerWidth - 420 - 8));

    return (
        <div style={{
            position: 'fixed', top: topPos, left: leftPos,
            display: 'flex', alignItems: 'center', gap: 2,
            background: T.bg1, border: `1px solid ${T.border1}`,
            borderRadius: 11, padding: '4px 6px',
            boxShadow: `0 12px 40px rgba(0,0,0,0.65), 0 0 0 1px ${T.border0}`,
            zIndex: 10011, pointerEvents: 'auto',
            animation: 'tbIn 0.16s cubic-bezier(0.16,1,0.3,1)',
            fontFamily: "'DM Mono', monospace",
        }}>
            <span style={{
                fontSize: 9, fontWeight: 700, color: T.accent,
                padding: '2px 8px', background: T.accentDim,
                border: `1px solid ${T.accentGlow}`,
                borderRadius: 5, marginRight: 2,
                textTransform: 'uppercase', letterSpacing: '0.1em',
            }}>{label}</span>
            <div style={{ width: 1, height: 16, background: T.border1, margin: '0 2px' }} />
            {tools.map((t, i) =>
                t === 'sep'
                    ? <div key={i} style={{ width: 1, height: 16, background: T.border1, margin: '0 1px' }} />
                    : <ToolBtn key={i} {...t} />
            )}
        </div>
    );
};

// FIX: prop is `action`, not `onClick` — was the root cause of dead toolbar buttons.
const ToolBtn: React.FC<{
    icon: string; tip: string; action?: () => void;
    primary?: boolean; danger?: boolean; active?: boolean; disabled?: boolean;
}> = ({ icon, tip, action, primary, danger, active, disabled }) => {
    const [hov, setHov] = useState(false);
    return (
        <button
            title={tip}
            onClick={e => { e.stopPropagation(); if (!disabled) action?.(); }}
            onMouseEnter={() => !disabled && setHov(true)}
            onMouseLeave={() => setHov(false)}
            disabled={disabled}
            style={{
                width: 28, height: 28, borderRadius: 6, border: 'none',
                cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: hov ? (danger ? T.dangerDim : primary ? T.accentDim : T.bg3) : active ? T.accentDim : 'transparent',
                color: disabled ? T.t2 : hov ? (danger ? T.danger : primary ? T.accent : T.t0) : active ? T.accent : T.t1,
                transition: 'all 0.1s', opacity: disabled ? 0.3 : 1,
            }}
        >{icon}</button>
    );
};

// ─── Animation Presets ────────────────────────────────────────────────────────
const ANIMATION_PRESETS: { id: AnimationPreset; label: string; css: string }[] = [
    { id: 'none', label: 'None', css: '' },
    { id: 'fadeIn', label: 'Fade In', css: 'omnora-fadeIn 0.6s ease both' },
    { id: 'slideUp', label: 'Slide Up', css: 'omnora-slideUp 0.6s cubic-bezier(0.16,1,0.3,1) both' },
    { id: 'slideDown', label: 'Slide Down', css: 'omnora-slideDown 0.6s cubic-bezier(0.16,1,0.3,1) both' },
    { id: 'slideLeft', label: 'Slide Left', css: 'omnora-slideLeft 0.6s cubic-bezier(0.16,1,0.3,1) both' },
    { id: 'slideRight', label: 'Slide →', css: 'omnora-slideRight 0.6s cubic-bezier(0.16,1,0.3,1) both' },
    { id: 'zoomIn', label: 'Zoom In', css: 'omnora-zoomIn 0.5s cubic-bezier(0.16,1,0.3,1) both' },
    { id: 'zoomOut', label: 'Zoom Out', css: 'omnora-zoomOut 0.5s ease both' },
    { id: 'bounce', label: 'Bounce', css: 'omnora-bounce 0.8s ease both' },
    { id: 'pulse', label: 'Pulse', css: 'omnora-pulse 1.2s ease infinite' },
    { id: 'shake', label: 'Shake', css: 'omnora-shake 0.5s ease both' },
    { id: 'flip', label: 'Flip', css: 'omnora-flip 0.7s ease both' },
];

interface AnimationPanelProps {
    rect: DOMRect; nodeId: string; currentPreset?: AnimationPreset; onClose: () => void;
}

export const AnimationPanel: React.FC<AnimationPanelProps> = ({ rect, nodeId, currentPreset = 'none', onClose }) => {
    const [sel, setSel] = useState<AnimationPreset>(currentPreset);

    const apply = (p: AnimationPreset) => {
        setSel(p);
        const found = ANIMATION_PRESETS.find(x => x.id === p);
        dispatcher.dispatch([
            { nodeId, path: 'props.animationPreset', value: p, type: 'structural', source: 'editor' },
            { nodeId, path: 'styles.animation', value: found?.css ?? '', type: 'visual', source: 'editor' },
        ]);
    };

    const left = Math.max(8, Math.min(rect.left, window.innerWidth - 240 - 8));

    return (
        <div
            style={{
                position: 'fixed', top: rect.bottom + 10, left, width: 236,
                background: T.bg1, border: `1px solid ${T.border1}`,
                borderRadius: 14, padding: 14, zIndex: 10014,
                boxShadow: '0 24px 60px rgba(0,0,0,0.65)',
                animation: 'tbIn 0.14s cubic-bezier(0.16,1,0.3,1)',
                fontFamily: "'DM Mono', monospace",
            }}
            onClick={e => e.stopPropagation()}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: T.t2, letterSpacing: '0.1em' }}>SCROLL ANIMATION</span>
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.t2, cursor: 'pointer', fontSize: 12 }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {ANIMATION_PRESETS.map(({ id, label }) => (
                    <button key={id} onClick={() => apply(id)} style={{
                        padding: '7px 8px',
                        border: `1px solid ${sel === id ? T.accent : T.border1}`,
                        borderRadius: 7,
                        background: sel === id ? T.accentDim : T.bg2,
                        color: sel === id ? T.accent : T.t1,
                        fontSize: 10, fontWeight: sel === id ? 700 : 500,
                        cursor: 'pointer', transition: 'all 0.15s', letterSpacing: '0.03em',
                    }}>{label}</button>
                ))}
            </div>
        </div>
    );
};

// ─── Align Panel ──────────────────────────────────────────────────────────────
export const AlignPanel: React.FC<{ rect: DOMRect; nodeId: string; onClose: () => void }> = ({ rect, nodeId, onClose }) => {
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - 220 - 8));
    const d = (path: string, value: string) => { dispatcher.dispatch({ nodeId, path, value, type: 'visual', source: 'editor' }); onClose(); };

    const btns = [
        { icon: '⊢', tip: 'Align Left', action: () => d('styles.marginLeft', '0') },
        { icon: '⊣', tip: 'Center Horiz', action: () => d('styles.margin', '0 auto') },
        { icon: '⊣', tip: 'Align Right', action: () => d('styles.marginLeft', 'auto') },
        { icon: '⊤', tip: 'Align Top', action: () => d('styles.marginTop', '0') },
        { icon: '⊥', tip: 'Center Vert', action: () => d('styles.margin', 'auto') },
        { icon: '⊥', tip: 'Align Bottom', action: () => d('styles.marginTop', 'auto') },
    ];

    return (
        <div
            style={{
                position: 'fixed', top: rect.bottom + 10, left,
                background: T.bg1, border: `1px solid ${T.border1}`,
                borderRadius: 12, padding: 12, zIndex: 10014,
                boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                animation: 'tbIn 0.14s cubic-bezier(0.16,1,0.3,1)',
                fontFamily: "'DM Mono', monospace",
            }}
            onClick={e => e.stopPropagation()}
        >
            <div style={{ fontSize: 9, fontWeight: 700, color: T.t2, letterSpacing: '0.1em', marginBottom: 10 }}>ALIGN</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5 }}>
                {btns.map((b, i) => (
                    <button key={i} onClick={b.action} title={b.tip} style={{
                        width: 36, height: 32, border: `1px solid ${T.border1}`,
                        borderRadius: 6, background: T.bg2, color: T.t1, fontSize: 14,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.1s',
                    }}
                        onMouseEnter={e => { e.currentTarget.style.background = T.bg3; e.currentTarget.style.color = T.t0; }}
                        onMouseLeave={e => { e.currentTarget.style.background = T.bg2; e.currentTarget.style.color = T.t1; }}
                    >{b.icon}</button>
                ))}
            </div>
        </div>
    );
};

// ─── Grid Overlay ─────────────────────────────────────────────────────────────
export const GridOverlay: React.FC<{ columns?: number; gap?: number; visible: boolean }> = ({ columns = 12, gap = 24, visible }) => {
    if (!visible) return null;
    return (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, display: 'flex', justifyContent: 'center', padding: '0 24px' }}>
            <div style={{ maxWidth: 1200, width: '100%', display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap, opacity: 0.06 }}>
                {Array.from({ length: columns }).map((_, i) => (
                    <div key={i} style={{ background: T.accent, borderRadius: 2 }} />
                ))}
            </div>
        </div>
    );
};

// ─── Resize Handles ───────────────────────────────────────────────────────────
const HANDLE_DEFS: { dir: ResizeDir; cursor: string; pos: React.CSSProperties }[] = [
    { dir: 'n', cursor: 'ns-resize', pos: { top: -5, left: '50%', transform: 'translateX(-50%)' } },
    { dir: 's', cursor: 'ns-resize', pos: { bottom: -5, left: '50%', transform: 'translateX(-50%)' } },
    { dir: 'e', cursor: 'ew-resize', pos: { top: '50%', right: -5, transform: 'translateY(-50%)' } },
    { dir: 'w', cursor: 'ew-resize', pos: { top: '50%', left: -5, transform: 'translateY(-50%)' } },
    { dir: 'ne', cursor: 'nesw-resize', pos: { top: -5, right: -5 } },
    { dir: 'nw', cursor: 'nwse-resize', pos: { top: -5, left: -5 } },
    { dir: 'se', cursor: 'nwse-resize', pos: { bottom: -5, right: -5 } },
    { dir: 'sw', cursor: 'nesw-resize', pos: { bottom: -5, left: -5 } },
];

export const ElementResizeHandles: React.FC<{
    rect: DOMRect;
    onResizeStart: (dir: ResizeDir, e: React.MouseEvent) => void;
    liveW?: number | null;
    liveH?: number | null;
}> = ({ rect, onResizeStart, liveW, liveH }) => (
    <>
        <div style={{
            position: 'fixed', top: rect.top - 1, left: rect.left - 1,
            width: rect.width + 2, height: rect.height + 2,
            border: `2px solid ${T.teal}`,
            boxShadow: `0 0 0 1px rgba(0,0,0,0.3), inset 0 0 0 1px ${T.tealDim}`,
            pointerEvents: 'none', zIndex: 10008, borderRadius: 3,
        }} />
        <div style={{ position: 'fixed', top: rect.top, left: rect.left, width: rect.width, height: rect.height, pointerEvents: 'none', zIndex: 10009 }}>
            {HANDLE_DEFS.map(({ dir, cursor, pos }) => (
                <div
                    key={dir}
                    onMouseDown={e => onResizeStart(dir, e)}
                    style={{
                        position: 'absolute', width: 10, height: 10,
                        background: T.bg0, border: `2px solid ${T.teal}`,
                        borderRadius: 3, cursor, pointerEvents: 'auto',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.4)', transition: 'transform 0.1s, background 0.1s',
                        ...pos,
                    }}
                    onMouseEnter={e => { const el = e.currentTarget; el.style.transform = ((pos.transform as string) || '') + ' scale(1.5)'; el.style.background = T.teal; }}
                    onMouseLeave={e => { const el = e.currentTarget; el.style.transform = (pos.transform as string) || ''; el.style.background = T.bg0; }}
                />
            ))}
        </div>
        {(liveW != null || liveH != null) && (
            <div style={{
                position: 'fixed', top: rect.bottom + 8,
                left: rect.left + rect.width / 2, transform: 'translateX(-50%)',
                background: T.bg0, color: T.teal, border: `1px solid ${T.tealDim}`,
                padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                whiteSpace: 'nowrap', zIndex: 10012, pointerEvents: 'none',
                fontFamily: "'DM Mono', monospace",
            }}>
                {liveW ?? Math.round(rect.width)}
                <span style={{ opacity: 0.35, margin: '0 4px' }}>×</span>
                {liveH ?? Math.round(rect.height)}
                <span style={{ opacity: 0.35, marginLeft: 4 }}>px</span>
            </div>
        )}
    </>
);

// ─── Smart Guides ─────────────────────────────────────────────────────────────
export interface SmartGuide { type: 'h' | 'v'; pos: number; label?: string }

export const SmartGuides: React.FC<{ guides: SmartGuide[] }> = ({ guides }) => (
    <>
        {guides.map((g, i) => (
            <React.Fragment key={i}>
                <div style={{
                    position: 'fixed',
                    ...(g.type === 'h'
                        ? { top: g.pos, left: 0, right: 0, height: 1 }
                        : { left: g.pos, top: 0, bottom: 0, width: 1 }),
                    background: T.warn, opacity: 0.85, pointerEvents: 'none', zIndex: 10010,
                    boxShadow: `0 0 6px ${T.warn}`,
                }} />
                {g.label && (
                    <div style={{
                        position: 'fixed',
                        ...(g.type === 'h' ? { top: g.pos - 18, left: 8 } : { left: g.pos + 4, top: 8 }),
                        background: T.warn, color: T.bg0, fontSize: 9, fontWeight: 800,
                        padding: '2px 6px', borderRadius: 4, pointerEvents: 'none', zIndex: 10010,
                        fontFamily: "'DM Mono', monospace",
                    }}>{g.label}</div>
                )}
            </React.Fragment>
        ))}
    </>
);

// ─── Image Controls Floater ───────────────────────────────────────────────────
interface ImageFloaterProps {
    rect: DOMRect; imageFit: 'cover' | 'contain'; radius: number; opacity: number; shadow: boolean;
    onFitChange: (v: 'cover' | 'contain') => void; onRadiusChange: (v: number) => void;
    onOpacityChange: (v: number) => void; onShadowChange: (v: boolean) => void; onReplace: () => void;
}

export const ImageControlsFloater: React.FC<ImageFloaterProps> = ({
    rect, imageFit, radius, opacity, shadow,
    onFitChange, onRadiusChange, onOpacityChange, onShadowChange, onReplace,
}) => {
    const W = 268;
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - W - 8));
    return (
        <div
            style={{
                position: 'fixed', top: rect.bottom + 10, left, width: W,
                background: T.bg1, border: `1px solid ${T.border1}`,
                borderRadius: 14, padding: 16, zIndex: 10013,
                boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
                fontFamily: "'DM Mono', monospace",
                animation: 'tbIn 0.14s cubic-bezier(0.16,1,0.3,1)',
            }}
            onClick={e => e.stopPropagation()}
        >
            <button onClick={onReplace} style={{
                width: '100%', padding: '9px 12px', background: T.accentDim,
                border: `1px solid ${T.accentGlow}`, borderRadius: 8, color: T.accent,
                fontSize: 11, fontWeight: 700, cursor: 'pointer', marginBottom: 14,
                display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', letterSpacing: '0.04em',
            }}>⊞ REPLACE IMAGE</button>
            <FL>OBJECT FIT</FL>
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                {(['cover', 'contain'] as const).map(f => (
                    <button key={f} onClick={() => onFitChange(f)} style={{
                        flex: 1, padding: '6px',
                        background: imageFit === f ? T.accentDim : T.bg2,
                        border: `1px solid ${imageFit === f ? T.accent : T.border1}`,
                        borderRadius: 6, color: imageFit === f ? T.accent : T.t2,
                        fontSize: 10, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                    }}>{f}</button>
                ))}
            </div>
            <FS label="CORNER RADIUS" value={radius} min={0} max={50} unit="px" onChange={onRadiusChange} />
            <FS label="OPACITY" value={Math.round(opacity * 100)} min={0} max={100} unit="%" onChange={v => onOpacityChange(v / 100)} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <FL>DROP SHADOW</FL>
                <button onClick={() => onShadowChange(!shadow)} style={{
                    width: 38, height: 20, borderRadius: 10,
                    background: shadow ? T.accent : T.bg3,
                    border: `1px solid ${shadow ? T.accentGlow : T.border1}`,
                    cursor: 'pointer', position: 'relative', transition: 'all 0.2s',
                }}>
                    <div style={{
                        position: 'absolute', top: 3, left: shadow ? 18 : 3,
                        width: 12, height: 12, borderRadius: '50%',
                        background: T.white, transition: 'left 0.2s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                    }} />
                </button>
            </div>
        </div>
    );
};

const FL: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div style={{ fontSize: 9, color: T.t2, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 6, fontFamily: "'DM Mono', monospace" }}>{children}</div>
);

const FS: React.FC<{
    label: string; value: number; min: number; max: number; unit: string;
    onChange: (v: number) => void;
}> = ({ label, value, min, max, unit, onChange }) => (
    <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <FL>{label}</FL>
            <span style={{ fontSize: 10, color: T.teal, fontWeight: 700 }}>{value}{unit}</span>
        </div>
        <input
            type="range" min={min} max={max} value={value}
            onChange={e => onChange(Number(e.target.value))}
            style={{ width: '100%', accentColor: T.teal, cursor: 'pointer' }}
        />
    </div>
);

// ─── Spacing Floater ──────────────────────────────────────────────────────────
export const SpacingFloater: React.FC<{
    rect: DOMRect; pt: number; pb: number; pl: number; pr: number;
    onPaddingChange: (side: 'top' | 'bottom' | 'left' | 'right', v: number) => void;
}> = ({ rect, pt, pb, pl, pr, onPaddingChange }) => {
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - 260 - 8));
    return (
        <div
            style={{
                position: 'fixed', top: rect.bottom + 10, left, width: 256,
                background: T.bg1, border: `1px solid ${T.border1}`,
                borderRadius: 14, padding: 16, zIndex: 10013,
                boxShadow: '0 20px 60px rgba(0,0,0,0.65)',
                fontFamily: "'DM Mono', monospace",
                animation: 'tbIn 0.14s cubic-bezier(0.16,1,0.3,1)',
            }}
            onClick={e => e.stopPropagation()}
        >
            <FL>PADDING</FL>
            {(['top', 'bottom', 'left', 'right'] as const).map((s, i) => (
                <FS key={s} label={s.toUpperCase()} value={[pt, pb, pl, pr][i]} min={0} max={200} unit="px" onChange={v => onPaddingChange(s, v)} />
            ))}
        </div>
    );
};

// ─── Keyboard Shortcut HUD ────────────────────────────────────────────────────
export const ShortcutHUD: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    useEffect(() => {
        const h = (e: KeyboardEvent) => { if (e.key === 'Escape' || e.key === '?') onClose(); };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [onClose]);

    const groups = [
        {
            title: 'Selection', shortcuts: [
                { key: 'Click', desc: 'Select element' },
                { key: 'Esc', desc: 'Deselect' },
                { key: 'Del / ⌫', desc: 'Delete selected' },
            ]
        },
        {
            title: 'Edit', shortcuts: [
                { key: '⌘D', desc: 'Duplicate' },
                { key: '⌘C', desc: 'Copy element' },
                { key: '⌘V', desc: 'Paste element' },
                { key: '⌘⇧V', desc: 'Paste styles' },
                { key: '⌘Z', desc: 'Undo' },
            ]
        },
        {
            title: 'Nudge', shortcuts: [
                { key: '←↑→↓', desc: 'Move 1px' },
                { key: 'Shift+Arrow', desc: 'Move 10px' },
            ]
        },
        {
            title: 'View', shortcuts: [
                { key: '?', desc: 'Toggle shortcuts' },
                { key: 'G', desc: 'Toggle grid' },
            ]
        },
    ];

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, zIndex: 99997,
                background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'DM Mono', monospace",
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: T.bg1, border: `1px solid ${T.border1}`,
                    borderRadius: 20, padding: '28px 32px', width: 480,
                    boxShadow: '0 40px 100px rgba(0,0,0,0.8)',
                    animation: 'ctxIn 0.2s cubic-bezier(0.16,1,0.3,1)',
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: T.t0, letterSpacing: '-0.02em' }}>Keyboard Shortcuts</span>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.t2, cursor: 'pointer', fontSize: 14 }}>✕</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 32px' }}>
                    {groups.map(g => (
                        <div key={g.title}>
                            <div style={{ fontSize: 9, fontWeight: 700, color: T.accent, letterSpacing: '0.12em', marginBottom: 10, textTransform: 'uppercase' }}>{g.title}</div>
                            {g.shortcuts.map(s => (
                                <div key={s.key} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                                    <span style={{ fontSize: 11, color: T.t2 }}>{s.desc}</span>
                                    <kbd style={{
                                        fontSize: 10, fontWeight: 700, color: T.t0,
                                        background: T.bg3, border: `1px solid ${T.border2}`,
                                        borderRadius: 5, padding: '2px 8px',
                                        boxShadow: `0 2px 0 ${T.border1}`,
                                        fontFamily: 'inherit', whiteSpace: 'nowrap',
                                    }}>{s.key}</kbd>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${T.border0}`, textAlign: 'center' }}>
                    <span style={{ fontSize: 10, color: T.t2 }}>
                        Press <kbd style={{ background: T.bg3, border: `1px solid ${T.border1}`, borderRadius: 4, padding: '1px 6px', fontSize: 10, fontFamily: 'inherit' }}>?</kbd> anytime
                    </span>
                </div>
            </div>
        </div>
    );
};

// ─── Media Picker Modal ───────────────────────────────────────────────────────
const LIBRARY_IMAGES = [
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80',
    'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=600&q=80',
    'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&q=80',
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80',
    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&q=80',
    'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=600&q=80',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80',
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80',
    'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600&q=80',
    'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600&q=80',
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&q=80',
    'https://images.unsplash.com/photo-1490750967868-88df5691cc36?w=600&q=80',
];

export const MediaPickerModal: React.FC<{
    target: MediaPickerTarget; onClose: () => void; onSelect: (url: string) => void;
}> = ({ target, onClose, onSelect }) => {
    const [tab, setTab] = useState<'drive' | 'library' | 'url' | 'upload'>('drive');
    const { assets, loading, fetchGallery, uploadImage } = useMediaStore();
    const { interactionPriority, setInteractionPriority } = useBuilder();
    const [urlInput, setUrlInput] = useState('');
    const [previewUrl, setPreviewUrl] = useState('');
    const [previewOk, setPreviewOk] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // FIX: capture the previous priority in a ref so the cleanup closure doesn't go stale.
    const prevPriorityRef = useRef(interactionPriority);
    useEffect(() => {
        prevPriorityRef.current = interactionPriority;
        setInteractionPriority(InteractionPriority.MEDIA_PICKING);
        if (assets.length === 0) fetchGallery();
        return () => setInteractionPriority(prevPriorityRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps — run once on mount.
    }, []);

    useEffect(() => {
        const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', h);
        return () => document.removeEventListener('keydown', h);
    }, [onClose]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const asset = await uploadImage(file);
        if (asset) onSelect(asset._id);
    };

    const tabs = [
        { id: 'drive', label: 'My Cloud', color: T.accent },
        { id: 'library', label: 'Stock Photos', color: T.teal },
        { id: 'upload', label: 'Upload', color: T.green },
        { id: 'url', label: 'URL', color: T.warn },
    ] as const;

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, zIndex: 99999,
                background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'DM Mono', monospace",
            }}
        >
            <style>{`.mp-s::-webkit-scrollbar{width:5px}.mp-s::-webkit-scrollbar-thumb{background:${T.border1};border-radius:99px}`}</style>
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: T.bg1, border: `1px solid ${T.border1}`,
                    borderRadius: 20, width: 760, maxHeight: '88vh',
                    display: 'flex', flexDirection: 'column',
                    boxShadow: '0 40px 120px rgba(0,0,0,0.85)',
                    animation: 'mpIn 0.28s cubic-bezier(0.16,1,0.3,1)',
                    overflow: 'hidden',
                }}
            >
                <div style={{ padding: '22px 24px 0', background: T.bg1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                        <div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: T.t0, letterSpacing: '-0.02em' }}>Asset Library</div>
                            <div style={{ fontSize: 11, color: T.t2, marginTop: 3 }}>Select or import media</div>
                        </div>
                        <button onClick={onClose} style={{
                            width: 32, height: 32, borderRadius: 8, background: T.bg3,
                            border: `1px solid ${T.border1}`, cursor: 'pointer', fontSize: 16,
                            color: T.t1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.15s',
                        }}>×</button>
                    </div>
                    <div style={{ display: 'flex', gap: 2, borderBottom: `1px solid ${T.border0}` }}>
                        {tabs.map(({ id, label, color }) => (
                            <button key={id} onClick={() => setTab(id)} style={{
                                padding: '10px 18px', fontSize: 11, fontWeight: tab === id ? 700 : 500,
                                background: 'transparent', border: 'none',
                                borderBottom: `2px solid ${tab === id ? color : 'transparent'}`,
                                color: tab === id ? T.t0 : T.t2,
                                cursor: 'pointer', transition: 'all 0.15s',
                            }}>{label}</button>
                        ))}
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: 24, background: T.bg0 }} className="mp-s">
                    {tab === 'drive' && (
                        loading && assets.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 60, color: T.t2 }}>Loading...</div>
                        ) : assets.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 60 }}>
                                <div style={{ fontSize: 32, opacity: 0.2, marginBottom: 12 }}>□</div>
                                <div style={{ fontSize: 13, color: T.t1 }}>Drive is empty</div>
                                <button onClick={() => setTab('upload')} style={{
                                    marginTop: 14, padding: '8px 18px', background: T.accentDim,
                                    color: T.accent, border: `1px solid ${T.accentGlow}`, borderRadius: 8,
                                    fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                }}>Upload First Asset</button>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                                {assets.map((a, i) => <MediaThumb key={a._id} src={a.url} delay={i * 0.025} onSelect={() => onSelect(a._id)} />)}
                            </div>
                        )
                    )}
                    {tab === 'library' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                            {LIBRARY_IMAGES.map((img, i) => <MediaThumb key={img} src={img} delay={i * 0.03} onSelect={() => onSelect(img)} />)}
                        </div>
                    )}
                    {tab === 'upload' && (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                border: `2px dashed ${T.border1}`, borderRadius: 16, padding: '80px 40px',
                                textAlign: 'center', cursor: 'pointer', background: T.bg1, transition: 'all 0.25s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = T.green; e.currentTarget.style.background = T.greenDim; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border1; e.currentTarget.style.background = T.bg1; }}
                        >
                            <div style={{ fontSize: 36, opacity: 0.5, marginBottom: 14 }}>⬆</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: T.t0, marginBottom: 8 }}>Drop files or click to browse</div>
                            <div style={{ fontSize: 11, color: T.t2 }}>JPG, PNG, WEBP, SVG · Max 10MB</div>
                            <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleUpload} />
                            {loading && <div style={{ marginTop: 20, color: T.green, fontWeight: 700, fontSize: 12 }}>Uploading...</div>}
                        </div>
                    )}
                    {tab === 'url' && (
                        <div>
                            <div style={{ fontSize: 9, color: T.t2, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 8 }}>REMOTE URL</div>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                                <input
                                    autoFocus type="url" value={urlInput}
                                    onChange={e => setUrlInput(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') { setPreviewOk(true); setPreviewUrl(urlInput); } }}
                                    placeholder="https://example.com/image.jpg"
                                    style={{
                                        flex: 1, background: T.bg2, border: `1px solid ${T.border1}`,
                                        borderRadius: 8, padding: '10px 14px', fontSize: 12, color: T.t0,
                                        outline: 'none', fontFamily: 'inherit',
                                    }}
                                />
                                <button
                                    onClick={() => { setPreviewOk(true); setPreviewUrl(urlInput); }}
                                    style={{
                                        padding: '10px 18px', background: T.accentDim,
                                        border: `1px solid ${T.accentGlow}`, borderRadius: 8,
                                        color: T.accent, fontSize: 12, fontWeight: 700,
                                        cursor: 'pointer', whiteSpace: 'nowrap',
                                    }}
                                >Preview</button>
                            </div>
                            {previewUrl && (
                                <div style={{ textAlign: 'center', background: T.bg2, padding: 16, borderRadius: 12, border: `1px solid ${T.border1}` }}>
                                    <img
                                        src={previewUrl}
                                        style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }}
                                        onError={() => setPreviewOk(false)}
                                        onLoad={() => setPreviewOk(true)}
                                        alt=""
                                    />
                                    {!previewOk && <div style={{ color: T.danger, fontSize: 11, marginTop: 8 }}>Invalid URL</div>}
                                    {previewOk && (
                                        <button
                                            onClick={() => onSelect(previewUrl)}
                                            style={{
                                                marginTop: 12, width: '100%', padding: 10,
                                                background: T.accentDim, color: T.accent,
                                                border: `1px solid ${T.accentGlow}`, borderRadius: 8,
                                                fontWeight: 700, cursor: 'pointer', fontSize: 12,
                                            }}
                                        >Use this image ↗</button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const MediaThumb: React.FC<{ src: string; delay: number; onSelect: () => void }> = ({ src, delay, onSelect }) => (
    <div
        onClick={onSelect}
        style={{
            aspectRatio: '1/1', borderRadius: 12, overflow: 'hidden',
            cursor: 'pointer', border: `2px solid ${T.border0}`,
            transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)', background: T.bg2,
            animation: `mpT 0.4s ${delay}s cubic-bezier(0.16,1,0.3,1) both`,
        }}
        onMouseEnter={e => {
            const el = e.currentTarget;
            el.style.borderColor = T.accent;
            el.style.transform = 'scale(1.04) translateY(-4px)';
            el.style.boxShadow = '0 16px 32px rgba(0,0,0,0.4)';
        }}
        onMouseLeave={e => {
            const el = e.currentTarget;
            el.style.borderColor = T.border0;
            el.style.transform = '';
            el.style.boxShadow = '';
        }}
    >
        <img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" loading="lazy" />
    </div>
);

// ─── useFreePositionDrag ──────────────────────────────────────────────────────
export interface FreePosition { x: number; y: number }

export function useFreePositionDrag(
    onPositionChange: (pos: FreePosition) => void,
    onDragEnd: (pos: FreePosition) => void,
    snapTolerance = 8,
) {
    const [isDragging, setIsDragging] = useState(false);
    const [livePos, setLivePos] = useState<FreePosition | null>(null);

    // All mutable drag state lives in a ref — no stale closures.
    const dragRef = useRef<{
        active: boolean;
        mouseX: number; mouseY: number;
        elemX: number; elemY: number;
        liveX: number; liveY: number;
        container: DOMRect | null;
        elemSize: { w: number; h: number };
    } | null>(null);

    // FIX: callbacks go in a ref so they never become stale inside the closure.
    const cbRef = useRef({ onPositionChange, onDragEnd, snapTolerance });
    useEffect(() => { cbRef.current = { onPositionChange, onDragEnd, snapTolerance }; });

    const startDrag = useCallback((
        e: React.MouseEvent,
        currentPos: FreePosition,
        containerRect?: DOMRect,
        elemSize?: { w: number; h: number },
    ) => {
        e.preventDefault();
        e.stopPropagation();

        dragRef.current = {
            active: true,
            mouseX: e.clientX, mouseY: e.clientY,
            elemX: currentPos.x, elemY: currentPos.y,
            liveX: currentPos.x, liveY: currentPos.y,
            container: containerRect ?? null,
            elemSize: elemSize ?? { w: 0, h: 0 },
        };

        setIsDragging(true);
        setLivePos(currentPos);

        const onMove = (mv: MouseEvent) => {
            const d = dragRef.current;
            if (!d?.active) return;

            let x = d.elemX + (mv.clientX - d.mouseX);
            let y = d.elemY + (mv.clientY - d.mouseY);

            if (d.container && d.elemSize.w > 0) {
                x = Math.max(4, Math.min(x, d.container.width - d.elemSize.w - 4));
                y = Math.max(4, Math.min(y, d.container.height - d.elemSize.h - 4));
            } else {
                x = Math.max(-2000, Math.min(x, 2000));
                y = Math.max(-2000, Math.min(y, 2000));
            }

            const snap = cbRef.current.snapTolerance;
            if (Math.abs(x) < snap) x = 0;
            if (Math.abs(y) < snap) y = 0;

            d.liveX = x;
            d.liveY = y;

            const pos = { x, y };
            setLivePos(pos);
            cbRef.current.onPositionChange(pos);
        };

        const onUp = () => {
            const d = dragRef.current;
            if (d?.active) {
                cbRef.current.onDragEnd({ x: d.liveX, y: d.liveY });
            }
            dragRef.current = null;
            setIsDragging(false);
            setLivePos(null);
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }, []); // stable — no deps needed; all state is in refs.

    return { startDrag, isDragging, livePos };
}

// ─── useElementResize ─────────────────────────────────────────────────────────
export function useElementResize(): {
    liveW: number | null; liveH: number | null; activeCursor: string | null;
    startResize: (dir: ResizeDir, e: React.MouseEvent, rect: DOMRect, onUpdate: (w: number, h: number) => void) => void;
} {
    const [liveW, setLiveW] = useState<number | null>(null);
    const [liveH, setLiveH] = useState<number | null>(null);
    const [activeCursor, setActiveCursor] = useState<string | null>(null);

    const startResize = useCallback((
        dir: ResizeDir,
        e: React.MouseEvent,
        rect: DOMRect,
        onUpdate: (w: number, h: number) => void,
    ) => {
        e.preventDefault();
        e.stopPropagation();

        const startX = e.clientX, startY = e.clientY;
        const startW = rect.width, startH = rect.height;
        setActiveCursor(HANDLE_DEFS.find(h => h.dir === dir)?.cursor ?? 'default');

        const onMove = (mv: MouseEvent) => {
            const dx = mv.clientX - startX;
            const dy = mv.clientY - startY;
            let nW = startW, nH = startH;

            if (dir.includes('e')) nW = Math.max(60, startW + dx);
            if (dir.includes('w')) nW = Math.max(60, startW - dx);
            if (dir.includes('s')) nH = Math.max(40, startH + dy);
            if (dir.includes('n')) nH = Math.max(40, startH - dy);

            // Shift = lock aspect ratio for corner handles.
            if (mv.shiftKey && ['ne', 'nw', 'se', 'sw'].includes(dir)) {
                const r = startW / startH;
                if (Math.abs(dx) > Math.abs(dy)) nH = nW / r;
                else nW = nH * r;
            }

            nW = Math.round(nW);
            nH = Math.round(nH);
            setLiveW(nW);
            setLiveH(nH);
            onUpdate(nW, nH);
        };

        const onUp = () => {
            setLiveW(null);
            setLiveH(null);
            setActiveCursor(null);
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }, []);

    return { liveW, liveH, startResize, activeCursor };
}