import React, { useRef, useCallback, useState, useMemo, useEffect } from 'react';
import { dispatcher } from '../../platform/core/Dispatcher';
import { useGlobalThemeStore } from '../../stores/useGlobalThemeStore';
import { generateScopedTheme, loadGoogleFont } from '../../utils/ThemeVariableGenerator';

// ─── Animation Presets (Phase 12) ─────────────────────────────────────────────

interface AnimationConfig {
    type: 'fadeIn' | 'slideUp' | 'zoomIn' | 'blurReveal' | 'none';
    duration: number;
    delay: number;
    once: boolean;
}

const ANIMATION_INITIAL_STYLES: Record<string, React.CSSProperties> = {
    fadeIn: { opacity: 0 },
    slideUp: { opacity: 0, transform: 'translateY(40px)' },
    zoomIn: { opacity: 0, transform: 'scale(0.85)' },
    blurReveal: { opacity: 0, filter: 'blur(12px)' },
};

const ANIMATION_FINAL_STYLES: Record<string, React.CSSProperties> = {
    fadeIn: { opacity: 1 },
    slideUp: { opacity: 1, transform: 'translateY(0)' },
    zoomIn: { opacity: 1, transform: 'scale(1)' },
    blurReveal: { opacity: 1, filter: 'blur(0px)' },
};

export type DropPosition = 'before' | 'after' | 'inside';

export interface ComponentWrapperProps {
    nodeId: string;
    type: string;
    isHidden?: boolean;
    style?: React.CSSProperties & Record<string, unknown>;
    className?: string;
    children?: React.ReactNode;

    onClick?: (e: React.MouseEvent) => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;

    isDraggable?: boolean;
    acceptsChildren?: boolean;
    isDropTarget?: boolean;
    dropPosition?: DropPosition | null;
    onDragStart?: (e: React.DragEvent, nodeId: string) => void;
    onDragEnd?: (e: React.DragEvent, nodeId: string) => void;
    onDragOver?: (e: React.DragEvent, nodeId: string, position: DropPosition) => void;
    onDragLeave?: (e: React.DragEvent, nodeId: string) => void;
    onDrop?: (e: React.DragEvent, nodeId: string, position: DropPosition) => void;

    animations?: AnimationConfig;
    animationPreviewKey?: number;
    isBuilderMode?: boolean;
}

interface DragState {
    pointerId: number;
    startX: number; startY: number;
    initLeft: number; initTop: number;
}

const resolveDropPosition = (
    e: React.DragEvent,
    el: HTMLElement,
    acceptsChildren: boolean,
): DropPosition => {
    const { top, height } = el.getBoundingClientRect();
    const y = e.clientY - top;
    if (acceptsChildren) {
        if (y < height * 0.33) return 'before';
        if (y > height * 0.66) return 'after';
        return 'inside';
    }
    return y < height / 2 ? 'before' : 'after';
};

function parsePx(value: unknown): number {
    if (typeof value === 'number') return value;
    if (typeof value !== 'string') return 0;
    const n = parseFloat(value);
    return isFinite(n) ? n : 0;
}

