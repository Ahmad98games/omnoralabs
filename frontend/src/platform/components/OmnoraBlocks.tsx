/* eslint-disable react/prop-types */
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useOmnora } from '../client/OmnoraContext';
import { useMediaStore } from '../client/AssetContext';
import { useNodeSelector } from '../../hooks/useNodeSelector';
import { dispatcher } from '../core/Dispatcher';

// ─── Deterministic Identity ───────────────────────────────────────────────────

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

// ─── Helper Types ─────────────────────────────────────────────────────────────

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

// ─── TextBlock ────────────────────────────────────────────────────────────────

export interface TextBlockProps {
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
        viewport, mode, selectNode,
        setIsTyping, setEditingInfo, editingInfo,
    } = useOmnora();

    const node = useNodeSelector(nodeId, (n) => ({
        props: n.props,
        styles: n.styles,
        interactions: n.interactions,
        binding: n.binding,
        hidden: n.hidden,
        forcedState: n.forcedState,
        motion: n.motion,
        revision: n.revision,
    }));

    // ── All hooks unconditional before any early return ───────────────────────
    const elementRef      = useRef<HTMLDivElement>(null);
    const debounceTimer   = useRef<NodeJS.Timeout | null>(null);
    const generatedId     = elementId || generateElementId(nodeId, path);
    const stableElemId    = useRef(generatedId);
    const lastSyncedValue = useRef<string>('');

    const [isHovered,     setIsHovered]     = useState(false);
    const [isActiveState, setIsActiveState] = useState(false);

    const isCurrentlyEditing = (
        editingInfo?.nodeId    === nodeId &&
        editingInfo?.path      === path &&
        editingInfo?.elementId === generatedId
    );

    // Compute display value safely before guard
    const resolveBinding = (bindingPath: string): string => {
        const dataStore: Record<string, unknown> = {
            product: { price: '$1,250', name: 'Signature v1', stock: '2 left' },
            cart:    { count: '3', total: '$3,750' },
            user:    { name: 'Ahmad' },
        };
        const parts = bindingPath.split('.');
        let val: unknown = dataStore;
        for (const part of parts) val = (val as Record<string, unknown>)?.[part];
        return (val as string) || `{{${bindingPath}}}`;
    };

    const keys = path.split('.');
    let manifestVal: unknown = node ?? {};
    for (const key of keys) manifestVal = (manifestVal as Record<string, unknown>)?.[key];
    const displayValue = String(
        node?.binding ? resolveBinding(node.binding) : (manifestVal || '')
    );

    // ── useEffect must be before any early return ─────────────────────────────
    useEffect(() => {
        if (!elementRef.current || isCurrentlyEditing) return;
        if (elementRef.current.innerText !== displayValue) {
            elementRef.current.innerText = displayValue;
            lastSyncedValue.current = displayValue;
        }
    }, [displayValue, isCurrentlyEditing]);

    // ── Early return AFTER all hooks ──────────────────────────────────────────
    if (!node) return null;

    const isHiddenOnDevice = node.hidden?.[viewport];
    if (isHiddenOnDevice && mode !== 'edit') return null;

    const isHoveredForced = node.forcedState === 'hover';
    const isActiveForced  = node.forcedState === 'active';

    const p        = (node.props?.elementPositions as Record<string, ElementPosition>)?.[generatedId] || { mode: 'flow', x: 0, y: 0, z: 1 };
    const isFree   = p.mode === 'free';
    const isMobile = viewport === 'mobile';

    const finalX        = isMobile ? (p.mobileX        ?? p.x        ?? 0) : (p.x        ?? 0);
    const finalY        = isMobile ? (p.mobileY        ?? p.y        ?? 0) : (p.y        ?? 0);
    const finalScale    = isMobile ? (p.mobileScale    ?? p.scale    ?? 1) : (p.scale    ?? 1);
    const finalRotation = isMobile ? (p.mobileRotation ?? p.rotation ?? 0) : (p.rotation ?? 0);
    const sizes         = (node.props?.elementSizes as Record<string, ElementSize>)?.[generatedId] || {};

    const finalStyle: React.CSSProperties = {
        transition: isCurrentlyEditing ? 'none' : `all ${node.motion?.duration || 200}ms ${node.motion?.curve || 'ease'}`,
        ...style,
        ...node.styles,
        ...((isHovered || isHoveredForced) ? node.interactions?.hover  : {}),
        ...((isActiveState || isActiveForced)  ? node.interactions?.active : {}),
        ...(isFree ? {
            position: 'absolute',
            transform: `translate3d(${finalX}px, ${finalY}px, 0) rotate(${finalRotation}deg) scale(${finalScale})`,
            transformOrigin: 'center center',
            zIndex: p.z || 1,
            width:  sizes.width  || 'auto',
            height: sizes.height || 'auto',
        } : {}),
    };

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        if (node.binding || mode !== 'edit') return;
        const newText = e.currentTarget.innerText;
        setIsTyping?.(true);
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            dispatcher.dispatch({ nodeId, path, value: newText, type: 'visual', source: 'editor' });
        }, 800);
    };

    const handleBlur = () => {
        if (mode !== 'edit') return;
        setIsTyping?.(false);
        setEditingInfo?.(null);
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        const finalVal = elementRef.current?.innerText || '';
        dispatcher.dispatch({ nodeId, path, value: finalVal, type: 'visual', source: 'editor' });
        commitHistory?.();
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
        if (mode !== 'edit' || node.binding) return;
        e.stopPropagation();
        selectNode?.(nodeId);
        setEditingInfo?.({ nodeId, path, elementId: stableElemId.current });
        if (elementRef.current) elementRef.current.innerText = displayValue;
        requestAnimationFrame(() => {
            if (!elementRef.current) return;
            elementRef.current.focus();
            const sel   = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(elementRef.current);
            range.collapse(false);
            sel?.removeAllRanges();
            sel?.addRange(range);
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
                data-element-id={generatedId}
                data-element-type="text"
                style={{
                    ...finalStyle,
                    outline:       isCurrentlyEditing ? '2px solid rgba(99,102,241,0.5)' : 'none',
                    outlineOffset: '2px',
                    cursor: mode !== 'edit'
                        ? 'default'
                        : isCurrentlyEditing
                            ? 'text'
                            : node.binding
                                ? 'not-allowed'
                                : 'pointer',
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
TextBlock.displayName = 'TextBlock';

// ─── ContainerBlock ───────────────────────────────────────────────────────────

export interface ContainerBlockProps {
    nodeId: string;
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    elementId?: string;
}

export const ContainerBlock: React.FC<ContainerBlockProps> = React.memo(({
    nodeId, children, className, style, elementId,
}) => {
    const { selectNode, selectedNodeId, isBuilderActive, viewport, mode } = useOmnora();

    const node = useNodeSelector(nodeId, (n) => ({
        props: n.props,
        hidden: n.hidden,
        revision: n.revision,
    }));

    const generatedId = elementId || generateElementId(nodeId, 'container');

    const handleClick = useCallback((e: React.MouseEvent) => {
        if (!isBuilderActive || mode !== 'edit') return;
        e.stopPropagation();
        selectNode?.(nodeId);
    }, [nodeId, selectNode, isBuilderActive, mode]);

    if (!node) return null;

    const isHiddenOnDevice = node.hidden?.[viewport];
    if (isHiddenOnDevice && mode !== 'edit') return null;

    const isSelected = selectedNodeId === nodeId;
    const p          = (node.props?.elementPositions as Record<string, ElementPosition>)?.[generatedId] || { mode: 'flow', x: 0, y: 0, z: 1 };
    const isFree     = p.mode === 'free';
    const isMobile   = viewport === 'mobile';

    const finalX        = isMobile ? (p.mobileX        ?? p.x        ?? 0) : (p.x        ?? 0);
    const finalY        = isMobile ? (p.mobileY        ?? p.y        ?? 0) : (p.y        ?? 0);
    const finalScale    = isMobile ? (p.mobileScale    ?? p.scale    ?? 1) : (p.scale    ?? 1);
    const finalRotation = isMobile ? (p.mobileRotation ?? p.rotation ?? 0) : (p.rotation ?? 0);
    const sizes         = (node.props?.elementSizes as Record<string, ElementSize>)?.[generatedId] || {};

    return (
        <div
            className={`omnora-container-block observable-node ${className || ''} ${isSelected ? 'is-selected' : ''}`}
            style={{
                ...style,
                position:        isFree ? 'absolute' : 'relative',
                transform:       isFree ? `translate3d(${finalX}px, ${finalY}px, 0) rotate(${finalRotation}deg) scale(${finalScale})` : undefined,
                transformOrigin: 'center center',
                zIndex:          isFree ? (p.z || 1) : undefined,
                width:           isFree ? (sizes.width  || 'auto') : undefined,
                height:          isFree ? (sizes.height || 'auto') : undefined,
                cursor:          mode === 'edit' && isBuilderActive ? 'pointer' : 'default',
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
                    fontSize: '8px', background: 'var(--accent-primary)',
                    color: '#000', padding: '2px 4px', fontWeight: 900,
                }}>HIDDEN</span>
            )}
        </div>
    );
});
ContainerBlock.displayName = 'ContainerBlock';

// ─── ImageBlock ───────────────────────────────────────────────────────────────

export interface ImageBlockProps {
    nodeId: string;
    path: string;
    className?: string;
    style?: React.CSSProperties;
    alt?: string;
    elementId?: string;
    onReplaceClick?: () => void;
}

export const ImageBlock: React.FC<ImageBlockProps> = React.memo(({
    nodeId, path, className, style, alt = '', elementId, onReplaceClick,
}) => {
    const { isBuilderActive, viewport, mode, selectNode } = useOmnora();
    const { resolveAssetUrl } = useMediaStore();

    const node = useNodeSelector(nodeId, (n) => ({
        props: n.props,
        hidden: n.hidden,
        revision: n.revision,
    }));

    const generatedId = elementId || generateElementId(nodeId, path);
    const [hovered, setHovered] = useState(false);

    const handleClick = useCallback((e: React.MouseEvent) => {
        if (!isBuilderActive || mode !== 'edit') return;
        e.stopPropagation();
        selectNode?.(nodeId);
        if (onReplaceClick) onReplaceClick();
    }, [isBuilderActive, mode, nodeId, onReplaceClick, selectNode]);

    if (!node) return null;

    const isHiddenOnDevice = node.hidden?.[viewport];
    if (isHiddenOnDevice && mode !== 'edit') return null;

    const keys = path.split('.');
    let srcId: unknown = node;
    for (const key of keys) {
        if (srcId == null) break;
        srcId = (srcId as Record<string, unknown>)[key];
    }

    const resolvedSrc = resolveAssetUrl(srcId as string);
    const p           = node.props || {};

    const p_pos     = (p.elementPositions as Record<string, ElementPosition>)?.[generatedId] || { mode: 'flow', x: 0, y: 0, z: 1 };
    const isFree    = p_pos.mode === 'free';
    const isMobile  = viewport === 'mobile';

    const finalX        = isMobile ? (p_pos.mobileX        ?? p_pos.x        ?? 0) : (p_pos.x        ?? 0);
    const finalY        = isMobile ? (p_pos.mobileY        ?? p_pos.y        ?? 0) : (p_pos.y        ?? 0);
    const finalScale    = isMobile ? (p_pos.mobileScale    ?? p_pos.scale    ?? 1) : (p_pos.scale    ?? 1);
    const finalRotation = isMobile ? (p_pos.mobileRotation ?? p_pos.rotation ?? 0) : (p_pos.rotation ?? 0);
    const sizes         = (p.elementSizes as Record<string, ElementSize>)?.[generatedId] || {};

    return (
        <div
            className={`omnora-image-block observable-node ${className || ''}`}
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
                zIndex:          isFree ? (p_pos.z || 1) : undefined,
                width:           isFree ? (sizes.width  || '100%') : 'inline-block',
                height:          isFree ? (sizes.height || 'auto') : undefined,
                cursor:          mode === 'edit' ? 'pointer' : 'default',
                opacity:         isHiddenOnDevice ? 0.3 : 1,
                borderRadius:    (p.imageRadius as string) || '0px',
                overflow:        'hidden',
            }}
        >
            <img
                src={resolvedSrc}
                alt={alt}
                style={{
                    width: '100%', height: '100%', display: 'block',
                    objectFit:     (p.imageFit as React.CSSProperties['objectFit']) || 'cover',
                    opacity:       parseFloat(p.imageOpacity    as string) || 1,
                    boxShadow:     p.imageShadow ? '0 8px 32px rgba(0,0,0,0.35)' : undefined,
                    transition:    'transform 0.2s ease, filter 0.15s ease',
                    transform:     hovered && mode === 'edit' ? 'scale(1.02)' : 'scale(1)',
                    filter:        `brightness(${parseFloat(p.imageBrightness as string) || 1}) contrast(${parseFloat(p.imageContrast as string) || 1})`,
                    pointerEvents: 'none',
                }}
            />
            {mode === 'edit' && (
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(0,0,0,0)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
                    ...(hovered ? { background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' } : {}),
                }}>
                    {hovered && (
                        <div style={{
                            animation: 'overPop 0.3s cubic-bezier(0.16,1,0.3,1) both',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                        }}>
                            <div style={{ fontSize: 24, lineHeight: 1, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}>🖼️</div>
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
                    fontSize: '8px', background: 'var(--accent-primary)',
                    color: '#000', padding: '2px 4px', fontWeight: 900,
                }}>HIDDEN</span>
            )}
        </div>
    );
});
ImageBlock.displayName = 'ImageBlock';

// ─── ButtonBlock ──────────────────────────────────────────────────────────────

export interface ButtonBlockProps {
    nodeId: string;
    textPath: string;
    onClick?: () => void;
    className?: string;
    style?: React.CSSProperties;
    elementId?: string;
}

export const ButtonBlock: React.FC<ButtonBlockProps> = React.memo(({
    nodeId, textPath, onClick, className, style, elementId,
}) => {
    const { mode, selectNode, viewport } = useOmnora();

    const node = useNodeSelector(nodeId, (n) => ({
        props: n.props,
        revision: n.revision,
    }));

    const generatedId = elementId || generateElementId(nodeId, textPath);
    const [hovered, setHovered] = useState(false);

    const handleBtnClick = useCallback((e: React.MouseEvent) => {
        if (mode !== 'edit') { onClick?.(); return; }
        e.stopPropagation();
        selectNode?.(nodeId);
    }, [mode, onClick, selectNode, nodeId]);

    if (!node) return null;

    const keys = textPath.split('.');
    let text: unknown = node;
    for (const key of keys) {
        if (text == null) break;
        text = (text as Record<string, unknown>)[key];
    }

    const p = node.props || {};
    const sizeMap: Record<string, React.CSSProperties> = {
        sm: { padding: '8px 16px',  fontSize: 12 },
        md: { padding: '11px 24px', fontSize: 14 },
        lg: { padding: '14px 32px', fontSize: 15 },
        xl: { padding: '18px 40px', fontSize: 17 },
    };

    const p_pos     = (p.elementPositions as Record<string, ElementPosition>)?.[generatedId] || { mode: 'flow', x: 0, y: 0, z: 1 };
    const isFree    = p_pos.mode === 'free';
    const isMobile  = viewport === 'mobile';

    const finalX        = isMobile ? (p_pos.mobileX        ?? p_pos.x        ?? 0) : (p_pos.x        ?? 0);
    const finalY        = isMobile ? (p_pos.mobileY        ?? p_pos.y        ?? 0) : (p_pos.y        ?? 0);
    const finalScale    = isMobile ? (p_pos.mobileScale    ?? p_pos.scale    ?? 1) : (p_pos.scale    ?? 1);
    const finalRotation = isMobile ? (p_pos.mobileRotation ?? p_pos.rotation ?? 0) : (p_pos.rotation ?? 0);
    const sizes         = (p.elementSizes as Record<string, ElementSize>)?.[generatedId] || {};

    const baseStyle: React.CSSProperties = {
        ...sizeMap[(p.ctaSize as string) || 'md'],
        borderRadius:   (p.ctaRadius as string) || '4px',
        fontWeight:     700,
        cursor:         mode === 'edit' ? 'default' : 'pointer',
        display:        isFree ? 'flex' : 'inline-flex',
        alignItems:     'center',
        gap:            6,
        position:       isFree ? 'absolute' : 'relative',
        transformOrigin: 'center center',
        zIndex:         isFree ? (p_pos.z || 1) : undefined,
        width:          isFree ? (sizes.width  || 'auto') : (p.ctaFullWidth ? '100%' : undefined),
        height:         isFree ? (sizes.height || 'auto') : undefined,
        justifyContent: (p.ctaFullWidth || isFree) ? 'center' : undefined,
        transition:     'all 0.18s cubic-bezier(0.16,1,0.3,1)',
        transform:      hovered
            ? (isFree ? `translate3d(${finalX}px, ${finalY}px, 0) rotate(${finalRotation}deg) scale(${finalScale * 1.04})` : '')
            : (isFree ? `translate3d(${finalX}px, ${finalY}px, 0) rotate(${finalRotation}deg) scale(${finalScale})` : ''),
        background:     p.ctaStyle === 'filled' ? 'var(--btn-bg, #6366F1)' : 'transparent',
        color:          p.ctaStyle === 'filled' ? 'var(--btn-text, #fff)' : 'var(--btn-bg, #6366F1)',
        ...style,
    };

    return (
        <button
            className={`omnora-button-block ${className || ''}`}
            style={baseStyle}
            onClick={handleBtnClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            data-element-id={generatedId}
            data-element-type="button"
        >
            {String(text || 'Button')}
        </button>
    );
});
ButtonBlock.displayName = 'ButtonBlock';

// ─── LogoBlock ────────────────────────────────────────────────────────────────

export interface LogoBlockProps {
    nodeId: string;
    src?: string;
    storeName?: string;
    className?: string;
    style?: React.CSSProperties;
    elementId?: string;
    onReplaceClick?: () => void;
}

export const LogoBlock: React.FC<LogoBlockProps> = React.memo(({
    nodeId, src, storeName, className, style, elementId, onReplaceClick,
}) => {
    const { mode, selectNode, viewport } = useOmnora();
    const { resolveAssetUrl } = useMediaStore();

    const node = useNodeSelector(nodeId, (n) => ({
        props: n.props,
        revision: n.revision,
    }));

    const generatedId     = elementId || generateElementId(nodeId, 'logo');
    const [hovered, setHovered] = useState(false);

    const handleClick = useCallback((e: React.MouseEvent) => {
        if (mode !== 'edit') return;
        e.stopPropagation();
        selectNode?.(nodeId);
        if (hovered && src && onReplaceClick) onReplaceClick();
    }, [mode, selectNode, nodeId, hovered, src, onReplaceClick]);

    const resolvedLogoSrc = resolveAssetUrl(src as string);

    if (!node) return null;

    const p   = node.props || {};
    const pos = (p.elementPositions as Record<string, ElementPosition>)?.[generatedId] || { mode: 'flow', x: 0, y: 0, z: 1 };
    const isFree   = pos.mode === 'free';
    const isMobile = viewport === 'mobile';

    const finalX        = isMobile ? (pos.mobileX        ?? pos.x        ?? 0) : (pos.x        ?? 0);
    const finalY        = isMobile ? (pos.mobileY        ?? pos.y        ?? 0) : (pos.y        ?? 0);
    const finalScale    = isMobile ? (pos.mobileScale    ?? pos.scale    ?? 1) : (pos.scale    ?? 1);
    const finalRotation = isMobile ? (pos.mobileRotation ?? pos.rotation ?? 0) : (pos.rotation ?? 0);
    const sizes         = (p.elementSizes as Record<string, ElementSize>)?.[generatedId] || {};

    return (
        <div
            className={`omnora-logo-block ${className || ''}`}
            onClick={handleClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            data-element-id={generatedId}
            data-element-type="logo"
            style={{
                ...style,
                cursor:          mode === 'edit' ? 'pointer' : 'default',
                position:        isFree ? 'absolute' : 'relative',
                transform:       isFree ? `translate3d(${finalX}px, ${finalY}px, 0) rotate(${finalRotation}deg) scale(${finalScale})` : undefined,
                transformOrigin: 'center center',
                zIndex:          isFree ? (pos.z || 50) : undefined,
                width:           isFree ? (sizes.width  || 'auto') : undefined,
                height:          isFree ? (sizes.height || 'auto') : undefined,
                display:         'inline-flex',
                alignItems:      'center',
            }}
        >
            {resolvedLogoSrc ? (
                <div style={{ position: 'relative' }}>
                    <img
                        src={resolvedLogoSrc}
                        alt={storeName || 'Logo'}
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
                    {storeName || 'Store'}
                </span>
            )}
        </div>
    );
});
LogoBlock.displayName = 'LogoBlock';

// ─── BadgeBlock ───────────────────────────────────────────────────────────────

export interface BadgeBlockProps {
    nodeId: string;
    icon?: React.ReactNode;
    text: string;
    className?: string;
    style?: React.CSSProperties;
    elementId?: string;
}

export const BadgeBlock: React.FC<BadgeBlockProps> = React.memo(({
    nodeId, icon, text, className, style, elementId,
}) => {
    const { mode, selectNode, viewport } = useOmnora();

    const node = useNodeSelector(nodeId, (n) => ({
        props: n.props,
        revision: n.revision,
    }));

    const generatedId = elementId || generateElementId(nodeId, 'badge');

    if (!node) return null;

    const p   = node.props || {};
    const pos = (p.elementPositions as Record<string, ElementPosition>)?.[generatedId] || { mode: 'flow', x: 0, y: 0, z: 1 };
    const isFree   = pos.mode === 'free';
    const isMobile = viewport === 'mobile';

    const finalX        = isMobile ? (pos.mobileX        ?? pos.x        ?? 0) : (pos.x        ?? 0);
    const finalY        = isMobile ? (pos.mobileY        ?? pos.y        ?? 0) : (pos.y        ?? 0);
    const finalScale    = isMobile ? (pos.mobileScale    ?? pos.scale    ?? 1) : (pos.scale    ?? 1);
    const finalRotation = isMobile ? (pos.mobileRotation ?? pos.rotation ?? 0) : (pos.rotation ?? 0);
    const sizes         = (p.elementSizes as Record<string, ElementSize>)?.[generatedId] || {};

    return (
        <div
            className={`omnora-badge-block ${className || ''}`}
            onClick={e => { if (mode === 'edit') { e.stopPropagation(); selectNode?.(nodeId); } }}
            data-element-id={generatedId}
            data-element-type="badge"
            style={{
                display:         'inline-flex',
                alignItems:      'center',
                gap:             8,
                cursor:          mode === 'edit' ? 'pointer' : 'default',
                position:        isFree ? 'absolute' : 'relative',
                transform:       isFree ? `translate3d(${finalX}px, ${finalY}px, 0) rotate(${finalRotation}deg) scale(${finalScale})` : undefined,
                transformOrigin: 'center center',
                zIndex:          isFree ? (pos.z || 1) : undefined,
                width:           isFree ? (sizes.width  || 'auto') : undefined,
                height:          isFree ? (sizes.height || 'auto') : undefined,
                ...style,
            }}
        >
            {icon && <span className="badge-icon">{icon}</span>}
            <span className="badge-text">{text}</span>
        </div>
    );
});
BadgeBlock.displayName = 'BadgeBlock';

// ─── Aliases (backward compatibility) ────────────────────────────────────────

export const EditableText      = TextBlock;
export const EditableContainer = ContainerBlock;
export const EditableImage     = ImageBlock;
export const EditableButton    = ButtonBlock;
export const EditableLogo      = LogoBlock;
export const EditableBadge     = BadgeBlock;