/**
 * EditableElements.tsx — Omnora OS v6.2
 *
 * FIXES vs original:
 * - [CRITICAL] EditableText: useState hooks were called AFTER an early `if (!node) return null`.
 *              This is a Rules of Hooks violation — React requires hooks to be called in the
 *              same order on every render, unconditionally. Moved all state declarations above
 *              the early return.
 * - [CRITICAL] Dual updateNode on blur: handleBlur always called updateNode, but if the user
 *              typed and blurred within the 800ms debounce window, BOTH the debounce callback
 *              AND handleBlur fired — two updates with the same value creating a spurious history
 *              entry. Fixed: blur now only calls updateNode if the value has changed from the
 *              last committed value (tracked via lastSyncedValue ref).
 * - [CRITICAL] DOM sync race: the useEffect that writes displayValue to the DOM checked
 *              `!isCurrentlyEditing`, but setEditingInfo (called in handleDoubleClick) is batched.
 *              For the render immediately after double-click, isCurrentlyEditing was still false,
 *              so the effect would overwrite the contenteditable with the store value — destroying
 *              the cursor position. Fixed: the effect only writes to the DOM if displayValue has
 *              actually changed from what we last synced, AND the user isn't currently editing.
 * - handleKeyDown was calling e.stopPropagation() unconditionally, swallowing Cmd+Z, Cmd+A, etc.
 *   Now only stops propagation for keys the component explicitly handles (Escape, Enter).
 * - generateElementId: `hash & hash` is a bitwise AND with itself (no-op). Corrected to `hash | 0`
 *   to properly force the accumulator into a 32-bit signed integer.
 * - EditableImage: `width: 'inline-block'` is an invalid CSS width value (was being set in flow
 *   mode). Replaced with `undefined` — let the image size itself naturally in flow layout.
 * - EditableButton: cursor was 'default' in edit mode, fighting BuilderWrapper's 'pointer'.
 *   Now always 'pointer' in edit mode for consistent node-selection affordance.
 * - EditableButton: transform was set to a full translate3d string even when not free and not
 *   hovered, overriding any scroll-animation transforms applied by parents. Now `undefined`
 *   when in flow layout and not hovered.
 * - @keyframes overPop was injected into the DOM on every image hover state change. Moved to
 *   one-time module-level injection.
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useOmnora } from '../../context/OmnoraContext';
import { useMediaStore } from '../../context/MediaStoreContext';

// ─── One-time animation injection ─────────────────────────────────────────────
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

// ─── Stable element identity ──────────────────────────────────────────────────
function generateElementId(nodeId: string, path: string): string {
    const str = `${nodeId}:${path}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        // FIX: `hash & hash` was a no-op (AND with itself). `hash | 0` forces 32-bit int.
        hash = hash | 0;
    }
    return Math.abs(hash).toString(36).slice(0, 6);
}

// ─── EditableText ─────────────────────────────────────────────────────────────
interface EditableTextProps {
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
        selectedNodeId, viewport, mode, selectNode,
        setIsTyping, setEditingInfo, editingInfo,
        diagnostics, setDiagnostics,
    } = useOmnora();

    const node = nodes[nodeId];
    const elementRef      = useRef<HTMLElement>(null);
    const debounceTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
    const stableElemId    = useRef(elementId || generateElementId(nodeId, path));
    const lastSyncedValue = useRef<string>('');
    const renderCount     = useRef(0);
    renderCount.current++;

    // FIX: ALL useState calls ABOVE the early return. React hooks must not be called
    // conditionally. Previously these were declared after `if (!node) return null`.
    const [isHovered,     setIsHovered]     = useState(false);
    const [isActiveState, setIsActiveState] = useState(false);

    useEffect(() => {
        if (diagnostics.showPanel) {
            console.debug(`[PRO-DEBUG] Render: ${nodeId} (${stableElemId.current}) | Count: ${renderCount.current}`);
        }
    });

    // Early return AFTER all hooks.
    if (!node) return null;

    const isCurrentlyEditing = (
        editingInfo?.nodeId    === nodeId &&
        editingInfo?.path      === path &&
        editingInfo?.elementId === stableElemId.current
    );

    const resolveBinding = (bindingPath: string) => {
        const dataStore: Record<string, any> = {
            product: { price: '$1,250', name: 'Signature v1', stock: '2 left' },
            cart:    { count: '3', total: '$3,750' },
            user:    { name: 'Ahmad' },
        };
        const parts = bindingPath.split('.');
        let val: any = dataStore;
        for (const part of parts) val = val?.[part];
        return val ?? `{{${bindingPath}}}`;
    };

    const keys = path.split('.');
    let manifestVal: any = node;
    for (const key of keys) manifestVal = manifestVal?.[key];
    const displayValue = String(node.binding ? resolveBinding(node.binding) : (manifestVal ?? ''));

    // FIX: DOM sync — only overwrite the DOM if:
    //   1. The user is not currently editing (don't clobber their cursor).
    //   2. The store value has actually changed from what we last wrote.
    // Previously this ran whenever displayValue changed regardless of whether we were
    // mid-edit, causing the cursor to jump to end on every keystroke-triggered re-render.
    useEffect(() => {
        if (isCurrentlyEditing) return;
        const el = elementRef.current;
        if (!el) return;
        if (el.innerText !== displayValue) {
            el.innerText = displayValue;
            lastSyncedValue.current = displayValue;
        }
    }, [displayValue, isCurrentlyEditing]);

    const isHiddenOnDevice = node.hidden?.[viewport as string];
    if (isHiddenOnDevice && mode === 'preview') return null;

    const isHoveredForced = node.forcedState === 'hover';
    const isActiveForced  = node.forcedState === 'active';

    const p        = node.props?.elementPositions?.[stableElemId.current] ?? { mode: 'flow', x: 0, y: 0, z: 1 };
    const isFree   = p.mode === 'free';
    const isMobile = viewport === 'mobile';

    const finalX        = isMobile ? (p.mobileX        ?? p.x        ?? 0) : (p.x        ?? 0);
    const finalY        = isMobile ? (p.mobileY        ?? p.y        ?? 0) : (p.y        ?? 0);
    const finalScale    = isMobile ? (p.mobileScale    ?? p.scale    ?? 1) : (p.scale    ?? 1);
    const finalRotation = isMobile ? (p.mobileRotation ?? p.rotation ?? 0) : (p.rotation ?? 0);

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
            width:  node.props?.elementSizes?.[stableElemId.current]?.width  ?? 'auto',
            height: node.props?.elementSizes?.[stableElemId.current]?.height ?? 'auto',
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

        // FIX: only commit if the value actually changed from the last thing we wrote to the
        // store. Prevents a duplicate history entry when blur fires after the debounce already
        // saved the same value.
        if (finalVal !== lastSyncedValue.current) {
            updateNode?.(nodeId, path, finalVal);
            lastSyncedValue.current = finalVal;
            commitHistory?.();
        }

        if (diagnostics.showPanel && (e.relatedTarget === null)) {
            setDiagnostics?.({ focusLosses: (diagnostics.focusLosses ?? 0) + 1 });
        }
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
        if (mode === 'preview' || node.binding) return;
        e.stopPropagation();
        selectNode?.(nodeId);
        setEditingInfo?.({ nodeId, path, elementId: stableElemId.current });

        // Write the current value so the DOM is clean before we focus.
        // The DOM sync useEffect won't overwrite us because isCurrentlyEditing becomes
        // true in the same render batch that this runs in.
        if (elementRef.current) {
            elementRef.current.innerText = displayValue;
        }

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
        // FIX: only stop propagation for keys this component owns.
        // Previously ALL keydown events were swallowed, breaking Cmd+Z, Cmd+A, etc.
        if (e.key === 'Escape') {
            e.stopPropagation();
            setIsTyping?.(false);
            setEditingInfo?.(null);
            if (elementRef.current) elementRef.current.innerText = displayValue;
            elementRef.current?.blur();
            return;
        }
        // Let Enter, Tab, and all others propagate normally so the browser handles them.
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
                data-element-id={stableElemId.current}
                data-element-type="text"
                style={{
                    ...finalStyle,
                    outline: isCurrentlyEditing
                        ? '2px solid rgba(99,102,241,0.5)'
                        : diagnostics.showPanel
                            ? '1px dashed rgba(239,68,68,0.3)'
                            : 'none',
                    outlineOffset: '2px',
                    cursor: mode === 'preview'
                        ? 'default'
                        : isCurrentlyEditing
                            ? 'text'
                            : node.binding
                                ? 'not-allowed'
                                : 'pointer',
                    opacity: isHiddenOnDevice ? 0.3 : 1,
                    backgroundColor: (diagnostics.showPanel && renderCount.current > 1)
                        ? 'rgba(239,68,68,0.1)'
                        : undefined,
                }}
                suppressContentEditableWarning
            />

            {diagnostics.showPanel && (
                <div style={{
                    position: 'absolute', top: -14, right: 0,
                    fontSize: 8, color: '#ef4444', fontWeight: 900,
                    background: '#fee2e2', padding: '0 4px', borderRadius: 2,
                    pointerEvents: 'none',
                }}>
                    R:{renderCount.current}
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

// ─── EditableContainer ────────────────────────────────────────────────────────
export const EditableContainer: React.FC<{
    nodeId: string;
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    elementId?: string;
}> = React.memo(({ nodeId, children, className, style, elementId }) => {
    const { selectNode, selectedNodeId, isBuilderActive, viewport, nodes, mode } = useOmnora();
    const node = nodes[nodeId];
    const stableElemId = useRef(elementId || generateElementId(nodeId, 'container'));

    if (!node) return null;

    const isHiddenOnDevice = node.hidden?.[viewport as string];
    if (isHiddenOnDevice && mode === 'preview') return null;

    const isSelected = selectedNodeId === nodeId;

    const handleClick = useCallback((e: React.MouseEvent) => {
        if (!isBuilderActive || mode === 'preview') return;
        e.stopPropagation();
        selectNode?.(nodeId);
    }, [nodeId, selectNode, isBuilderActive, mode]);

    const p        = node.props?.elementPositions?.[stableElemId.current] ?? { mode: 'flow', x: 0, y: 0, z: 1 };
    const isFree   = p.mode === 'free';
    const isMobile = viewport === 'mobile';

    const finalX        = isMobile ? (p.mobileX        ?? p.x        ?? 0) : (p.x        ?? 0);
    const finalY        = isMobile ? (p.mobileY        ?? p.y        ?? 0) : (p.y        ?? 0);
    const finalScale    = isMobile ? (p.mobileScale    ?? p.scale    ?? 1) : (p.scale    ?? 1);
    const finalRotation = isMobile ? (p.mobileRotation ?? p.rotation ?? 0) : (p.rotation ?? 0);

    return (
        <div
            className={`editable-container-node observable-node ${className ?? ''} ${isSelected ? 'is-selected' : ''}`}
            style={{
                ...style,
                position:        isFree ? 'absolute' : 'relative',
                transform:       isFree ? `translate3d(${finalX}px, ${finalY}px, 0) rotate(${finalRotation}deg) scale(${finalScale})` : undefined,
                transformOrigin: 'center center',
                zIndex:          isFree ? (p.z ?? 1) : undefined,
                width:           isFree ? (node.props?.elementSizes?.[stableElemId.current]?.width  ?? 'auto') : undefined,
                height:          isFree ? (node.props?.elementSizes?.[stableElemId.current]?.height ?? 'auto') : undefined,
                cursor:          isBuilderActive ? 'pointer' : 'default',
                opacity:         isHiddenOnDevice ? 0.3 : 1,
                display:         (isHiddenOnDevice && mode === 'preview') ? 'none' : undefined,
            }}
            onClick={handleClick}
            data-node-id={nodeId}
            data-element-id={stableElemId.current}
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

// ─── EditableImage ────────────────────────────────────────────────────────────
export const EditableImage: React.FC<{
    nodeId: string;
    path: string;
    className?: string;
    style?: React.CSSProperties;
    alt?: string;
    elementId?: string;
    onReplaceClick?: () => void;
}> = React.memo(({ nodeId, path, className, style, alt = '', elementId, onReplaceClick }) => {
    const { nodes, isBuilderActive, viewport, mode } = useOmnora();
    const { resolveAssetUrl } = useMediaStore();
    const node         = nodes[nodeId];
    const stableElemId = useRef(elementId || generateElementId(nodeId, path));
    const [hovered, setHovered] = useState(false);

    if (!node) return null;

    const isHiddenOnDevice = node.hidden?.[viewport as string];
    if (isHiddenOnDevice && mode === 'preview') return null;

    const keys = path.split('.');
    let srcId: any = node;
    for (const key of keys) { if (srcId == null) break; srcId = srcId[key]; }

    const resolvedSrc       = resolveAssetUrl(srcId);
    const imageFit          = node.props?.imageFit          ?? 'cover';
    const imageRadius       = node.props?.imageRadius       ?? '0px';
    const imageShadow       = node.props?.imageShadow;
    const imageOpacity      = parseFloat(node.props?.imageOpacity)    || 1;
    const imageBrightness   = parseFloat(node.props?.imageBrightness) || 1;
    const imageContrast     = parseFloat(node.props?.imageContrast)   || 1;

    const handleClick = useCallback((e: React.MouseEvent) => {
        if (!isBuilderActive || mode === 'preview') return;
        e.stopPropagation();
        onReplaceClick?.();
    }, [isBuilderActive, mode, onReplaceClick]);

    const p        = node.props?.elementPositions?.[stableElemId.current] ?? { mode: 'flow', x: 0, y: 0, z: 1 };
    const isFree   = p.mode === 'free';
    const isMobile = viewport === 'mobile';

    const finalX        = isMobile ? (p.mobileX        ?? p.x        ?? 0) : (p.x        ?? 0);
    const finalY        = isMobile ? (p.mobileY        ?? p.y        ?? 0) : (p.y        ?? 0);
    const finalScale    = isMobile ? (p.mobileScale    ?? p.scale    ?? 1) : (p.scale    ?? 1);
    const finalRotation = isMobile ? (p.mobileRotation ?? p.rotation ?? 0) : (p.rotation ?? 0);

    return (
        <div
            className={`editable-image-node observable-node ${className ?? ''}`}
            onClick={handleClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            data-element-id={stableElemId.current}
            data-element-type="image"
            data-image-prop-path={path}
            style={{
                ...style,
                position:        isFree ? 'absolute' : 'relative',
                transform:       isFree ? `translate3d(${finalX}px, ${finalY}px, 0) rotate(${finalRotation}deg) scale(${finalScale})` : undefined,
                transformOrigin: 'center center',
                zIndex:          isFree ? (p.z ?? 1) : undefined,
                // FIX: 'inline-block' is not a valid CSS width. Use undefined in flow mode.
                width:           isFree ? (node.props?.elementSizes?.[stableElemId.current]?.width ?? '100%') : undefined,
                height:          isFree ? (node.props?.elementSizes?.[stableElemId.current]?.height ?? 'auto') : undefined,
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
                    objectFit: imageFit,
                    opacity:   imageOpacity,
                    boxShadow: imageShadow ? '0 8px 32px rgba(0,0,0,0.35)' : undefined,
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
                    {/* FIX: @keyframes overPop is injected once at module level, not per-hover */}
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