export const ComponentWrapper: React.FC<ComponentWrapperProps> = ({
    nodeId, type, isHidden, style, className, children,
    onClick, onMouseEnter, onMouseLeave,
    isDraggable = false, acceptsChildren = false,
    isDropTarget = false, dropPosition = null,
    onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop,
    animations, animationPreviewKey, isBuilderMode = false,
}) => {
    const ref = useRef<HTMLDivElement>(null);
    const globalTheme = useGlobalThemeStore();

    useEffect(() => {
        if (globalTheme.typography.bodyFont) {
            loadGoogleFont(globalTheme.typography.bodyFont);
        }
    }, [globalTheme.typography.bodyFont]);

    const [animVisible, setAnimVisible] = useState(false);
    const hasAnimation = animations && animations.type && animations.type !== 'none';

    useEffect(() => {
        if (!hasAnimation || isBuilderMode) return;
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setAnimVisible(true);
                    if (animations?.once !== false) obs.disconnect();
                }
            },
            { threshold: 0.15 }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [hasAnimation, isBuilderMode, animations?.once]);

   useEffect(() => {
        if (!hasAnimation || !isBuilderMode || !animationPreviewKey) return;
        
        // FIX: Moved setState out of the synchronous effect body to prevent cascading renders
        const resetTimer = setTimeout(() => {
            setAnimVisible(false);
            setTimeout(() => setAnimVisible(true), 50);
        }, 0);
        
        return () => clearTimeout(resetTimer);
    }, [animationPreviewKey, hasAnimation, isBuilderMode]);

    // FIX: Removed render-phase ref access and replaced with pure React State for drag UI
    const dragRef = useRef<DragState | null>(null);
    const [activeDrag, setActiveDrag] = useState<{ isDragging: boolean; liveX: number; liveY: number } | null>(null);

    const isDetached = style?.position === 'absolute';
    const styleLeft = style?.left;
    const styleTop = style?.top;
    const styleZIndex = style?.zIndex;

    const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDraggable) return;
        const isModifierHeld = e.metaKey || e.ctrlKey;
        if (!isModifierHeld && !isDetached) return;
        e.stopPropagation();
        const el = ref.current;
        if (!el) return;
        el.setPointerCapture(e.pointerId);

        const rect = el.getBoundingClientRect();
        const parentRect = el.parentElement?.getBoundingClientRect() ?? { left: 0, top: 0 };
        const initLeft = isDetached ? parsePx(styleLeft) : (rect.left - parentRect.left);
        const initTop = isDetached ? parsePx(styleTop) : (rect.top - parentRect.top);

        dragRef.current = {
            pointerId: e.pointerId, startY: e.clientY, startX: e.clientX,
            initLeft, initTop,
        };
        setActiveDrag({ isDragging: true, liveX: initLeft, liveY: initTop });
    }, [isDraggable, isDetached, styleLeft, styleTop]);

    const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        const d = dragRef.current;
        if (!d || d.pointerId !== e.pointerId) return;
        e.stopPropagation();
        let newX = d.initLeft + (e.clientX - d.startX);
        let newY = d.initTop + (e.clientY - d.startY);
        if (e.shiftKey) { newX = Math.round(newX / 10) * 10; newY = Math.round(newY / 10) * 10; }
        
        setActiveDrag({ isDragging: true, liveX: newX, liveY: newY });
    }, []);
