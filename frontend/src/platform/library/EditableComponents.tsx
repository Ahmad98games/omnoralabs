/**
 * 🛠️ OMNORA PLATFORM | [EDITABLE COMPONENTS]
 * ---------------------------------------------------------
 * OSTT Refactor: Strict Hooks, Memoized IDs, Prop Validation, and Type Safety.
 * ---------------------------------------------------------
 */

import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useOmnora } from '../client/OmnoraContext';
import { useMediaStore } from '../client/AssetContext';

// ─── Helper ───────────────────────────────────────────────────────────────────
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

// ─── EditableText ─────────────────────────────────────────────────────────────
// ─── EditableText ─────────────────────────────────────────────────────────────
interface EditableTextProps {
    nodeId: string;
    path: string;
    className?: string;
    style?: React.CSSProperties;
    tag?: keyof React.JSX.IntrinsicElements | string;
    elementId?: string;
}

export const EditableText = React.memo((props: EditableTextProps) => {
    const { nodeId, path, className, style, tag: Tag = 'div', elementId } = props;
    const {
        nodes, updateNode, commitHistory,
        viewport, mode, selectNode,
        setIsTyping, setEditingInfo, editingInfo,
        diagnostics, setDiagnostics
    } = useOmnora();

    const node = nodes[nodeId];
    const elementRef = useRef<HTMLDivElement>(null);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);
    const lastSyncedValue = useRef<string>('');
    
    // FIX: Added a ref for the diagnostic display to bypass render-phase updates
    const renderCount = useRef(0);
    const countDisplayRef = useRef<HTMLDivElement>(null);

    const stableElemId = useMemo(() => elementId || generateElementId(nodeId, path), [elementId, nodeId, path]);

    const isCurrentlyEditing = editingInfo?.nodeId === nodeId && 
                               editingInfo?.path === path && 
                               editingInfo?.elementId === stableElemId;

    const [isHovered, setIsHovered] = useState(false);
    const [isActiveState, setIsActiveState] = useState(false);

    // FIX: Shifted ALL ref reads/writes to the commit phase (useEffect)
    useEffect(() => {
        renderCount.current += 1;
        
        if (diagnostics.showPanel) {
            console.debug(`[PRO-DEBUG] Render: ${nodeId} (${stableElemId}) | Count: ${renderCount.current}`);
            
            // Direct DOM update for diagnostic badge (no re-render triggered)
            if (countDisplayRef.current) {
                countDisplayRef.current.innerText = `R:${renderCount.current}`;
            }
            
            // Direct DOM update for background visualizer
            if (renderCount.current > 1 && elementRef.current) {
                elementRef.current.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
            }
        } else {
            // Clean up background if diagnostics panel is turned off
            if (elementRef.current) {
                elementRef.current.style.backgroundColor = '';
            }
        }
    }); // No dependency array -> Runs after EVERY render

    const displayValue = useMemo(() => {
        if (!node) return '';
        const resolveBinding = (bindingPath: string) => {
            const dataStore: Record<string, unknown> = {
                product: { price: '$1,250', name: 'Signature v1', stock: '2 left' },
                cart: { count: '3', total: '$3,750' },
                user: { name: 'Ahmad' },
            };
            const parts = bindingPath.split('.');
            let val: unknown = dataStore;
            for (const part of parts) {
                if (val && typeof val === 'object') {
                    val = (val as Record<string, unknown>)[part];
                } else {
                    val = undefined;
                }
            }
            return val || `{{${bindingPath}}}`;
        };

        const keys = path.split('.');
        let manifestVal: unknown = node;
        for (const key of keys) {
            if (manifestVal && typeof manifestVal === 'object') {
                manifestVal = (manifestVal as Record<string, unknown>)[key];
            } else {
                manifestVal = undefined;
            }
        }
        return String(node.binding ? resolveBinding(node.binding) : (manifestVal || ''));
    }, [node, path]);

    useEffect(() => {
        if (elementRef.current && !isCurrentlyEditing) {
            if (elementRef.current.innerText !== displayValue) {
                elementRef.current.innerText = displayValue;
                lastSyncedValue.current = displayValue;
            }
        }
    }, [displayValue, isCurrentlyEditing]);

    if (!node) return null;

    const isHiddenOnDevice = node.hidden?.[viewport];
    if (isHiddenOnDevice && mode === 'preview') return null;

    const isHoveredForced = node.forcedState === 'hover';
    const isActiveForced = node.forcedState === 'active';

    const p = node.props?.elementPositions?.[stableElemId] || { mode: 'flow', x: 0, y: 0, z: 1 };
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
            width: node.props?.elementSizes?.[stableElemId]?.width || 'auto',
            height: node.props?.elementSizes?.[stableElemId]?.height || 'auto',
        } : {}),
    };

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        if (node.binding) return;
        const newText = e.currentTarget.innerText;
        setIsTyping?.(true);
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => updateNode?.(nodeId, path, newText), 800);
    };

    const handleBlur = (e: React.FocusEvent) => {
        setIsTyping?.(false);
        setEditingInfo?.(null);
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        const finalVal = elementRef.current?.innerText || '';
        updateNode?.(nodeId, path, finalVal);
        commitHistory?.();

        if (diagnostics.showPanel && e.relatedTarget === null) {
            setDiagnostics?.({ focusLosses: diagnostics.focusLosses + 1 });
        }
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
        if (mode === 'preview' || node.binding) return;
        e.stopPropagation();
        selectNode?.(nodeId);
        setEditingInfo?.({ nodeId, path, elementId: stableElemId });

        if (elementRef.current) elementRef.current.innerText = displayValue;

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
        if (mode === 'preview' || isCurrentlyEditing) return;
        e.stopPropagation();
        selectNode?.(nodeId);
    };

    const Component = Tag as React.ElementType;

    return (
        <React.Fragment>
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
                className={`omnora-editable-text ${className || ''} ${isCurrentlyEditing ? 'is-editing' : ''}`}
                data-element-id={stableElemId}
                data-element-type="text"
                style={{
                    ...finalStyle,
                    outline: isCurrentlyEditing ? '2px solid rgba(99,102,241,0.5)' : (diagnostics.showPanel ? '1px dashed rgba(239, 68, 68, 0.3)' : 'none'),
                    outlineOffset: '2px',
                    cursor: mode === 'preview' ? 'default' : (isCurrentlyEditing ? 'text' : (node.binding ? 'not-allowed' : 'pointer')),
                    opacity: isHiddenOnDevice ? 0.3 : 1,
                    // FIX: Removed renderCount from here
                }}
                suppressContentEditableWarning
            />
            {diagnostics.showPanel && (
                <div 
                    ref={countDisplayRef} // FIX: Attached ref here instead of inline {renderCount.current}
                    style={{ position: 'absolute', top: -14, right: 0, fontSize: 8, color: '#ef4444', fontWeight: 900, background: '#fee2e2', padding: '0 4px', borderRadius: 2, pointerEvents: 'none' }}
                />
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
        </React.Fragment>
    );
});

