import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { useOmnora } from '../client/OmnoraContext';
import { useMediaStore } from '../client/AssetContext';
import { useNodeSelector } from '../../hooks/useNodeSelector';
import { dispatcher } from '../core/Dispatcher';

// ─── Deterministic Identity ──────────────────────────────────────────────────
function generateElementId(nodeId: string, path: string): string {
    const str = `${nodeId}:${path}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(36).slice(0, 6);
}

// ─── TextBlock ─────────────────────────────────────────────────────────────
interface TextBlockProps {
    nodeId: string;
    path: string;
    className?: string;
    style?: React.CSSProperties;
    tag?: keyof React.JSX.IntrinsicElements;
    elementId?: string;
}

export const TextBlock: React.FC<TextBlockProps> = React.memo(({
    nodeId, path, className, style, tag: Tag = 'div', elementId,
}) => {
    const {
        commitHistory,
        selectedNodeId, viewport, mode, selectNode,
        setIsTyping, setEditingInfo, editingInfo
    } = useOmnora();

    // High-scale granular subscription
    const node = useNodeSelector(nodeId, (n) => ({
        props: n.props,
        styles: n.styles,
        interactions: n.interactions,
        binding: n.binding,
        hidden: n.hidden,
        forcedState: n.forcedState,
        motion: n.motion,
        revision: n.revision
    }));

    const elementRef = useRef<HTMLDivElement>(null);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);
    const stableElemId = useRef(elementId || generateElementId(nodeId, path));
    const lastSyncedValue = useRef<string>('');

    const isCurrentlyEditing = editingInfo?.nodeId === nodeId && editingInfo?.path === path && editingInfo?.elementId === stableElemId.current;

    if (!node) return null;

    const resolveBinding = (bindingPath: string) => {
        const dataStore = {
            product: { price: '$1,250', name: 'Signature v1', stock: '2 left' },
            cart: { count: '3', total: '$3,750' },
            user: { name: 'Ahmad' },
        };
        const parts = bindingPath.split('.');
        let val: any = dataStore;
        for (const part of parts) val = val?.[part];
        return val || `{{${bindingPath}}}`;
    };

    const keys = path.split('.');
    let manifestVal: any = node;
    for (const key of keys) manifestVal = manifestVal?.[key];
    const displayValue = String(node.binding ? resolveBinding(node.binding) : (manifestVal || ''));

    useEffect(() => {
        if (elementRef.current && !isCurrentlyEditing) {
            if (elementRef.current.innerText !== displayValue) {
                elementRef.current.innerText = displayValue;
                lastSyncedValue.current = displayValue;
            }
        }
    }, [displayValue, isCurrentlyEditing]);

    const isHiddenOnDevice = node.hidden?.[viewport];
    if (isHiddenOnDevice && mode !== 'edit') return null;

    const [isHovered, setIsHovered] = useState(false);
    const [isActiveState, setIsActiveState] = useState(false);

    const isHoveredForced = node.forcedState === 'hover';
    const isActiveForced = node.forcedState === 'active';

    const p = node.props?.elementPositions?.[stableElemId.current] || { mode: 'flow', x: 0, y: 0, z: 1 };
    const isFree = p.mode === 'free';
    const isMobile = viewport === 'mobile';

    const finalX = isMobile ? (p.mobileX ?? p.x ?? 0) : (p.x ?? 0);
    const finalY = isMobile ? (p.mobileY ?? p.y ?? 0) : (p.y ?? 0);
    const finalScale = isMobile ? (p.mobileScale ?? p.scale ?? 1) : (p.scale ?? 1);
    const finalRotation = isMobile ? (p.mobileRotation ?? p.rotation ?? 0) : (p.rotation ?? 0);

    const finalStyle: React.CSSProperties = {
        transition: isCurrentlyEditing ? 'none' : `all ${node.motion?.duration || 200}ms ${node.motion?.curve || 'ease'}`,
        ...style,
        ...node.styles,
        ...((isHovered || isHoveredForced) ? node.interactions?.hover : {}),
        ...((isActiveState || isActiveForced) ? node.interactions?.active : {}),
        ...(isFree ? {
            position: 'absolute',
            transform: `translate3d(${finalX}px, ${finalY}px, 0) rotate(${finalRotation}deg) scale(${finalScale})`,
            transformOrigin: 'center center',
            zIndex: p.z || 1,
            width: node.props?.elementSizes?.[stableElemId.current]?.width || 'auto',
            height: node.props?.elementSizes?.[stableElemId.current]?.height || 'auto',
        } : {}),
    };

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        if (node.binding || mode !== 'edit') return;
        const newText = e.currentTarget.innerText;
        setIsTyping?.(true);
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            dispatcher.dispatch({
                nodeId,
                path,
                value: newText,
                type: 'visual',
                source: 'editor'
            });
        }, 800);
    };

    const handleBlur = (e: React.FocusEvent) => {
        if (mode !== 'edit') return;
        setIsTyping?.(false);
        setEditingInfo?.(null);
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        const finalVal = elementRef.current?.innerText || '';
        dispatcher.dispatch({
            nodeId,
            path,
            value: finalVal,
            type: 'visual',
            source: 'editor'
        });
        commitHistory?.();
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
        if (mode !== 'edit' || node.binding) return;
        e.stopPropagation();
        selectNode?.(nodeId);
        setEditingInfo?.({ nodeId, path, elementId: stableElemId.current });

        if (elementRef.current) {
            elementRef.current.innerText = displayValue;
        }

        requestAnimationFrame(() => {
            if (elementRef.current) {
                elementRef.current.focus();
                const sel = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(elementRef.current);
                range.collapse(false);
                sel?.removeAllRanges();
                sel?.addRange(range);
            }
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setIsTyping?.(false);
            setEditingInfo?.(null);
            if (elementRef.current) elementRef.current.innerText = displayValue;
            elementRef.current?.blur();
        }
        e.stopPropagation();
    };

    const handleClick = (e: React.MouseEvent) => {
        if (mode !== 'edit' || isCurrentlyEditing) return;
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
                className={`omnora-text-block ${className || ''} ${isCurrentlyEditing ? 'is-editing' : ''}`}
                data-element-id={stableElemId.current}
                data-element-type="text"
                style={{
                    ...finalStyle,
                    outline: isCurrentlyEditing ? '2px solid rgba(99,102,241,0.5)' : 'none',
                    outlineOffset: '2px',
                    cursor: mode !== 'edit' ? 'default' : (isCurrentlyEditing ? 'text' : (node.binding ? 'not-allowed' : 'pointer')),
                    opacity: isHiddenOnDevice ? 0.3 : 1,
                }}
                suppressContentEditableWarning
            />
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

// ─── ContainerBlock ────────────────────────────────────────────────────────
export const ContainerBlock: React.FC<{
    nodeId: string;
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    elementId?: string;
}> = React.memo(({ nodeId, children, className, style, elementId }) => {
    const { selectNode, selectedNodeId, isBuilderActive, viewport, mode } = useOmnora();

    const node = useNodeSelector(nodeId, (n) => ({
        props: n.props,
        hidden: n.hidden,
        revision: n.revision
    }));

    const stableElemId = useRef(elementId || generateElementId(nodeId, 'container'));

    if (!node) return null;
    const isHiddenOnDevice = node.hidden?.[viewport];
    if (isHiddenOnDevice && mode !== 'edit') return null;

    const isSelected = selectedNodeId === nodeId;

    const handleClick = useCallback((e: React.MouseEvent) => {
        if (!isBuilderActive || mode !== 'edit') return;
        e.stopPropagation();
        selectNode?.(nodeId);
    }, [nodeId, selectNode, isBuilderActive, mode]);

    const p = node.props?.elementPositions?.[stableElemId.current] || { mode: 'flow', x: 0, y: 0, z: 1 };
    const isFree = p.mode === 'free';
    const isMobile = viewport === 'mobile';

    const finalX = isMobile ? (p.mobileX ?? p.x ?? 0) : (p.x ?? 0);
    const finalY = isMobile ? (p.mobileY ?? p.y ?? 0) : (p.y ?? 0);
    const finalScale = isMobile ? (p.mobileScale ?? p.scale ?? 1) : (p.scale ?? 1);
    const finalRotation = isMobile ? (p.mobileRotation ?? p.rotation ?? 0) : (p.rotation ?? 0);

    return (
        <div
            className={`omnora-container-block observable-node ${className || ''} ${isSelected ? 'is-selected' : ''}`}
            style={{
                ...style,
                position: isFree ? 'absolute' : 'relative',
                transform: isFree ? `translate3d(${finalX}px, ${finalY}px, 0) rotate(${finalRotation}deg) scale(${finalScale})` : undefined,
                transformOrigin: 'center center',
                zIndex: isFree ? (p.z || 1) : undefined,
                width: isFree ? (node.props?.elementSizes?.[stableElemId.current]?.width || 'auto') : undefined,
                height: isFree ? (node.props?.elementSizes?.[stableElemId.current]?.height || 'auto') : undefined,
                cursor: mode === 'edit' && isBuilderActive ? 'pointer' : 'default',
                opacity: isHiddenOnDevice ? 0.3 : 1,
                display: isHiddenOnDevice && mode !== 'edit' ? 'none' : undefined,
            }}
            onClick={handleClick}
            data-node-id={nodeId}
            data-element-id={stableElemId.current}
            data-element-type="container"
        >
            {children}
            {mode === 'edit' && isHiddenOnDevice && (
                <span style={{ position: 'absolute', top: 0, right: 0, fontSize: '8px', background: 'var(--accent-primary)', color: '#000', padding: '2px 4px', fontWeight: 900 }}>HIDDEN</span>
            )}
        </div>
    );
});

// ─── ImageBlock ────────────────────────────────────────────────────────────
export const ImageBlock: React.FC<{
    nodeId: string;
    path: string;
    className?: string;
    style?: React.CSSProperties;
    alt?: string;
    elementId?: string;
    onReplaceClick?: () => void;
}> = React.memo(({ nodeId, path, className, style, alt = '', elementId, onReplaceClick }) => {
    const { isBuilderActive, viewport, mode, selectNode } = useOmnora();
    const { resolveAssetUrl } = useMediaStore();

    const node = useNodeSelector(nodeId, (n) => ({
        props: n.props,
        hidden: n.hidden,
        revision: n.revision
    }));

    const stableElemId = useRef(elementId || generateElementId(nodeId, path));
    const [hovered, setHovered] = useState(false);

    if (!node) return null;

    const isHiddenOnDevice = node.hidden?.[viewport];
    if (isHiddenOnDevice && mode !== 'edit') return null;

    const keys = path.split('.');
    let srcId: any = node;
    for (const key of keys) { if (srcId == null) break; srcId = srcId[key]; }

    const resolvedSrc = resolveAssetUrl(srcId);
    const p = node.props || {};

    const handleClick = useCallback((e: React.MouseEvent) => {
        if (!isBuilderActive || mode !== 'edit') return;
        e.stopPropagation();
        selectNode?.(nodeId);
        if (onReplaceClick) onReplaceClick();
    }, [isBuilderActive, mode, nodeId, onReplaceClick, selectNode]);

    const p_pos = node.props?.elementPositions?.[stableElemId.current] || { mode: 'flow', x: 0, y: 0, z: 1 };
    const isFree = p_pos.mode === 'free';
    const isMobile = viewport === 'mobile';

    const finalX = isMobile ? (p_pos.mobileX ?? p_pos.x ?? 0) : (p_pos.x ?? 0);
    const finalY = isMobile ? (p_pos.mobileY ?? p_pos.y ?? 0) : (p_pos.y ?? 0);
    const finalScale = isMobile ? (p_pos.mobileScale ?? p_pos.scale ?? 1) : (p_pos.scale ?? 1);
    const finalRotation = isMobile ? (p_pos.mobileRotation ?? p_pos.rotation ?? 0) : (p_pos.rotation ?? 0);

    return (
        <div
            className={`omnora-image-block observable-node ${className || ''}`}
            onClick={handleClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            data-element-id={stableElemId.current}
            data-element-type="image"
            data-image-prop-path={path}
            style={{
                ...style,
                position: isFree ? 'absolute' : 'relative',
                transform: isFree ? `translate3d(${finalX}px, ${finalY}px, 0) rotate(${finalRotation}deg) scale(${finalScale})` : undefined,
                transformOrigin: 'center center',
                zIndex: isFree ? (p_pos.z || 1) : undefined,
                width: isFree ? (node.props?.elementSizes?.[stableElemId.current]?.width || '100%') : 'inline-block',
                height: isFree ? (node.props?.elementSizes?.[stableElemId.current]?.height || 'auto') : undefined,
                cursor: mode === 'edit' ? 'pointer' : 'default',
                opacity: isHiddenOnDevice ? 0.3 : 1,
                borderRadius: p.imageRadius || '0px',
                overflow: 'hidden',
            }}
        >
            <img
                src={resolvedSrc}
                alt={alt}
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'block',
                    objectFit: p.imageFit || 'cover',
                    opacity: parseFloat(p.imageOpacity) || 1,
                    boxShadow: p.imageShadow ? '0 8px 32px rgba(0,0,0,0.35)' : undefined,
                    transition: 'transform 0.2s ease, filter 0.15s ease',
                    transform: hovered && mode === 'edit' ? 'scale(1.02)' : 'scale(1)',
                    filter: `brightness(${parseFloat(p.imageBrightness) || 1}) contrast(${parseFloat(p.imageContrast) || 1})`,
                    pointerEvents: 'none',
                }}
            />
            {mode === 'edit' && (
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(0,0,0,0)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 8,
                    transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
                    ...(hovered ? { background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' } : {}),
                }}>
                    {hovered && (
                        <div style={{ animation: 'overPop 0.3s cubic-bezier(0.16,1,0.3,1) both', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                            <style>{`@keyframes overPop { from { opacity: 0; transform: translateY(10px) scale(0.9); } to { opacity: 1; transform: translateY(0) scale(1); } }`}</style>
                            <div style={{ fontSize: 24, lineHeight: 1, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}>🖼️</div>
                            <span style={{ color: '#fff', fontSize: 11, fontWeight: 900, letterSpacing: '0.1em', textShadow: '0 2px 10px rgba(0,0,0,0.4)' }}>CHANGE MEDIA</span>
                        </div>
                    )}
                </div>
            )}
            {mode === 'edit' && isHiddenOnDevice && (
                <span style={{ position: 'absolute', top: 0, right: 0, fontSize: '8px', background: 'var(--accent-primary)', color: '#000', padding: '2px 4px', fontWeight: 900 }}>HIDDEN</span>
            )}
        </div>
    );
});

// ─── ButtonBlock ───────────────────────────────────────────────────────────
export const ButtonBlock: React.FC<{
    nodeId: string;
    textPath: string;
    onClick?: () => void;
    className?: string;
    style?: React.CSSProperties;
    elementId?: string;
}> = React.memo(({ nodeId, textPath, onClick, className, style, elementId }) => {
    const { mode, selectNode, viewport } = useOmnora();

    const node = useNodeSelector(nodeId, (n) => ({
        props: n.props,
        revision: n.revision
    }));

    const stableElemId = useRef(elementId || generateElementId(nodeId, textPath));
    const [hovered, setHovered] = useState(false);

    if (!node) return null;

    const keys = textPath.split('.');
    let text: any = node;
    for (const key of keys) { if (text == null) break; text = text[key]; }

    const p = node.props || {};
    const sizeMap: Record<string, React.CSSProperties> = {
        sm: { padding: '8px 16px', fontSize: 12 },
        md: { padding: '11px 24px', fontSize: 14 },
        lg: { padding: '14px 32px', fontSize: 15 },
        xl: { padding: '18px 40px', fontSize: 17 },
    };

    const p_pos = node.props?.elementPositions?.[stableElemId.current] || { mode: 'flow', x: 0, y: 0, z: 1 };
    const isFree = p_pos.mode === 'free';
    const isMobile = viewport === 'mobile';

    const finalX = isMobile ? (p_pos.mobileX ?? p_pos.x ?? 0) : (p_pos.x ?? 0);
    const finalY = isMobile ? (p_pos.mobileY ?? p_pos.y ?? 0) : (p_pos.y ?? 0);
    const finalScale = isMobile ? (p_pos.mobileScale ?? p_pos.scale ?? 1) : (p_pos.scale ?? 1);
    const finalRotation = isMobile ? (p_pos.mobileRotation ?? p_pos.rotation ?? 0) : (p_pos.rotation ?? 0);

    const baseStyle: React.CSSProperties = {
        ...sizeMap[p.ctaSize || 'md'],
        borderRadius: p.ctaRadius || '4px',
        fontWeight: 700,
        cursor: mode === 'edit' ? 'default' : 'pointer',
        display: isFree ? 'flex' : 'inline-flex',
        alignItems: 'center', gap: 6,
        position: isFree ? 'absolute' : 'relative',
        transformOrigin: 'center center',
        zIndex: isFree ? (p_pos.z || 1) : undefined,
        width: isFree ? (node.props?.elementSizes?.[stableElemId.current]?.width || 'auto') : (p.ctaFullWidth ? '100%' : undefined),
        height: isFree ? (node.props?.elementSizes?.[stableElemId.current]?.height || 'auto') : undefined,
        justifyContent: (p.ctaFullWidth || isFree) ? 'center' : undefined,
        transition: 'all 0.18s cubic-bezier(0.16,1,0.3,1)',
        transform: hovered ? `${isFree ? `translate3d(${finalX}px, ${finalY}px, 0) rotate(${finalRotation}deg) scale(${finalScale * 1.04})` : ''}` : (isFree ? `translate3d(${finalX}px, ${finalY}px, 0) rotate(${finalRotation}deg) scale(${finalScale})` : ''),
        background: p.ctaStyle === 'filled' ? 'var(--btn-bg, #6366F1)' : 'transparent',
        color: p.ctaStyle === 'filled' ? 'var(--btn-text, #fff)' : 'var(--btn-bg, #6366F1)',
        ...style,
    };

    const handleBtnClick = (e: React.MouseEvent) => {
        if (mode !== 'edit') { onClick?.(); return; }
        e.stopPropagation();
        selectNode?.(nodeId);
    };

    return (
        <button
            className={`omnora-button-block ${className || ''}`}
            style={baseStyle}
            onClick={handleBtnClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            data-element-id={stableElemId.current}
            data-element-type="button"
        >
            {String(text || 'Button')}
        </button>
    );
});

// ─── LogoBlock ─────────────────────────────────────────────────────────────
export const LogoBlock: React.FC<{
    nodeId: string;
    src?: string;
    storeName?: string;
    className?: string;
    style?: React.CSSProperties;
    elementId?: string;
    onReplaceClick?: () => void;
}> = React.memo(({ nodeId, src, storeName, className, style, elementId, onReplaceClick }) => {
    const { mode, selectNode, viewport } = useOmnora();
    const { resolveAssetUrl } = useMediaStore();

    const node = useNodeSelector(nodeId, (n) => ({
        props: n.props,
        revision: n.revision
    }));

    const stableElemId = useRef(elementId || generateElementId(nodeId, 'logo'));
    const [hovered, setHovered] = useState(false);

    const resolvedLogoSrc = resolveAssetUrl(src);
    const pos = node?.props?.elementPositions?.[stableElemId.current] || { mode: 'flow', x: 0, y: 0, z: 1 };
    const isFree = pos.mode === 'free';
    const isMobile = viewport === 'mobile';

    const finalX = isMobile ? (pos.mobileX ?? pos.x ?? 0) : (pos.x ?? 0);
    const finalY = isMobile ? (pos.mobileY ?? pos.y ?? 0) : (pos.y ?? 0);
    const finalScale = isMobile ? (pos.mobileScale ?? pos.scale ?? 1) : (pos.scale ?? 1);
    const finalRotation = isMobile ? (pos.mobileRotation ?? pos.rotation ?? 0) : (pos.rotation ?? 0);

    const handleClick = (e: React.MouseEvent) => {
        if (mode !== 'edit') return;
        e.stopPropagation();
        selectNode?.(nodeId);
        if (hovered && src && onReplaceClick) onReplaceClick();
    };

    return (
        <div
            className={`omnora-logo-block ${className || ''}`}
            onClick={handleClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            data-element-id={stableElemId.current}
            data-element-type="logo"
            style={{
                ...style,
                cursor: mode === 'edit' ? 'pointer' : 'default',
                position: isFree ? 'absolute' : 'relative',
                transform: isFree ? `translate3d(${finalX}px, ${finalY}px, 0) rotate(${finalRotation}deg) scale(${finalScale})` : undefined,
                transformOrigin: 'center center',
                zIndex: isFree ? (pos.z || 50) : undefined,
                width: isFree ? (node?.props?.elementSizes?.[stableElemId.current]?.width || 'auto') : undefined,
                height: isFree ? (node?.props?.elementSizes?.[stableElemId.current]?.height || 'auto') : undefined,
                display: 'inline-flex', alignItems: 'center',
            }}
        >
            {resolvedLogoSrc ? (
                <div style={{ position: 'relative' }}>
                    <img src={resolvedLogoSrc} alt={storeName || 'Logo'} style={{ maxHeight: 36, maxWidth: 160, objectFit: 'contain', display: 'block' }} />
                    {mode === 'edit' && hovered && (
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: 'rgba(0,0,0,0.45)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 9, color: '#fff', fontWeight: 800,
                            borderRadius: 4, letterSpacing: '0.05em'
                        }}>CHANGE</div>
                    )}
                </div>
            ) : (
                <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
                    {storeName || 'Store'}
                </span>
            )}
        </div>
    );
});

// ─── BadgeBlock ────────────────────────────────────────────────────────────
export const BadgeBlock: React.FC<{
    nodeId: string;
    icon?: React.ReactNode;
    text: string;
    className?: string;
    style?: React.CSSProperties;
    elementId?: string;
}> = React.memo(({ nodeId, icon, text, className, style, elementId }) => {
    const { mode, selectNode, viewport } = useOmnora();

    const node = useNodeSelector(nodeId, (n) => ({
        props: n.props,
        revision: n.revision
    }));

    const stableElemId = useRef(elementId || generateElementId(nodeId, 'badge'));
    const pos = node?.props?.elementPositions?.[stableElemId.current] || { mode: 'flow', x: 0, y: 0, z: 1 };
    const isFree = pos.mode === 'free';
    const isMobile = viewport === 'mobile';

    const finalX = isMobile ? (pos.mobileX ?? pos.x ?? 0) : (pos.x ?? 0);
    const finalY = isMobile ? (pos.mobileY ?? pos.y ?? 0) : (pos.y ?? 0);
    const finalScale = isMobile ? (pos.mobileScale ?? pos.scale ?? 1) : (pos.scale ?? 1);
    const finalRotation = isMobile ? (pos.mobileRotation ?? pos.rotation ?? 0) : (pos.rotation ?? 0);

    return (
        <div
            className={`omnora-badge-block ${className || ''}`}
            onClick={e => { if (mode === 'edit') { e.stopPropagation(); selectNode?.(nodeId); } }}
            data-element-id={stableElemId.current}
            data-element-type="badge"
            style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                cursor: mode === 'edit' ? 'pointer' : 'default',
                position: isFree ? 'absolute' : 'relative',
                transform: isFree ? `translate3d(${finalX}px, ${finalY}px, 0) rotate(${finalRotation}deg) scale(${finalScale})` : undefined,
                transformOrigin: 'center center',
                zIndex: isFree ? (pos.z || 1) : undefined,
                width: isFree ? (node?.props?.elementSizes?.[stableElemId.current]?.width || 'auto') : undefined,
                height: isFree ? (node?.props?.elementSizes?.[stableElemId.current]?.height || 'auto') : undefined,
                ...style,
            }}
        >
            {icon && <span className="badge-icon">{icon}</span>}
            <span className="badge-text">{text}</span>
        </div>
    );
});

// Aliases
export const EditableText = TextBlock;
export const EditableContainer = ContainerBlock;
export const EditableImage = ImageBlock;
export const EditableButton = ButtonBlock;
export const EditableLogo = LogoBlock;
export const EditableBadge = BadgeBlock;