const commitAndCleanup = useCallback((pointerId: number) => {
        const d = dragRef.current;
        if (!d || d.pointerId !== pointerId) return;
        const el = ref.current;
        
        // FIX: Removed the '(_err)' completely using Optional Catch Binding.
        // The comment inside satisfies the 'no-empty' rule.
        if (el) { 
            try { 
                el.releasePointerCapture(pointerId); 
            } catch { 
                /* safely ignore if capture is already lost */ 
            } 
        }

        setActiveDrag(prev => {
            if (prev) {
                dispatcher.dispatch([
                    { nodeId, path: 'styles.position', value: 'absolute', type: 'structural', source: 'editor' },
                    { nodeId, path: 'styles.left', value: `${prev.liveX}px`, type: 'visual', source: 'editor' },
                    { nodeId, path: 'styles.top', value: `${prev.liveY}px`, type: 'visual', source: 'editor' },
                    { nodeId, path: 'styles.zIndex', value: String(styleZIndex ?? 10), type: 'visual', source: 'editor' },
                ]);
            }
            return null;
        });
        dragRef.current = null;
    }, [nodeId, styleZIndex]);

    const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        if (!dragRef.current) return; 
        e.stopPropagation(); 
        commitAndCleanup(e.pointerId);
    }, [commitAndCleanup]);

    const handlePointerCancel = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        commitAndCleanup(e.pointerId);
    }, [commitAndCleanup]);

    const handleDragStart = useCallback((e: React.DragEvent) => {
        if (dragRef.current || isDetached) { e.preventDefault(); return; }
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/omnora-node-id', nodeId);
        requestAnimationFrame(() => ref.current?.setAttribute('data-dragging', 'true'));
        onDragStart?.(e, nodeId);
    }, [nodeId, onDragStart, isDetached]);

    const handleDragEnd = useCallback((e: React.DragEvent) => {
        ref.current?.removeAttribute('data-dragging'); 
        onDragEnd?.(e, nodeId);
    }, [nodeId, onDragEnd]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        if (dragRef.current) return;
        e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'move';
        if (!ref.current) return;
        onDragOver?.(e, nodeId, resolveDropPosition(e, ref.current, acceptsChildren));
    }, [nodeId, acceptsChildren, onDragOver]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        if (!ref.current?.contains(e.relatedTarget as Node)) onDragLeave?.(e, nodeId);
    }, [nodeId, onDragLeave]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        if (dragRef.current) return; e.preventDefault(); e.stopPropagation();
        if (!ref.current) return; onDrop?.(e, nodeId, resolveDropPosition(e, ref.current, acceptsChildren));
    }, [nodeId, acceptsChildren, onDrop]);

    const isCurrentlyDragging = activeDrag?.isDragging ?? false;

    const dropStyle: React.CSSProperties = useMemo(() => {
        if (!isDropTarget || !dropPosition || isCurrentlyDragging) return {};
        if (dropPosition === 'before') return { boxShadow: 'inset 0 3px 0 0 #7c6dfa' };
        if (dropPosition === 'after') return { boxShadow: 'inset 0 -3px 0 0 #7c6dfa' };
        return { outline: '2px solid #7c6dfa', outlineOffset: '-2px', backgroundColor: 'rgba(124,109,250,0.04)' };
    }, [isDropTarget, dropPosition, isCurrentlyDragging]);

    const animStyle: React.CSSProperties = useMemo(() => {
        if (!hasAnimation || !animations) return {};
        const dur = animations.duration ?? 600;
        const del = animations.delay ?? 0;
        return {
            ...(animVisible ? ANIMATION_FINAL_STYLES[animations.type] : ANIMATION_INITIAL_STYLES[animations.type]),
            transition: `opacity ${dur}ms ease ${del}ms, transform ${dur}ms ease ${del}ms, filter ${dur}ms ease ${del}ms`,
        };
    }, [hasAnimation, animations, animVisible]);

    const scopedVars = generateScopedTheme({
        primaryColor: globalTheme.colors.primary,
        backgroundColor: globalTheme.colors.background,
        textColor: globalTheme.colors.text,
        fontFamily: globalTheme.typography.bodyFont,
    });

    const cleanSlateStyle: React.CSSProperties = {
        all: 'unset',
        boxSizing: 'border-box',
        display: 'block',
    };

    const dynamicStyle: React.CSSProperties = {
        ...cleanSlateStyle,
        ...style,
        ...dropStyle,
        ...animStyle,
        ...(scopedVars as React.CSSProperties),
        position: isCurrentlyDragging || isDetached ? 'absolute' : (style?.position ?? 'relative'),
        left: isCurrentlyDragging && activeDrag ? `${activeDrag.liveX}px` : style?.left,
        top: isCurrentlyDragging && activeDrag ? `${activeDrag.liveY}px` : style?.top,
        margin: isCurrentlyDragging || isDetached ? '0' : style?.margin,
        opacity: isHidden ? 0.3 : isCurrentlyDragging ? 0.8 : (animStyle.opacity ?? (style?.opacity as number | undefined)),
        cursor: isCurrentlyDragging ? 'grabbing' : isDetached ? 'grab' : 'inherit',
        zIndex: isCurrentlyDragging ? 99999 : style?.zIndex,
        transition: isCurrentlyDragging ? 'none' : (hasAnimation ? animStyle.transition : 'opacity 0.15s'),
        touchAction: isDraggable ? 'none' : undefined,
        userSelect: isCurrentlyDragging ? 'none' : undefined,
        color: `var(--omnora-text)`,
        fontFamily: `var(--omnora-font)`,
    };

    return (
        <div
            ref={ref}
            data-node-id={nodeId}
            data-node-type={type}
            data-omnora-component="true"
            className={className}
            draggable={isDraggable && !isDetached && !isCurrentlyDragging}
            style={dynamicStyle}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onDragStart={isDraggable ? handleDragStart : undefined}
            onDragEnd={isDraggable ? handleDragEnd : undefined}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {children}
        </div>
    );
};
ComponentWrapper.displayName = 'ComponentWrapper';