EditableText.displayName = 'EditableText';
EditableText.propTypes = {
    nodeId: PropTypes.string.isRequired,
    path: PropTypes.string.isRequired,
    className: PropTypes.string,
    style: PropTypes.object,
    tag: PropTypes.string,
    elementId: PropTypes.string
};

// ─── EditableContainer ────────────────────────────────────────────────────────
interface EditableContainerProps {
    nodeId: string;
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    elementId?: string;
}

export const EditableContainer = React.memo((props: EditableContainerProps) => {
    const { nodeId, children, className, style, elementId } = props;
    const { selectNode, selectedNodeId, isBuilderActive, viewport, nodes, mode } = useOmnora();
    
    const stableElemId = useMemo(() => elementId || generateElementId(nodeId, 'container'), [elementId, nodeId]);

    const handleClick = useCallback((e: React.MouseEvent) => {
        if (!isBuilderActive || mode === 'preview') return;
        e.stopPropagation();
        selectNode?.(nodeId);
    }, [nodeId, selectNode, isBuilderActive, mode]);

    const node = nodes[nodeId];
    if (!node) return null;

    const isHiddenOnDevice = node.hidden?.[viewport];
    if (isHiddenOnDevice && mode === 'preview') return null;

    const isSelected = selectedNodeId === nodeId;
    const p = node.props?.elementPositions?.[stableElemId] || { mode: 'flow', x: 0, y: 0, z: 1 };
    const isFree = p.mode === 'free';
    const isMobile = viewport === 'mobile';

    const finalX = isMobile ? (p.mobileX ?? p.x ?? 0) : (p.x ?? 0);
    const finalY = isMobile ? (p.mobileY ?? p.y ?? 0) : (p.y ?? 0);
    const finalScale = isMobile ? (p.mobileScale ?? p.scale ?? 1) : (p.scale ?? 1);
    const finalRotation = isMobile ? (p.mobileRotation ?? p.rotation ?? 0) : (p.rotation ?? 0);

    return (
        <div
            className={`editable-container-node observable-node ${className || ''} ${isSelected ? 'is-selected' : ''}`}
            style={{
                ...style,
                position: isFree ? 'absolute' : 'relative',
                transform: isFree ? `translate3d(${finalX}px, ${finalY}px, 0) rotate(${finalRotation}deg) scale(${finalScale})` : undefined,
                transformOrigin: 'center center',
                zIndex: isFree ? (p.z || 1) : undefined,
                width: isFree ? (node.props?.elementSizes?.[stableElemId]?.width || 'auto') : undefined,
                height: isFree ? (node.props?.elementSizes?.[stableElemId]?.height || 'auto') : undefined,
                cursor: isBuilderActive ? 'pointer' : 'default',
                opacity: isHiddenOnDevice ? 0.3 : 1,
                display: isHiddenOnDevice && mode === 'preview' ? 'none' : undefined,
            }}
            onClick={handleClick}
            data-node-id={nodeId}
            data-element-id={stableElemId}
            data-element-type="container"
        >
            {children}
            {mode === 'edit' && isHiddenOnDevice && (
                <span style={{ position: 'absolute', top: 0, right: 0, fontSize: '8px', background: 'var(--accent-primary)', color: '#000', padding: '2px 4px', fontWeight: 900 }}>HIDDEN</span>
            )}
        </div>
    );
});

