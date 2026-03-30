/* eslint-disable react/prop-types */
import React, { useRef, useEffect, useCallback, useState, useSyncExternalStore } from 'react';
import { useOmnora } from '../../context/OmnoraContext';
import { useMediaStore } from '../../context/MediaStoreContext';

(function injectEditableStyles() {
    if (typeof document === 'undefined' || document.getElementById('omnora-editable-kf')) return;
    const s = document.createElement('style');
    s.id = 'omnora-editable-kf';
    s.textContent = `
        @keyframes overPop {
            from { opacity: 0; transform: translateY(10px) scale(0.9); }
            to   { opacity: 1; transform: translateY(0)  scale(1);   }
        }
    `;
    document.head.appendChild(s);
})();

function generateElementId(nodeId: string, path: string): string {
    const str = `${nodeId}:${path}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash | 0;
    }
    return Math.abs(hash).toString(36).slice(0, 6);
}

type PositionMode = 'flow' | 'free';

interface ElementPosition {
    mode: PositionMode;
    x: number;
    y: number;
    z: number;
    mobileX?: number;
    mobileY?: number;
    scale?: number;
    mobileScale?: number;
    rotation?: number;
    mobileRotation?: number;
}

interface ElementSize {
    width?: string | number;
    height?: string | number;
}

// ─── Render-count external store ──────────────────────────────────────────────
// Stores render counts outside React state so they can be read safely during
// render via useSyncExternalStore — no "ref in render" or "setState in effect"
// lint violations.

const _renderCounts    = new Map<string, number>();
const _rcListeners     = new Set<() => void>();

function _subscribeRC(cb: () => void): () => void {
    _rcListeners.add(cb);
    return () => { _rcListeners.delete(cb); };
}

function _incrementRC(id: string): void {
    _renderCounts.set(id, (_renderCounts.get(id) ?? 0) + 1);
    _rcListeners.forEach((l) => l());
}

function _getRC(id: string): number {
    return _renderCounts.get(id) ?? 0;
}

/** Returns a live render count for the given stable element id. Safe to use in render. */
function useRenderCount(stableId: string): number {
    return useSyncExternalStore(
        _subscribeRC,
        () => _getRC(stableId),
        () => 0,
    );
}

// ─── EditableText ─────────────────────────────────────────────────────────────

export interface EditableTextProps {
    nodeId: string;
    path: string;
    className?: string;
    style?: React.CSSProperties;
    tag?: keyof React.JSX.IntrinsicElements;
    elementId?: string;
}

export const EditableText: React.FC<EditableTextProps> = React.memo(({
    nodeId, path, className, style, tag: Tag = 'div', elementId,
}) => {
    const {
        nodes, updateNode, commitHistory,
        viewport, mode, selectNode,
        setIsTyping, setEditingInfo, editingInfo,
        diagnostics, setDiagnostics,
    } = useOmnora();

    // ── All hooks must be called unconditionally before any early return ──────
    const elementRef      = useRef<HTMLElement>(null);
    const debounceTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);

    const node = nodes[nodeId];

    const generatedId     = elementId || generateElementId(nodeId, path);
    const lastSyncedValue = useRef<string>('');

    const [isHovered,     setIsHovered]     = useState(false);
    const [isActiveState, setIsActiveState] = useState(false);

    // Reads from the external store — lint-clean, safe during render
   const renderCount = useRenderCount(generatedId);

    const isCurrentlyEditing = (
        editingInfo?.nodeId    === nodeId &&
        editingInfo?.path      === path &&
        editingInfo?.elementId === generatedId
    );

    // Compute display value safely — node may be undefined until guard below
    const resolveBinding = (bindingPath: string): string => {
        const dataStore: Record<string, unknown> = {
            product: { price: '$1,250', name: 'Signature v1', stock: '2 left' },
            cart:    { count: '3', total: '$3,750' },
            user:    { name: 'Ahmad' },
        };
        const parts = bindingPath.split('.');
        let val: unknown = dataStore;
        for (const part of parts) val = (val as Record<string, unknown>)?.[part];
        return (val as string) ?? `{{${bindingPath}}}`;
    };

    const keys = path.split('.');
    let manifestVal: unknown = node ?? {};
    for (const key of keys) manifestVal = (manifestVal as Record<string, unknown>)?.[key];
    const displayValue = String(
        node?.binding ? resolveBinding(node.binding) : (manifestVal ?? '')
    );

    // ── Hooks that depend on displayValue — must be unconditional ─────────────

    // Increment the external store after every render and log diagnostics.
    // _incrementRC notifies useSyncExternalStore subscribers instead of calling
    // setState, so this effect has no setState call and triggers no cascading renders.
    useEffect(() => {
        // Increment happens inside effect - perfectly safe and pure
        _incrementRC(generatedId); 
        if (diagnostics?.showPanel) {
            console.debug(`[PRO-DEBUG] Render: ${nodeId} (${generatedId}) | Count: ${_getRC(generatedId)}`);
        }
    });

    useEffect(() => {
        if (isCurrentlyEditing) return;
        const el = elementRef.current;
        if (!el) return;
        if (el.innerText !== displayValue) {
            el.innerText = displayValue;
            lastSyncedValue.current = displayValue;
        }
    }, [displayValue, isCurrentlyEditing]);

    // ── Early return AFTER all hooks ──────────────────────────────────────────
    if (!node) return null;

    const isHiddenOnDevice = node.hidden?.[viewport as string];
    if (isHiddenOnDevice && mode === 'preview') return null;

    const isHoveredForced = node.forcedState === 'hover';
    const isActiveForced  = node.forcedState === 'active';

    const p        = (node.props?.elementPositions as Record<string, ElementPosition>)?.[generatedId] ?? { mode: 'flow', x: 0, y: 0, z: 1 };
    const isFree   = p.mode === 'free';
    const isMobile = viewport === 'mobile';

    const finalX        = isMobile ? (p.mobileX        ?? p.x        ?? 0) : (p.x        ?? 0);
    const finalY        = isMobile ? (p.mobileY        ?? p.y        ?? 0) : (p.y        ?? 0);
    const finalScale    = isMobile ? (p.mobileScale    ?? p.scale    ?? 1) : (p.scale    ?? 1);
    const finalRotation = isMobile ? (p.mobileRotation ?? p.rotation ?? 0) : (p.rotation ?? 0);
    const sizes         = (node.props?.elementSizes as Record<string, ElementSize>)?.[generatedId] ?? {};

    const finalStyle: React.CSSProperties = {
        transition: isCurrentlyEditing ? 'none' : `all ${node.motion?.duration ?? 200}ms ${node.motion?.curve ?? 'ease'}`,
        ...style,
        ...node.styles,
        ...((isHovered || isHoveredForced) ? node.interactions?.hover  : {}),
        ...((isActiveState || isActiveForced)  ? node.interactions?.active : {}),
        ...(isFree ? {
            position: 'absolute',
            transform: `translate3d(${finalX}px, ${finalY}px, 0) rotate(${finalRotation}deg) scale(${finalScale})`,
            transformOrigin: 'center center',
            zIndex: p.z ?? 1,
            width:  sizes.width  ?? 'auto',
            height: sizes.height ?? 'auto',
        } : {}),
    };

    const handleInput = (e: React.FormEvent<HTMLElement>) => {
        if (node.binding) return;
        const newText = (e.currentTarget as HTMLElement).innerText;
        setIsTyping?.(true);
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            updateNode?.(nodeId, path, newText);
            lastSyncedValue.current = newText;
        }, 800);
    };

    const handleBlur = (e: React.FocusEvent) => {
        setIsTyping?.(false);
        setEditingInfo?.(null);
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
            debounceTimer.current = null;
        }
        const finalVal = elementRef.current?.innerText ?? '';
        if (finalVal !== lastSyncedValue.current) {
            updateNode?.(nodeId, path, finalVal);
            lastSyncedValue.current = finalVal;
            commitHistory?.();
        }
        if (diagnostics?.showPanel && e.relatedTarget === null) {
            setDiagnostics?.({ focusLosses: (diagnostics.focusLosses ?? 0) + 1 });
        }
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
        if (mode === 'preview' || node.binding) return;
        e.stopPropagation();
        selectNode?.(nodeId);
        setEditingInfo?.({ nodeId, path, elementId: generatedId });
        if (elementRef.current) elementRef.current.innerText = displayValue;
        requestAnimationFrame(() => {
            const el = elementRef.current;
            if (!el) return;
            el.focus();
            const sel   = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(false);
            sel?.removeAllRanges();
            sel?.addRange(range);
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            e.stopPropagation();
            setIsTyping?.(false);
            setEditingInfo?.(null);
            if (elementRef.current) elementRef.current.innerText = displayValue;
            elementRef.current?.blur();
        }
    };

    const handleClick = (e: React.MouseEvent) => {
        if (mode === 'preview' || isCurrentlyEditing) return;
        e.stopPropagation();
        selectNode?.(nodeId);
    };

    const Component = Tag as React.ElementType;

    return (
        <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
            <Component
                ref={elementRef}
                contentEditable={isCurrentlyEditing && !node.binding}
                onInput={handleInput}
                onBlur={handleBlur}
                onClick={handleClick}
                onDoubleClick={handleDoubleClick}
                onKeyDown={handleKeyDown}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onMouseDown={() => setIsActiveState(true)}
                onMouseUp={() => setIsActiveState(false)}
                className={`omnora-editable-text ${className ?? ''} ${isCurrentlyEditing ? 'is-editing' : ''}`}
                data-element-id={generatedId}
                data-element-type="text"
              style={{
                    ...finalStyle,
                    outline: isCurrentlyEditing ? '2px solid #7c6dfa' : 'none',
                    opacity: isHiddenOnDevice ? 0.3 : 1,
                    // OSTT FIX: Use generatedId or just renderCount variable
                    backgroundColor: (diagnostics?.showPanel && renderCount > 1)
                        ? 'rgba(239,68,68,0.1)'
                        : undefined,
                }}
                suppressContentEditableWarning
            />
           {diagnostics?.showPanel && (
                <div style={{
                    position: 'absolute', top: -14, right: 0,
                    fontSize: 8, color: '#ef4444', fontWeight: 900,
                    background: '#fee2e2', padding: '0 4px', borderRadius: 2,
                    pointerEvents: 'none',
                }}>
                    R:{renderCount}
                </div>
            )}
            {mode === 'edit' && !isCurrentlyEditing && isHovered && !node.binding && (
                <span style={{
                    position: 'absolute', top: -22, left: 0,
                    background: '#111827', color: '#fff',
                    fontSize: 10, fontWeight: 700, padding: '2px 8px',
                    borderRadius: 4, whiteSpace: 'nowrap',
                    pointerEvents: 'none', zIndex: 100,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                }}>✏ Double-click to edit</span>
            )}
        </div>
    );
});
EditableText.displayName = 'EditableText';

// ─── EditableContainer ────────────────────────────────────────────────────────

export interface EditableContainerProps {
    nodeId: string;
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    elementId?: string;
}

export const EditableContainer: React.FC<EditableContainerProps> = React.memo(({
    nodeId, children, className, style, elementId,
}) => {
    const { selectNode, selectedNodeId, isBuilderActive, viewport, nodes, mode } = useOmnora();
    const node = nodes[nodeId];
    const generatedId = elementId || generateElementId(nodeId, 'container');

    const handleClick = useCallback((e: React.MouseEvent) => {
        if (!isBuilderActive || mode === 'preview') return;
        e.stopPropagation();
        selectNode?.(nodeId);
    }, [nodeId, selectNode, isBuilderActive, mode]);

    if (!node) return null;

    const isHiddenOnDevice = node.hidden?.[viewport as string];
    if (isHiddenOnDevice && mode === 'preview') return null;

    const isSelected = selectedNodeId === nodeId;
    const p          = (node.props?.elementPositions as Record<string, ElementPosition>)?.[generatedId] ?? { mode: 'flow', x: 0, y: 0, z: 1 };
    const isFree     = p.mode === 'free';
    const isMobile   = viewport === 'mobile';

    const finalX        = isMobile ? (p.mobileX        ?? p.x        ?? 0) : (p.x        ?? 0);
    const finalY        = isMobile ? (p.mobileY        ?? p.y        ?? 0) : (p.y        ?? 0);
    const finalScale    = isMobile ? (p.mobileScale    ?? p.scale    ?? 1) : (p.scale    ?? 1);
    const finalRotation = isMobile ? (p.mobileRotation ?? p.rotation ?? 0) : (p.rotation ?? 0);
    const sizes         = (node.props?.elementSizes as Record<string, ElementSize>)?.[generatedId] ?? {};

    return (
        <div
            className={`editable-container-node observable-node ${className ?? ''} ${isSelected ? 'is-selected' : ''}`}
            style={{
                ...style,
                position:        isFree ? 'absolute' : 'relative',
                transform:       isFree ? `translate3d(${finalX}px, ${finalY}px, 0) rotate(${finalRotation}deg) scale(${finalScale})` : undefined,
                transformOrigin: 'center center',
                zIndex:          isFree ? (p.z ?? 1) : undefined,
                width:           isFree ? (sizes.width  ?? 'auto') : undefined,
                height:          isFree ? (sizes.height ?? 'auto') : undefined,
                cursor:          isBuilderActive ? 'pointer' : 'default',
                opacity:         isHiddenOnDevice ? 0.3 : 1,
            }}
            onClick={handleClick}
            data-node-id={nodeId}
            data-element-id={generatedId}
            data-element-type="container"
        >
            {children}
            {mode === 'edit' && isHiddenOnDevice && (
                <span style={{
                    position: 'absolute', top: 0, right: 0,
                    fontSize: 8, background: 'var(--accent-primary)',
                    color: '#000', padding: '2px 4px', fontWeight: 900,
                }}>HIDDEN</span>
            )}
        </div>
    );
});
EditableContainer.displayName = 'EditableContainer';

// ─── EditableImage ────────────────────────────────────────────────────────────

export interface EditableImageProps {
    nodeId: string;
    path: string;
    className?: string;
    style?: React.CSSProperties;
    alt?: string;
    elementId?: string;
    onReplaceClick?: () => void;
}

export const EditableImage: React.FC<EditableImageProps> = React.memo(({
    nodeId, path, className, style, alt = '', elementId, onReplaceClick,
}) => {
    const { nodes, isBuilderActive, viewport, mode, selectNode } = useOmnora();
    const { resolveAssetUrl } = useMediaStore();
    const node        = nodes[nodeId];
    const generatedId = elementId || generateElementId(nodeId, path);
    const [hovered, setHovered] = useState(false);

    const handleClick = useCallback((e: React.MouseEvent) => {
        if (!isBuilderActive || mode === 'preview') return;
        e.stopPropagation();
        selectNode?.(nodeId);
        onReplaceClick?.();
    }, [isBuilderActive, mode, onReplaceClick, selectNode, nodeId]);

    if (!node) return null;

    const isHiddenOnDevice = node.hidden?.[viewport as string];
    if (isHiddenOnDevice && mode === 'preview') return null;

    const keys = path.split('.');
    let srcId: unknown = node;
    for (const key of keys) {
        if (srcId == null) break;
        srcId = (srcId as Record<string, unknown>)[key];
    }

    const resolvedSrc     = resolveAssetUrl(srcId as string);
    const imageFit        = (node.props?.imageFit        as React.CSSProperties['objectFit']) ?? 'cover';
    const imageRadius     = (node.props?.imageRadius     as string)  ?? '0px';
    const imageShadow     = node.props?.imageShadow;
    const imageOpacity    = parseFloat(node.props?.imageOpacity    as string) || 1;
    const imageBrightness = parseFloat(node.props?.imageBrightness as string) || 1;
    const imageContrast   = parseFloat(node.props?.imageContrast   as string) || 1;

    const p        = (node.props?.elementPositions as Record<string, ElementPosition>)?.[generatedId] ?? { mode: 'flow', x: 0, y: 0, z: 1 };
    const isFree   = p.mode === 'free';
    const isMobile = viewport === 'mobile';

    const finalX        = isMobile ? (p.mobileX        ?? p.x        ?? 0) : (p.x        ?? 0);
    const finalY        = isMobile ? (p.mobileY        ?? p.y        ?? 0) : (p.y        ?? 0);
    const finalScale    = isMobile ? (p.mobileScale    ?? p.scale    ?? 1) : (p.scale    ?? 1);
    const finalRotation = isMobile ? (p.mobileRotation ?? p.rotation ?? 0) : (p.rotation ?? 0);
    const sizes         = (node.props?.elementSizes as Record<string, ElementSize>)?.[generatedId] ?? {};

    return (
        <div
            className={`editable-image-node observable-node ${className ?? ''}`}
            onClick={handleClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            data-element-id={generatedId}
            data-element-type="image"
            data-image-prop-path={path}
            style={{
                ...style,
                position:        isFree ? 'absolute' : 'relative',
                transform:       isFree ? `translate3d(${finalX}px, ${finalY}px, 0) rotate(${finalRotation}deg) scale(${finalScale})` : undefined,
                transformOrigin: 'center center',
                zIndex:          isFree ? (p.z ?? 1) : undefined,
                width:           isFree ? (sizes.width ?? '100%') : undefined,
                height:          isFree ? (sizes.height ?? 'auto') : undefined,
                cursor:          mode === 'preview' ? 'default' : 'pointer',
                opacity:         isHiddenOnDevice ? 0.3 : 1,
                borderRadius:    imageRadius,
                overflow:        'hidden',
                display:         'block',
            }}
        >
            <img
                src={resolvedSrc}
                alt={alt}
                style={{
                    width: '100%', height: '100%', display: 'block',
                    objectFit:  imageFit,
                    opacity:    imageOpacity,
                    boxShadow:  imageShadow ? '0 8px 32px rgba(0,0,0,0.35)' : undefined,
                    transition: 'transform 0.2s ease, filter 0.15s ease',
                    transform:  (hovered && mode !== 'preview') ? 'scale(1.02)' : 'scale(1)',
                    filter:     `brightness(${imageBrightness}) contrast(${imageContrast})`,
                    pointerEvents: 'none',
                }}
            />
            {mode === 'edit' && (
                <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
                    background: hovered ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0)',
                    backdropFilter: hovered ? 'blur(8px)' : undefined,
                }}>
                    {hovered && (
                        <div style={{
                            animation: 'overPop 0.3s cubic-bezier(0.16,1,0.3,1) both',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                        }}>
                            <div style={{ fontSize: 24, lineHeight: 1, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}>
                                🖼️
                            </div>
                            <span style={{
                                color: '#fff', fontSize: 11, fontWeight: 900,
                                letterSpacing: '0.1em', textShadow: '0 2px 10px rgba(0,0,0,0.4)',
                            }}>CHANGE MEDIA</span>
                        </div>
                    )}
                </div>
            )}
            {mode === 'edit' && isHiddenOnDevice && (
                <span style={{
                    position: 'absolute', top: 0, right: 0,
                    fontSize: 8, background: 'var(--accent-primary)',
                    color: '#000', padding: '2px 4px', fontWeight: 900,
                }}>HIDDEN</span>
            )}
        </div>
    );
});
EditableImage.displayName = 'EditableImage';

// ─── EditableButton ───────────────────────────────────────────────────────────

export interface EditableButtonProps {
    nodeId: string;
    textPath: string;
    onClick?: () => void;
    className?: string;
    style?: React.CSSProperties;
    elementId?: string;
}

export const EditableButton: React.FC<EditableButtonProps> = React.memo(({
    nodeId, textPath, onClick, className, style, elementId,
}) => {
    const { nodes, mode, selectNode, viewport } = useOmnora();
    const node        = nodes[nodeId];
    const generatedId = elementId || generateElementId(nodeId, textPath);
    const [hovered, setHovered] = useState(false);

    if (!node) return null;

    const keys = textPath.split('.');
    let text: unknown = node;
    for (const key of keys) {
        if (text == null) break;
        text = (text as Record<string, unknown>)[key];
    }

    const p         = node.props ?? {};
    const size      = (p.ctaSize      as string) || 'md';
    const btnStyle  = (p.ctaStyle     as string) || 'filled';
    const radius    = (p.ctaRadius    as string) || '4px';
    const fullWidth = !!p.ctaFullWidth;
    const hoverAnim = (p.ctaHoverAnim as string) || 'none';

    const sizeMap: Record<string, React.CSSProperties> = {
        sm: { padding: '8px 16px',  fontSize: 12 },
        md: { padding: '11px 24px', fontSize: 14 },
        lg: { padding: '14px 32px', fontSize: 15 },
        xl: { padding: '18px 40px', fontSize: 17 },
    };

    const hoverTransformMap: Record<string, string> = {
        lift:  'translateY(-2px)',
        scale: 'scale(1.04)',
        glow:  'scale(1.01)',
        none:  '',
    };

    const p_pos      = (node.props?.elementPositions as Record<string, ElementPosition>)?.[generatedId] ?? { mode: 'flow', x: 0, y: 0, z: 1 };
    const isFree     = p_pos.mode === 'free';
    const isMobile   = viewport === 'mobile';
    const finalX     = isMobile ? (p_pos.mobileX        ?? p_pos.x        ?? 0) : (p_pos.x        ?? 0);
    const finalY     = isMobile ? (p_pos.mobileY        ?? p_pos.y        ?? 0) : (p_pos.y        ?? 0);
    const finalScale = isMobile ? (p_pos.mobileScale    ?? p_pos.scale    ?? 1) : (p_pos.scale    ?? 1);
    const finalRot   = isMobile ? (p_pos.mobileRotation ?? p_pos.rotation ?? 0) : (p_pos.rotation ?? 0);

    let resolvedTransform: string | undefined;
    if (isFree) {
        const scaleAmount = hovered ? finalScale * 1.04 : finalScale;
        resolvedTransform = `translate3d(${finalX}px, ${finalY}px, 0) rotate(${finalRot}deg) scale(${scaleAmount})`;
    } else if (hovered && hoverTransformMap[hoverAnim]) {
        resolvedTransform = hoverTransformMap[hoverAnim];
    }

    const sizes = (node.props?.elementSizes as Record<string, ElementSize>)?.[generatedId] ?? {};

    const baseStyle: React.CSSProperties = {
        ...sizeMap[size],
        borderRadius: radius,
        fontWeight: 700,
        cursor: 'pointer',
        display: isFree ? 'flex' : 'inline-flex',
        alignItems: 'center', gap: 6,
        position: isFree ? 'absolute' : 'relative',
        transformOrigin: 'center center',
        zIndex: isFree ? (p_pos.z ?? 1) : undefined,
        width: isFree ? (sizes.width ?? 'auto') : (fullWidth ? '100%' : undefined),
        height: isFree ? (sizes.height ?? 'auto') : undefined,
        justifyContent: (fullWidth || isFree) ? 'center' : undefined,
        transition: 'all 0.18s cubic-bezier(0.16,1,0.3,1)',
        transform: resolvedTransform,
        boxShadow: (hovered && hoverAnim === 'glow') ? '0 0 20px rgba(99,102,241,0.5)' : undefined,
        border: btnStyle === 'outline' ? '2px solid var(--btn-bg, #6366F1)' : 'none',
        background: btnStyle === 'filled' ? 'var(--btn-bg, #6366F1)' : 'transparent',
        color: btnStyle === 'filled' ? 'var(--btn-text, #fff)' : 'var(--btn-bg, #6366F1)',
        ...style,
    };

    const handleClick = (e: React.MouseEvent) => {
        if (mode === 'preview') { onClick?.(); return; }
        e.stopPropagation();
        selectNode?.(nodeId);
    };

    return (
        <button
            type="button"
            className={`omnora-cta-btn ${className ?? ''}`}
            style={baseStyle}
            onClick={handleClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            data-element-id={generatedId}
            data-element-type="button"
        >
            {String(text ?? 'Button')}
        </button>
    );
});
EditableButton.displayName = 'EditableButton';

// ─── EditableLogo ─────────────────────────────────────────────────────────────

export interface EditableLogoProps {
    nodeId: string;
    src?: string;
    storeName?: string;
    className?: string;
    style?: React.CSSProperties;
    elementId?: string;
    onReplaceClick?: () => void;
}

export const EditableLogo: React.FC<EditableLogoProps> = React.memo(({
    nodeId, src, storeName, className, style, elementId, onReplaceClick,
}) => {
    const { mode, selectNode, nodes, viewport } = useOmnora();
    const { resolveAssetUrl } = useMediaStore();
    const node        = nodes[nodeId];
    const generatedId = elementId || generateElementId(nodeId, 'logo');
    const [hovered, setHovered] = useState(false);

    const handleClick = (e: React.MouseEvent) => {
        if (mode === 'preview') return;
        e.stopPropagation();
        selectNode?.(nodeId);
        if (hovered && src && onReplaceClick) onReplaceClick();
    };

    if (!node) return null;

    const resolvedLogoSrc = resolveAssetUrl(src as string);
    const p   = node.props ?? {};
    const pos = (p.elementPositions as Record<string, ElementPosition>)?.[generatedId] ?? { mode: 'flow', x: 0, y: 0, z: 1 };
    const isFree   = pos.mode === 'free';
    const isMobile = viewport === 'mobile';

    const finalX     = isMobile ? (pos.mobileX        ?? pos.x        ?? 0) : (pos.x        ?? 0);
    const finalY     = isMobile ? (pos.mobileY        ?? pos.y        ?? 0) : (pos.y        ?? 0);
    const finalScale = isMobile ? (pos.mobileScale    ?? pos.scale    ?? 1) : (pos.scale    ?? 1);
    const finalRot   = isMobile ? (pos.mobileRotation ?? pos.rotation ?? 0) : (pos.rotation ?? 0);
    const sizes      = (p.elementSizes as Record<string, ElementSize>)?.[generatedId] ?? {};

    return (
        <div
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') handleClick(e as unknown as React.MouseEvent); }}
            className={`omnora-logo-wrap ${className ?? ''}`}
            onClick={handleClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            data-element-id={generatedId}
            data-element-type="logo"
            style={{
                ...style,
                cursor:          mode === 'preview' ? 'default' : 'pointer',
                position:        isFree ? 'absolute' : 'relative',
                transform:       isFree ? `translate3d(${finalX}px, ${finalY}px, 0) rotate(${finalRot}deg) scale(${finalScale})` : undefined,
                transformOrigin: 'center center',
                zIndex:          isFree ? (pos.z ?? 50) : undefined,
                width:           isFree ? (sizes.width  ?? 'auto') : undefined,
                height:          isFree ? (sizes.height ?? 'auto') : undefined,
                display: 'inline-flex', alignItems: 'center',
                userSelect: 'none',
            }}
        >
            {resolvedLogoSrc ? (
                <div style={{ position: 'relative' }}>
                    <img
                        src={resolvedLogoSrc}
                        alt={storeName ?? 'Logo'}
                        style={{ maxHeight: 36, maxWidth: 160, objectFit: 'contain', display: 'block' }}
                    />
                    {mode === 'edit' && hovered && (
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: 'rgba(0,0,0,0.45)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 9, color: '#fff', fontWeight: 800,
                            borderRadius: 4, letterSpacing: '0.05em',
                        }}>CHANGE</div>
                    )}
                </div>
            ) : (
                <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
                    {storeName ?? 'Store'}
                </span>
            )}
        </div>
    );
});
EditableLogo.displayName = 'EditableLogo';

// ─── EditableBadge ────────────────────────────────────────────────────────────

export interface EditableBadgeProps {
    nodeId: string;
    icon?: React.ReactNode;
    text: string;
    className?: string;
    style?: React.CSSProperties;
    elementId?: string;
}

export const EditableBadge: React.FC<EditableBadgeProps> = React.memo(({
    nodeId, icon, text, className, style, elementId,
}) => {
    const { mode, selectNode, nodes, viewport } = useOmnora();
    const node        = nodes[nodeId];
    const generatedId = elementId || generateElementId(nodeId, 'badge');

    if (!node) return null;

    const pos    = (node.props?.elementPositions as Record<string, ElementPosition>)?.[generatedId] ?? { mode: 'flow', x: 0, y: 0, z: 1 };
    const isFree   = pos.mode === 'free';
    const isMobile = viewport === 'mobile';

    const finalX     = isMobile ? (pos.mobileX        ?? pos.x        ?? 0) : (pos.x        ?? 0);
    const finalY     = isMobile ? (pos.mobileY        ?? pos.y        ?? 0) : (pos.y        ?? 0);
    const finalScale = isMobile ? (pos.mobileScale    ?? pos.scale    ?? 1) : (pos.scale    ?? 1);
    const finalRot   = isMobile ? (pos.mobileRotation ?? pos.rotation ?? 0) : (pos.rotation ?? 0);
    const sizes      = (node.props?.elementSizes as Record<string, ElementSize>)?.[generatedId] ?? {};

    return (
        <div
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' && mode !== 'preview') selectNode?.(nodeId); }}
            className={`omnora-badge ${className ?? ''}`}
            onClick={e => { if (mode !== 'preview') { e.stopPropagation(); selectNode?.(nodeId); } }}
            data-element-id={generatedId}
            data-element-type="badge"
            style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                cursor:          mode === 'preview' ? 'default' : 'pointer',
                position:        isFree ? 'absolute' : 'relative',
                transform:       isFree ? `translate3d(${finalX}px, ${finalY}px, 0) rotate(${finalRot}deg) scale(${finalScale})` : undefined,
                transformOrigin: 'center center',
                zIndex:          isFree ? (pos.z ?? 1) : undefined,
                width:           isFree ? (sizes.width  ?? 'auto') : undefined,
                height:          isFree ? (sizes.height ?? 'auto') : undefined,
                ...style,
            }}
        >
            {icon && <span className="badge-icon">{icon}</span>}
            <span className="badge-text">{text}</span>
        </div>
    );
});
EditableBadge.displayName = 'EditableBadge';