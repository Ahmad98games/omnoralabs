import React, { useRef, useCallback, useState, useMemo, useEffect } from 'react';
import { dispatcher } from '../../platform/core/Dispatcher';

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
    style?: React.CSSProperties & Record<string, any>;
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

    // Phase 12: Scroll & Preview Animations
    animations?: AnimationConfig;
    animationPreviewKey?: number;
    isBuilderMode?: boolean;
}

// ─── Internal drag state (all mutable, lives outside React render cycle) ─────/----By AHMAD
interface DragState {
    pointerId: number;
    startX: number; startY: number;
    initLeft: number; initTop: number;
    liveX: number; liveY: number;
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

/** Parse a CSS pixel value string safely; returns 0 for non-px values (calc, %, etc.). */
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

    // ── Animation State (Phase 12) ───────────────────────────────────────────
    const [animVisible, setAnimVisible] = useState(false);
    const hasAnimation = animations && animations.type && animations.type !== 'none';

    // LIVE MODE: IntersectionObserver triggers animation on scroll
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

    // BUILDER MODE: Watch animationPreviewKey — when it changes, reset & replay
    useEffect(() => {
        if (!hasAnimation || !isBuilderMode || !animationPreviewKey) return;
        // Reset to initial state, then after a tick, set to visible to replay
        setAnimVisible(false);
        const timer = setTimeout(() => setAnimVisible(true), 50);
        return () => clearTimeout(timer);
    }, [animationPreviewKey, hasAnimation, isBuilderMode]);

    // ── Drag state ────────────────────────────────────────────────────────────
    // FIX: single ref holds all mutable drag data. React state is only used to
    // schedule re-renders, not as the source of truth for coordinates.
    const dragRef = useRef<DragState | null>(null);

    // FIX: synchronous ref — set before the first re-render so handleDragStart
    // can read the current value without waiting for the next paint.
    const isFreeDraggingRef = useRef(false);

    // Minimal state: x/y are read from dragRef in render; this just triggers repaints.
    const [freeDragTick, setFreeDragTick] = useState(0);
    const forceRepaint = useCallback(() => setFreeDragTick(n => n + 1), []);

    const isDetached = style?.position === 'absolute';

    // FIX: extract only the scalar values we need from style so useCallback deps
    // are stable primitives, not the style object reference.
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

        // Lock the pointer to this element — events arrive even if mouse leaves.
        el.setPointerCapture(e.pointerId);

        const rect = el.getBoundingClientRect();
        const parentRect = el.parentElement?.getBoundingClientRect() ?? { left: 0, top: 0 };
        const initLeft = isDetached ? parsePx(styleLeft) : (rect.left - parentRect.left);
        const initTop = isDetached ? parsePx(styleTop) : (rect.top - parentRect.top);

        dragRef.current = {
            pointerId: e.pointerId,
            startX: e.clientX, startY: e.clientY,
            initLeft, initTop,
            liveX: initLeft, liveY: initTop,
        };