EditableContainer.displayName = 'EditableContainer';
EditableContainer.propTypes = {
    nodeId: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    style: PropTypes.object,
    elementId: PropTypes.string
};

// ─── EditableImage ────────────────────────────────────────────────────────────
interface EditableImageProps {
    nodeId: string;
    path: string;
    className?: string;
    style?: React.CSSProperties;
    alt?: string;
    elementId?: string;
    onReplaceClick?: () => void;
}

export const EditableImage = React.memo((props: EditableImageProps) => {
    const { nodeId, path, className, style, alt = '', elementId, onReplaceClick } = props;
    const { nodes, isBuilderActive, viewport, mode } = useOmnora();
    const { resolveAssetUrl } = useMediaStore();
    const [hovered, setHovered] = useState(false);
    
    const stableElemId = useMemo(() => elementId || generateElementId(nodeId, path), [elementId, nodeId, path]);

    const handleClick = useCallback((e: React.MouseEvent) => {
        if (!isBuilderActive || mode === 'preview') return;
        e.stopPropagation();
        if (onReplaceClick) onReplaceClick();
    }, [isBuilderActive, mode, onReplaceClick]);

    const node = nodes[nodeId];
    if (!node) return null;

    const isHiddenOnDevice = node.hidden?.[viewport];
    if (isHiddenOnDevice && mode === 'preview') return null;

    const keys = path.split('.');
    let srcId: unknown = node;
    for (const key of keys) {
        if (srcId && typeof srcId === 'object') {
            srcId = (srcId as Record<string, unknown>)[key];
        } else {
            srcId = null;
            break;
        }
    }

    const resolvedSrc = resolveAssetUrl(srcId as string | undefined);

    const imageFit = (node.props?.imageFit as React.CSSProperties['objectFit']) || 'cover';
    const imageRadius = node.props?.imageRadius || '0px';
    const imageShadow = node.props?.imageShadow;
    const imageOpacity = parseFloat(node.props?.imageOpacity as string) || 1;
    const imageBrightness = parseFloat(node.props?.imageBrightness as string) || 1;
    const imageContrast = parseFloat(node.props?.imageContrast as string) || 1;

    const p = node.props?.elementPositions?.[stableElemId] || { mode: 'flow', x: 0, y: 0, z: 1 };
    const isFree = p.mode === 'free';
    const isMobile = viewport === 'mobile';

    const finalX = isMobile ? (p.mobileX ?? p.x ?? 0) : (p.x ?? 0);
    const finalY = isMobile ? (p.mobileY ?? p.y ?? 0) : (p.y ?? 0);
    const finalScale = isMobile ? (p.mobileScale ?? p.scale ?? 1) : (p.scale ?? 1);
    const finalRotation = isMobile ? (p.mobileRotation ?? p.rotation ?? 0) : (p.rotation ?? 0);

    return (
        <div
            className={`editable-image-node observable-node ${className || ''}`}
            onClick={handleClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            data-element-id={stableElemId}
            data-element-type="image"
            data-image-prop-path={path}
            style={{
                ...style,
                position: isFree ? 'absolute' : 'relative',
                transform: isFree ? `translate3d(${finalX}px, ${finalY}px, 0) rotate(${finalRotation}deg) scale(${finalScale})` : undefined,
                transformOrigin: 'center center',
                zIndex: isFree ? (p.z || 1) : undefined,
                width: isFree ? (node.props?.elementSizes?.[stableElemId]?.width || '100%') : 'inline-block',
                height: isFree ? (node.props?.elementSizes?.[stableElemId]?.height || 'auto') : undefined,
                cursor: mode === 'preview' ? 'default' : 'pointer',
                opacity: isHiddenOnDevice ? 0.3 : 1,
                borderRadius: imageRadius as string,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            <img
                src={resolvedSrc}
                alt={alt}
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'block',
                    objectFit: imageFit,
                    opacity: imageOpacity,
                    boxShadow: imageShadow ? '0 8px 32px rgba(0,0,0,0.35)' : undefined,
                    transition: 'transform 0.2s ease, filter 0.15s ease',
                    transform: hovered && mode !== 'preview' ? 'scale(1.02)' : 'scale(1)',
                    filter: `brightness(${imageBrightness}) contrast(${imageContrast})`,
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

EditableImage.displayName = 'EditableImage';
EditableImage.propTypes = {
    nodeId: PropTypes.string.isRequired,
    path: PropTypes.string.isRequired,
    className: PropTypes.string,
    style: PropTypes.object,
    alt: PropTypes.string,
    elementId: PropTypes.string,
    onReplaceClick: PropTypes.func
};

// ─── EditableButton ───────────────────────────────────────────────────────────
interface EditableButtonProps {
    nodeId: string;
    textPath: string;
    onClick?: () => void;
    className?: string;
    style?: React.CSSProperties;
    elementId?: string;
}

export const EditableButton = React.memo((props: EditableButtonProps) => {
    const { nodeId, textPath, onClick, className, style, elementId } = props;
    const { nodes, mode, selectNode, viewport } = useOmnora();
    const [hovered, setHovered] = useState(false);
    
    const stableElemId = useMemo(() => elementId || generateElementId(nodeId, textPath), [elementId, nodeId, textPath]);

    const node = nodes[nodeId];
    if (!node) return null;

    const keys = textPath.split('.');
    let text: unknown = node;
    for (const key of keys) {
        if (text && typeof text === 'object') {
            text = (text as Record<string, unknown>)[key];
        } else {
            text = null;
            break;
        }
    }

    const p = node.props || {};
    const size = (p.ctaSize as string) || 'md';
    const btnStyle = (p.ctaStyle as string) || 'filled';
    const radius = (p.ctaRadius as string) || '4px';
    const fullWidth = !!p.ctaFullWidth;
    const hoverAnim = (p.ctaHoverAnim as string) || 'none';

    const sizeMap: Record<string, React.CSSProperties> = {
        sm: { padding: '8px 16px', fontSize: 12 },
        md: { padding: '11px 24px', fontSize: 14 },
        lg: { padding: '14px 32px', fontSize: 15 },
        xl: { padding: '18px 40px', fontSize: 17 },
    };

    const hoverTransform: Record<string, string> = {
        lift: 'translateY(-2px)',
        scale: 'scale(1.04)',
        glow: 'scale(1.01)',
        none: '',
    };

    const p_pos = node.props?.elementPositions?.[stableElemId] || { mode: 'flow', x: 0, y: 0, z: 1 };
    const isFree = p_pos.mode === 'free';
    const isMobile = viewport === 'mobile';

    const finalX = isMobile ? (p_pos.mobileX ?? p_pos.x ?? 0) : (p_pos.x ?? 0);
    const finalY = isMobile ? (p_pos.mobileY ?? p_pos.y ?? 0) : (p_pos.y ?? 0);
    const finalScale = isMobile ? (p_pos.mobileScale ?? p_pos.scale ?? 1) : (p_pos.scale ?? 1);
    const finalRotation = isMobile ? (p_pos.mobileRotation ?? p_pos.rotation ?? 0) : (p_pos.rotation ?? 0);

    const baseStyle: React.CSSProperties = {
        ...sizeMap[size],
        borderRadius: radius,
        fontWeight: 700,
        cursor: mode === 'preview' ? 'pointer' : 'default',
        display: isFree ? 'flex' : 'inline-flex',
        alignItems: 'center', gap: 6,
        position: isFree ? 'absolute' : 'relative',
        transformOrigin: 'center center',
        zIndex: isFree ? (p_pos.z || 1) : undefined,
        width: isFree ? (node.props?.elementSizes?.[stableElemId]?.width || 'auto') : (fullWidth ? '100%' : undefined),
        height: isFree ? (node.props?.elementSizes?.[stableElemId]?.height || 'auto') : undefined,
        justifyContent: (fullWidth || isFree) ? 'center' : undefined,
        transition: 'all 0.18s cubic-bezier(0.16,1,0.3,1)',
        transform: hovered ? `${isFree ? `translate3d(${finalX}px, ${finalY}px, 0) rotate(${finalRotation}deg) scale(${finalScale * 1.04})` : hoverTransform[hoverAnim] || ''}` : (isFree ? `translate3d(${finalX}px, ${finalY}px, 0) rotate(${finalRotation}deg) scale(${finalScale})` : ''),
        boxShadow: hovered && hoverAnim === 'glow' ? '0 0 20px rgba(99,102,241,0.5)' : undefined,
        border: btnStyle === 'outline' ? '2px solid var(--btn-bg, #6366F1)' : btnStyle === 'ghost' ? 'none' : 'none',
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
            className={`omnora-cta-btn ${className || ''}`}
            style={baseStyle}
            onClick={handleClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            data-element-id={stableElemId}
            data-element-type="button"
        >
            {String(text || 'Button')}
        </button>
    );
});

EditableButton.displayName = 'EditableButton';
EditableButton.propTypes = {
    nodeId: PropTypes.string.isRequired,
    textPath: PropTypes.string.isRequired,
    onClick: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object,
    elementId: PropTypes.string
};

// ─── EditableLogo ─────────────────────────────────────────────────────────────
interface EditableLogoProps {
    nodeId: string;
    src?: string;
    storeName?: string;
    className?: string;
    style?: React.CSSProperties;
    elementId?: string;
    onReplaceClick?: () => void;
}

export const EditableLogo = React.memo((props: EditableLogoProps) => {
    const { nodeId, src, storeName, className, style, elementId, onReplaceClick } = props;
    const { mode, selectNode, nodes, viewport } = useOmnora();
    const { resolveAssetUrl } = useMediaStore();
    const [hovered, setHovered] = useState(false);
    
    const stableElemId = useMemo(() => elementId || generateElementId(nodeId, 'logo'), [elementId, nodeId]);

    const node = nodes[nodeId];
    const resolvedLogoSrc = resolveAssetUrl(src);

    const handleClick = (e: React.MouseEvent) => {
        if (mode === 'preview') return;
        e.stopPropagation();
        selectNode?.(nodeId);
        if (hovered && src && onReplaceClick) onReplaceClick();
    };

    if (!node) return null;

    const p = node?.props || {};
    const pos = p.elementPositions?.[stableElemId] || { mode: 'flow', x: 0, y: 0, z: 1 };
    const isFree = pos.mode === 'free';
    const posX = pos.x || 0;
    const posY = pos.y || 0;

    const isMobile = viewport === 'mobile';
    const finalX = isMobile ? (pos.mobileX ?? posX ?? 0) : (posX ?? 0);
    const finalY = isMobile ? (pos.mobileY ?? posY ?? 0) : (posY ?? 0);
    const finalScale = isMobile ? (pos.mobileScale ?? pos.scale ?? 1) : (pos.scale ?? 1);
    const finalRotation = isMobile ? (pos.mobileRotation ?? pos.rotation ?? 0) : (pos.rotation ?? 0);

    return (
        <div
            className={`omnora-logo-wrap ${className || ''}`}
            onClick={handleClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            data-element-id={stableElemId}
            data-element-type="logo"
            style={{
                ...style,
                cursor: mode === 'preview' ? 'default' : 'pointer',
                position: isFree ? 'absolute' : 'relative',
                transform: isFree ? `translate3d(${finalX}px, ${finalY}px, 0) rotate(${finalRotation}deg) scale(${finalScale})` : undefined,
                transformOrigin: 'center center',
                zIndex: isFree ? (pos.z || 50) : undefined,
                width: isFree ? (node.props?.elementSizes?.[stableElemId]?.width || 'auto') : undefined,
                height: isFree ? (node.props?.elementSizes?.[stableElemId]?.height || 'auto') : undefined,
                display: 'inline-flex', alignItems: 'center',
                userSelect: 'none',
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

EditableLogo.displayName = 'EditableLogo';
EditableLogo.propTypes = {
    nodeId: PropTypes.string.isRequired,
    src: PropTypes.string,
    storeName: PropTypes.string,
    className: PropTypes.string,
    style: PropTypes.object,
    elementId: PropTypes.string,
    onReplaceClick: PropTypes.func
};

// ─── EditableBadge ────────────────────────────────────────────────────────────
interface EditableBadgeProps {
    nodeId: string;
    icon?: React.ReactNode;
    text: string;
    className?: string;
    style?: React.CSSProperties;
    elementId?: string;
}

export const EditableBadge = React.memo((props: EditableBadgeProps) => {
    const { nodeId, icon, text, className, style, elementId } = props;
    const { mode, selectNode, nodes, viewport } = useOmnora();
    
    const stableElemId = useMemo(() => elementId || generateElementId(nodeId, 'badge'), [elementId, nodeId]);

    const node = nodes[nodeId];
    if (!node) return null;

    const pos = node?.props?.elementPositions?.[stableElemId] || { mode: 'flow', x: 0, y: 0, z: 1 };
    const isFree = pos.mode === 'free';
    const isMobile = viewport === 'mobile';

    const finalX = isMobile ? (pos.mobileX ?? pos.x ?? 0) : (pos.x ?? 0);
    const finalY = isMobile ? (pos.mobileY ?? pos.y ?? 0) : (pos.y ?? 0);
    const finalScale = isMobile ? (pos.mobileScale ?? pos.scale ?? 1) : (pos.scale ?? 1);
    const finalRotation = isMobile ? (pos.mobileRotation ?? pos.rotation ?? 0) : (pos.rotation ?? 0);

    return (
        <div
            className={`omnora-badge ${className || ''}`}
            onClick={e => { if (mode !== 'preview') { e.stopPropagation(); selectNode?.(nodeId); } }}
            data-element-id={stableElemId}
            data-element-type="badge"
            style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                cursor: mode === 'preview' ? 'default' : 'pointer',
                position: isFree ? 'absolute' : 'relative',
                transform: isFree ? `translate3d(${finalX}px, ${finalY}px, 0) rotate(${finalRotation}deg) scale(${finalScale})` : undefined,
                transformOrigin: 'center center',
                zIndex: isFree ? (pos.z || 1) : undefined,
                width: isFree ? (node?.props?.elementSizes?.[stableElemId]?.width || 'auto') : undefined,
                height: isFree ? (node?.props?.elementSizes?.[stableElemId]?.height || 'auto') : undefined,
                ...style,
            }}
        >
            {icon && <span className="badge-icon">{icon}</span>}
            <span className="badge-text">{text}</span>
        </div>
    );
});

EditableBadge.displayName = 'EditableBadge';
EditableBadge.propTypes = {
    nodeId: PropTypes.string.isRequired,
    icon: PropTypes.node,
    text: PropTypes.string.isRequired,
    className: PropTypes.string,
    style: PropTypes.object,
    elementId: PropTypes.string
};