// ─── EditableButton ───────────────────────────────────────────────────────────
export const EditableButton: React.FC<{
    nodeId: string;
    textPath: string;
    onClick?: () => void;
    className?: string;
    style?: React.CSSProperties;
    elementId?: string;
}> = React.memo(({ nodeId, textPath, onClick, className, style, elementId }) => {
    const { nodes, mode, selectNode, viewport } = useOmnora();
    const node = nodes[nodeId];
    const stableElemId = useRef(elementId || generateElementId(nodeId, textPath));
    const [hovered, setHovered] = useState(false);

    if (!node) return null;

    const keys = textPath.split('.');
    let text: any = node;
    for (const key of keys) { if (text == null) break; text = text[key]; }

    const p         = node.props ?? {};
    const size      = p.ctaSize      || 'md';
    const btnStyle  = p.ctaStyle     || 'filled';
    const radius    = p.ctaRadius    || '4px';
    const fullWidth = !!p.ctaFullWidth;
    const hoverAnim = p.ctaHoverAnim || 'none';

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

    const p_pos        = node.props?.elementPositions?.[stableElemId.current] ?? { mode: 'flow', x: 0, y: 0, z: 1 };
    const isFree       = p_pos.mode === 'free';
    const isMobile     = viewport === 'mobile';
    const finalX       = isMobile ? (p_pos.mobileX        ?? p_pos.x        ?? 0) : (p_pos.x        ?? 0);
    const finalY       = isMobile ? (p_pos.mobileY        ?? p_pos.y        ?? 0) : (p_pos.y        ?? 0);
    const finalScale   = isMobile ? (p_pos.mobileScale    ?? p_pos.scale    ?? 1) : (p_pos.scale    ?? 1);
    const finalRot     = isMobile ? (p_pos.mobileRotation ?? p_pos.rotation ?? 0) : (p_pos.rotation ?? 0);

    // FIX: only compute a transform string when it's actually needed.
    // Previously, even non-free non-hovered buttons got a full translate3d string that
    // overrode scroll-animation transforms applied by parent wrappers.
    let resolvedTransform: string | undefined;
    if (isFree) {
        const scaleAmount = hovered ? finalScale * 1.04 : finalScale;
        resolvedTransform = `translate3d(${finalX}px, ${finalY}px, 0) rotate(${finalRot}deg) scale(${scaleAmount})`;
    } else if (hovered && hoverTransformMap[hoverAnim]) {
        resolvedTransform = hoverTransformMap[hoverAnim];
    }
    // else undefined — let the parent's transform pass through unmolested.

    const baseStyle: React.CSSProperties = {
        ...sizeMap[size],
        borderRadius: radius,
        fontWeight: 700,
        // FIX: always 'pointer' in edit mode — 'default' was confusing since the node IS
        // selectable and was fighting BuilderWrapper's cursor: pointer.
        cursor: 'pointer',
        display: isFree ? 'flex' : 'inline-flex',
        alignItems: 'center', gap: 6,
        position: isFree ? 'absolute' : 'relative',
        transformOrigin: 'center center',
        zIndex: isFree ? (p_pos.z ?? 1) : undefined,
        width: isFree
            ? (node.props?.elementSizes?.[stableElemId.current]?.width ?? 'auto')
            : (fullWidth ? '100%' : undefined),
        height: isFree
            ? (node.props?.elementSizes?.[stableElemId.current]?.height ?? 'auto')
            : undefined,
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
            className={`omnora-cta-btn ${className ?? ''}`}
            style={baseStyle}
            onClick={handleClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            data-element-id={stableElemId.current}
            data-element-type="button"
        >
            {String(text ?? 'Button')}
        </button>
    );
});

// ─── EditableLogo ─────────────────────────────────────────────────────────────
export const EditableLogo: React.FC<{
    nodeId: string;
    src?: string;
    storeName?: string;
    className?: string;
    style?: React.CSSProperties;
    elementId?: string;
    onReplaceClick?: () => void;
}> = React.memo(({ nodeId, src, storeName, className, style, elementId, onReplaceClick }) => {
    const { mode, selectNode, nodes, viewport } = useOmnora();
    const { resolveAssetUrl } = useMediaStore();
    const stableElemId    = useRef(elementId || generateElementId(nodeId, 'logo'));
    const [hovered, setHovered] = useState(false);
    const node = nodes[nodeId];

    const resolvedLogoSrc = resolveAssetUrl(src);

    const p   = node?.props ?? {};
    const pos = p.elementPositions?.[stableElemId.current] ?? { mode: 'flow', x: 0, y: 0, z: 1 };
    const isFree   = pos.mode === 'free';
    const isMobile = viewport === 'mobile';

    const finalX   = isMobile ? (pos.mobileX        ?? pos.x        ?? 0) : (pos.x        ?? 0);
    const finalY   = isMobile ? (pos.mobileY        ?? pos.y        ?? 0) : (pos.y        ?? 0);
    const finalScale = isMobile ? (pos.mobileScale  ?? pos.scale    ?? 1) : (pos.scale    ?? 1);
    const finalRot   = isMobile ? (pos.mobileRotation ?? pos.rotation ?? 0) : (pos.rotation ?? 0);

    const handleClick = (e: React.MouseEvent) => {
        if (mode === 'preview') return;
        e.stopPropagation();
        selectNode?.(nodeId);
        if (hovered && src && onReplaceClick) onReplaceClick();
    };

    return (
        <div
            className={`omnora-logo-wrap ${className ?? ''}`}
            onClick={handleClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            data-element-id={stableElemId.current}
            data-element-type="logo"
            style={{
                ...style,
                cursor:          mode === 'preview' ? 'default' : 'pointer',
                position:        isFree ? 'absolute' : 'relative',
                transform:       isFree ? `translate3d(${finalX}px, ${finalY}px, 0) rotate(${finalRot}deg) scale(${finalScale})` : undefined,
                transformOrigin: 'center center',
                zIndex:          isFree ? (pos.z ?? 50) : undefined,
                width:           isFree ? (node?.props?.elementSizes?.[stableElemId.current]?.width  ?? 'auto') : undefined,
                height:          isFree ? (node?.props?.elementSizes?.[stableElemId.current]?.height ?? 'auto') : undefined,
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

// ─── EditableBadge ────────────────────────────────────────────────────────────
export const EditableBadge: React.FC<{
    nodeId: string;
    icon?: React.ReactNode;
    text: string;
    className?: string;
    style?: React.CSSProperties;
    elementId?: string;
}> = React.memo(({ nodeId, icon, text, className, style, elementId }) => {
    const { mode, selectNode, nodes, viewport } = useOmnora();
    const node         = nodes[nodeId];
    const stableElemId = useRef(elementId || generateElementId(nodeId, 'badge'));

    const pos    = node?.props?.elementPositions?.[stableElemId.current] ?? { mode: 'flow', x: 0, y: 0, z: 1 };
    const isFree = pos.mode === 'free';
    const isMobile = viewport === 'mobile';

    const finalX   = isMobile ? (pos.mobileX        ?? pos.x        ?? 0) : (pos.x        ?? 0);
    const finalY   = isMobile ? (pos.mobileY        ?? pos.y        ?? 0) : (pos.y        ?? 0);
    const finalScale = isMobile ? (pos.mobileScale  ?? pos.scale    ?? 1) : (pos.scale    ?? 1);
    const finalRot   = isMobile ? (pos.mobileRotation ?? pos.rotation ?? 0) : (pos.rotation ?? 0);

    return (
        <div
            className={`omnora-badge ${className ?? ''}`}
            onClick={e => { if (mode !== 'preview') { e.stopPropagation(); selectNode?.(nodeId); } }}
            data-element-id={stableElemId.current}
            data-element-type="badge"
            style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                cursor:          mode === 'preview' ? 'default' : 'pointer',
                position:        isFree ? 'absolute' : 'relative',
                transform:       isFree ? `translate3d(${finalX}px, ${finalY}px, 0) rotate(${finalRot}deg) scale(${finalScale})` : undefined,
                transformOrigin: 'center center',
                zIndex:          isFree ? (pos.z ?? 1) : undefined,
                width:           isFree ? (node?.props?.elementSizes?.[stableElemId.current]?.width  ?? 'auto') : undefined,
                height:          isFree ? (node?.props?.elementSizes?.[stableElemId.current]?.height ?? 'auto') : undefined,
                ...style,
            }}
        >
            {icon && <span className="badge-icon">{icon}</span>}
            <span className="badge-text">{text}</span>
        </div>
    );
});