        // FIX: set the ref synchronously so handleDragStart sees it immediately.
        isFreeDraggingRef.current = true;
        forceRepaint();
    }, [isDraggable, isDetached, styleLeft, styleTop, forceRepaint]);

    const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        const d = dragRef.current;
        if (!d || d.pointerId !== e.pointerId) return;
        e.stopPropagation();

        let newX = d.initLeft + (e.clientX - d.startX);
        let newY = d.initTop + (e.clientY - d.startY);

        if (e.shiftKey) {
            // Grid snap: round to nearest 10px.
            newX = Math.round(newX / 10) * 10;
            newY = Math.round(newY / 10) * 10;
        }

        // Write directly into the ref — no intermediate state update per frame.
        d.liveX = newX;
        d.liveY = newY;
        forceRepaint();
    }, [forceRepaint]);

    const commitAndCleanup = useCallback((pointerId: number) => {
        const d = dragRef.current;
        if (!d || d.pointerId !== pointerId) return;

        const el = ref.current;
        if (el) {
            try { el.releasePointerCapture(pointerId); } catch { /* already released */ }
        }

        // Commit the final position to the store.
        dispatcher.dispatch([
            { nodeId, path: 'styles.position', value: 'absolute', type: 'structural', source: 'editor' },
            { nodeId, path: 'styles.left', value: `${d.liveX}px`, type: 'visual', source: 'editor' },
            { nodeId, path: 'styles.top', value: `${d.liveY}px`, type: 'visual', source: 'editor' },
            { nodeId, path: 'styles.zIndex', value: String(styleZIndex ?? 10), type: 'visual', source: 'editor' },
        ]);

        dragRef.current = null;
        isFreeDraggingRef.current = false;
        forceRepaint();
    }, [nodeId, styleZIndex, forceRepaint]);

    const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        if (!isFreeDraggingRef.current) return;
        e.stopPropagation();
        commitAndCleanup(e.pointerId);
    }, [commitAndCleanup]);

    // FIX: cancel must unconditionally clean up — don't gate on isFreeDragging state.
    const handlePointerCancel = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        commitAndCleanup(e.pointerId);
    }, [commitAndCleanup]);

    // ── HTML5 drag (flow-layout structural reordering) ─────────────────────────
    const handleDragStart = useCallback((e: React.DragEvent) => {
        // FIX: read from ref (synchronous) not state (async) — was the race condition.
        if (isFreeDraggingRef.current || isDetached) {
            e.preventDefault();
            return;
        }
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
        if (isFreeDraggingRef.current) return;
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        if (!ref.current) return;
        onDragOver?.(e, nodeId, resolveDropPosition(e, ref.current, acceptsChildren));
    }, [nodeId, acceptsChildren, onDragOver]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        if (!ref.current?.contains(e.relatedTarget as Node)) onDragLeave?.(e, nodeId);
    }, [nodeId, onDragLeave]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        if (isFreeDraggingRef.current) return;
        e.preventDefault();
        e.stopPropagation();
        if (!ref.current) return;
        onDrop?.(e, nodeId, resolveDropPosition(e, ref.current, acceptsChildren));
    }, [nodeId, acceptsChildren, onDrop]);

    // ── Derived render values ─────────────────────────────────────────────────
    const d = dragRef.current;
    const isCurrentlyDragging = isFreeDraggingRef.current;

    const dropStyle: React.CSSProperties = useMemo(() => {
        if (!isDropTarget || !dropPosition || isCurrentlyDragging) return {};
        if (dropPosition === 'before') return { boxShadow: 'inset 0 3px 0 0 #7c6dfa' };
        if (dropPosition === 'after') return { boxShadow: 'inset 0 -3px 0 0 #7c6dfa' };
        return { outline: '2px solid #7c6dfa', outlineOffset: '-2px', backgroundColor: 'rgba(124,109,250,0.04)' };
        // freeDragTick included so this memo re-runs when drag state changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDropTarget, dropPosition, isCurrentlyDragging, freeDragTick]);

    // ── Compute animation CSS ─────────────────────────────────────────────
    const animStyle: React.CSSProperties = useMemo(() => {
        if (!hasAnimation || !animations) return {};
        const dur = animations.duration ?? 600;
        const del = animations.delay ?? 0;
        const initial = ANIMATION_INITIAL_STYLES[animations.type] || {};
        const final_ = ANIMATION_FINAL_STYLES[animations.type] || {};
        const active = animVisible ? final_ : initial;
        return {
            ...active,
            transition: `opacity ${dur}ms ease ${del}ms, transform ${dur}ms ease ${del}ms, filter ${dur}ms ease ${del}ms`,
        };
    }, [hasAnimation, animations, animVisible]);

    const dynamicStyle: React.CSSProperties = {
        ...style,
        ...dropStyle,
        ...animStyle,
        position: isCurrentlyDragging || isDetached ? 'absolute' : (style?.position ?? 'relative'),
        left: isCurrentlyDragging && d ? `${d.liveX}px` : style?.left,
        top: isCurrentlyDragging && d ? `${d.liveY}px` : style?.top,
        margin: isCurrentlyDragging || isDetached ? '0' : style?.margin,
        opacity: isHidden ? 0.3 : isCurrentlyDragging ? 0.8 : (animStyle.opacity ?? (style?.opacity as number | undefined)),
        cursor: isCurrentlyDragging ? 'grabbing' : isDetached ? 'grab' : 'inherit',
        zIndex: isCurrentlyDragging ? 99999 : style?.zIndex,
        // FIX: disable transitions during drag for zero-latency feel.
        transition: isCurrentlyDragging ? 'none' : (hasAnimation ? animStyle.transition : 'opacity 0.15s'),
        // FIX: required for pointer capture to function on touch devices.
        touchAction: isDraggable ? 'none' : undefined,
        userSelect: isCurrentlyDragging ? 'none' : undefined,
    };

    return (
        <div
            ref={ref}
            data-node-id={nodeId}
            data-node-type={type}
            className={className}
            // FIX: HTML5 drag is disabled when already free-dragging or detached.
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