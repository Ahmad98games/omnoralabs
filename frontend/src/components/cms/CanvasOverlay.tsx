import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useBuilder } from '../../context/BuilderContext';
import {
    Trash2, Copy, ChevronUp, ChevronDown,
    GripVertical, Plus, Image as ImageIcon, Type, Link as LinkIcon, Edit, MousePointerClick, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Eye, EyeOff
} from 'lucide-react';
import {
    ElementControlProvider, useElementControl,
    MediaPickerModal, useElementResize, SmartGuide,
    useFreePositionDrag,
    type ElementSelection, type ElementType, type ResizeDir,
} from '../../platform/library/modules/ElementControlLayer';
import { ElementToolbar, ElementResizeHandles, SmartGuides, ImageControlsFloater } from '../../platform/library/modules/ElementControlLayer';
import { useBuilderInteractionStore } from '../../hooks/useBuilderInteractionStore';
import { useNodeSelector } from '../../hooks/useNodeSelector';
import { SuggestionBubble } from './help/SuggestionBubble';

// ─── Tokens ───────────────────────────────────────────────────────────────────
const ACCENT = '#6366F1';
const ACCENT_L = 'rgba(99,102,241,0.12)';
const DANGER = '#EF4444';
const DANGER_L = 'rgba(239,68,68,0.08)';
const SNAP_COLOR = 'rgba(99,102,241,0.75)';
const SPACING_COLOR = 'rgba(99,102,241,0.07)';
const SPACING_BORDER = 'rgba(99,102,241,0.22)';

// ─── Helpers ──────────────────────────────────────────────────────────────────
interface NodeRect { id: string; index: number; top: number; bottom: number; height: number; left: number; width: number; }

function getNodeRects(nodeTree: Record<string, any>): NodeRect[] {
    const host = document.querySelector('.omnora-shadow-host');
    if (!host?.shadowRoot) return [];
    return Object.values(nodeTree)
        .filter((n: any) => n.parentId === null)
        .map((n: any, i: number) => {
            const el = host.shadowRoot!.querySelector(`[data-node-id="${n.id}"]`) as HTMLElement | null;
            if (!el) return { id: n.id, index: i, top: 0, bottom: 0, height: 0, left: 0, width: 0 };
            const r = el.getBoundingClientRect();
            return { id: n.id, index: i, top: r.top, bottom: r.bottom, height: r.height, left: r.left, width: r.width };
        });
}

// Detect element type from DOM element
function detectElementType(el: HTMLElement): ElementType | null {
    const tag = el.tagName.toLowerCase();
    const cls = el.className?.toLowerCase?.() || '';
    const dataType = el.dataset?.elementType as ElementType | undefined;
    if (dataType) return dataType;
    if (tag === 'img') return 'image';
    if (tag === 'button' || el.getAttribute('role') === 'button') return 'button';
    if (tag === 'a' && (cls.includes('btn') || cls.includes('cta'))) return 'button';
    if (cls.includes('logo')) return 'logo';
    if (cls.includes('badge') || cls.includes('trust')) return 'badge';
    if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'p' || tag === 'span') return 'text';
    if (cls.includes('hero-image') || cls.includes('banner-image')) return 'image';
    return null;
}

// ─── ToolBtn ─────────────────────────────────────────────────────────────────
const ToolBtn = ({ icon, onClick, title, danger = false, muted = false }: {
    icon: React.ReactNode; onClick: () => void; title: string; danger?: boolean; muted?: boolean;
}) => {
    const [hov, setHov] = useState(false);
    return (
        <button
            title={title}
            onClick={e => { e.stopPropagation(); onClick(); }}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
                background: hov ? (danger ? DANGER_L : 'rgba(255,255,255,0.18)') : 'transparent',
                border: 'none', borderRadius: 4, padding: '3px 5px',
                color: danger && hov ? DANGER : muted ? 'rgba(255,255,255,0.4)' : '#fff',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                transition: 'all 0.12s', flexShrink: 0,
            }}
        >{icon}</button>
    );
};

// ─── Context Menu ─────────────────────────────────────────────────────────────
interface CtxMenu { x: number; y: number; nodeId: string; }

const ContextMenu = ({ menu, onClose, onAction }: {
    menu: CtxMenu; onClose: () => void; onAction: (action: string, nodeId: string) => void;
}) => {
    useEffect(() => {
        const dismiss = () => onClose();
        document.addEventListener('click', dismiss);
        return () => document.removeEventListener('click', dismiss);
    }, [onClose]);

    const items = [
        { id: 'up', label: '↑ Move Up', shortcut: '↑' },
        { id: 'down', label: '↓ Move Down', shortcut: '↓' },
        { id: 'dup', label: '⊕ Duplicate', shortcut: 'Ctrl+D' },
        { id: 'hide', label: '◌ Hide on Mobile', shortcut: '' },
        { id: 'delete', label: '⊗ Delete', shortcut: 'Del', danger: true },
    ];

    return (
        <div
            style={{
                position: 'fixed', top: menu.y, left: menu.x,
                background: '#1F2937', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 10, boxShadow: '0 16px 48px rgba(0,0,0,0.45)',
                zIndex: 20000, minWidth: 190, padding: '4px 0',
                fontFamily: "'Inter', system-ui, sans-serif",
                animation: 'ctxFadeIn 0.12s ease',
            }}
            onClick={e => e.stopPropagation()}
        >
            <style>{`@keyframes ctxFadeIn { from { opacity:0; transform:scale(0.96) translateY(-4px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
            {items.map((item, i) => (
                <React.Fragment key={item.id}>
                    {i === 4 && <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />}
                    <button
                        onMouseEnter={e => (e.currentTarget.style.background = (item as any).danger ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.08)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        onClick={() => { onAction(item.id, menu.nodeId); onClose(); }}
                        style={{
                            display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between',
                            padding: '8px 14px', background: 'transparent', border: 'none', cursor: 'pointer',
                            color: (item as any).danger ? DANGER : '#E5E7EB', fontSize: 13, fontWeight: 500,
                            textAlign: 'left', transition: 'background 0.1s',
                        }}
                    >
                        <span>{item.label}</span>
                        {item.shortcut && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginLeft: 20 }}>{item.shortcut}</span>}
                    </button>
                </React.Fragment>
            ))}
        </div>
    );
};

// ─── MiniBar ──────────────────────────────────────────────────────────────────
const MiniBar = ({
    rect, nodeId, isSelected, onDragStart,
}: { rect: DOMRect; nodeId: string; isSelected: boolean; onDragStart: (id: string, e: React.MouseEvent) => void; }) => {
    const { deleteNode, duplicateNode, updateNode, commitHistory, reorderNode } = useBuilder();
    const node = useNodeSelector(nodeId, (n: any) => n);
    if (!node) return null;
    const isHiddenMobile = !!node.hidden?.mobile;

    return (
        <div style={{
            position: 'fixed',
            top: Math.max(4, rect.top - 34),
            left: rect.left,
            display: 'flex', alignItems: 'center', gap: 2,
            background: isSelected ? ACCENT : '#1F2937',
            borderRadius: '6px 6px 6px 0',
            padding: '4px 8px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
            zIndex: 10001, pointerEvents: 'auto', userSelect: 'none',
        }}>
            <div
                onMouseDown={e => onDragStart(nodeId, e)}
                style={{ display: 'flex', alignItems: 'center', cursor: 'grab', padding: '2px 4px', opacity: 0.75 }}
                title="Drag to reorder"
            >
                <GripVertical size={12} color="#fff" />
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#fff', paddingRight: 8, borderRight: '1px solid rgba(255,255,255,0.2)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {(node.type || 'block').replace(/_/g, ' ')}
            </span>
            <ToolBtn title="Move Up" onClick={() => reorderNode(nodeId, 'up')} icon={<ChevronUp size={11} />} />
            <ToolBtn title="Move Down" onClick={() => reorderNode(nodeId, 'down')} icon={<ChevronDown size={11} />} />
            <span style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
            <ToolBtn title="Duplicate" onClick={() => duplicateNode(nodeId)} icon={<Copy size={11} />} />
            <ToolBtn
                title={isHiddenMobile ? 'Show on mobile' : 'Hide on mobile'}
                onClick={() => { updateNode(nodeId, 'hidden.mobile', !isHiddenMobile); commitHistory(); }}
                icon={isHiddenMobile ? <EyeOff size={11} /> : <Eye size={11} />}
                muted={isHiddenMobile}
            />
            <ToolBtn title="Delete" onClick={() => deleteNode(nodeId)} icon={<Trash2 size={11} />} danger />
        </div>
    );
};

// ─── Block resize handles ─────────────────────────────────────────────────────
const BLOCK_HANDLES: { dir: string; cursor: string; pos: React.CSSProperties }[] = [
    { dir: 'n', cursor: 'ns-resize', pos: { top: -5, left: '50%', transform: 'translateX(-50%)' } },
    { dir: 's', cursor: 'ns-resize', pos: { bottom: -5, left: '50%', transform: 'translateX(-50%)' } },
    { dir: 'e', cursor: 'ew-resize', pos: { top: '50%', right: -5, transform: 'translateY(-50%)' } },
    { dir: 'w', cursor: 'ew-resize', pos: { top: '50%', left: -5, transform: 'translateY(-50%)' } },
    { dir: 'ne', cursor: 'nesw-resize', pos: { top: -5, right: -5 } },
    { dir: 'nw', cursor: 'nwse-resize', pos: { top: -5, left: -5 } },
    { dir: 'se', cursor: 'nwse-resize', pos: { bottom: -5, right: -5 } },
    { dir: 'sw', cursor: 'nesw-resize', pos: { bottom: -5, left: -5 } },
];

// ─── Spacing Overlay ──────────────────────────────────────────────────────────
const SpacingOverlay = ({ rect, node }: { rect: DOMRect; node: any }) => {
    const pt = parseInt(node.styles?.paddingTop) || 0;
    const pb = parseInt(node.styles?.paddingBottom) || 0;
    const pl = parseInt(node.styles?.paddingLeft) || 0;
    const pr = parseInt(node.styles?.paddingRight) || 0;
    if (pt + pb + pl + pr === 0) return null;

    const Badge = ({ val }: { val: number }) => (
        <span style={{ fontSize: 9, color: ACCENT, fontWeight: 700, background: 'rgba(255,255,255,0.9)', padding: '1px 5px', borderRadius: 3 }}>{val}px</span>
    );

    return (
        <>
            {pt > 0 && <div style={{ position: 'fixed', top: rect.top, left: rect.left, width: rect.width, height: Math.min(pt, rect.height / 3), background: SPACING_COLOR, borderBottom: `1px dashed ${SPACING_BORDER}`, pointerEvents: 'none', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Badge val={pt} /></div>}
            {pb > 0 && <div style={{ position: 'fixed', top: rect.bottom - Math.min(pb, rect.height / 3), left: rect.left, width: rect.width, height: Math.min(pb, rect.height / 3), background: SPACING_COLOR, borderTop: `1px dashed ${SPACING_BORDER}`, pointerEvents: 'none', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Badge val={pb} /></div>}
            {pl > 0 && <div style={{ position: 'fixed', top: rect.top, left: rect.left, width: Math.min(pl, rect.width / 4), height: rect.height, background: SPACING_COLOR, borderRight: `1px dashed ${SPACING_BORDER}`, pointerEvents: 'none', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 9, color: ACCENT, fontWeight: 700, background: 'rgba(255,255,255,0.9)', padding: '1px 5px', borderRadius: 3, writingMode: 'vertical-lr' }}>{pl}</span></div>}
            {pr > 0 && <div style={{ position: 'fixed', top: rect.top, left: rect.right - Math.min(pr, rect.width / 4), width: Math.min(pr, rect.width / 4), height: rect.height, background: SPACING_COLOR, borderLeft: `1px dashed ${SPACING_BORDER}`, pointerEvents: 'none', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 9, color: ACCENT, fontWeight: 700, background: 'rgba(255,255,255,0.9)', padding: '1px 5px', borderRadius: 3, writingMode: 'vertical-lr' }}>{pr}</span></div>}
        </>
    );
};

// ─── Element Selection Layer ──────────────────────────────────────────────────
/**
 * Tracks sub-element selection (images, buttons, text) within selected blocks.
 * Runs only when a block is selected (selectedNodeId is set).
 */
const ElementSelectionLayer: React.FC<{ selectedNodeId: string }> = ({ selectedNodeId }) => {
    const { updateNode, commitHistory, viewport, isTyping } = useBuilder();
    const selectedNode = useNodeSelector(selectedNodeId, (n: any) => n);
    const {
        selectedElement, selectElement,
        hoveredElementId, setHoveredElementId,
        openMediaPicker,
    } = useElementControl();

    const { liveW, liveH, startResize, activeCursor } = useElementResize();
    const [showImageFloater, setShowImageFloater] = useState(false);
    const [smartGuides, setSmartGuides] = useState<SmartGuide[]>([]);
    const elementRectRef = useRef<DOMRect | null>(null);
    const rafRef = useRef<number>(0);

    // Track element rect in real-time
    useEffect(() => {
        if (!selectedElement) { elementRectRef.current = null; return; }
        const tick = () => {
            const host = document.querySelector('.omnora-shadow-host');
            const el = host?.shadowRoot?.querySelector(`[data-element-id="${selectedElement.elementId}"]`) as HTMLElement | null;
            if (el) {
                elementRectRef.current = el.getBoundingClientRect();
            }
            rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    }, [selectedElement?.elementId]);

    // Listen for element hover/click events in shadow DOM
    useEffect(() => {
        const host = document.querySelector('.omnora-shadow-host');
        const shadow = host?.shadowRoot;
        if (!shadow) return;

        const onOver = (e: Event) => {
            const target = (e as MouseEvent).composedPath().find((el: any) => {
                const htmlEl = el as HTMLElement;
                return htmlEl.dataset?.elementId && htmlEl.closest?.(`[data-node-id="${selectedNodeId}"]`);
            }) as HTMLElement | undefined;
            if (target) {
                setHoveredElementId(target.dataset.elementId!);
            } else {
                setHoveredElementId(null);
            }
        };

        const onClick = (e: Event) => {
            const mv = e as MouseEvent;
            const path = mv.composedPath() as HTMLElement[];

            // Check if clicked within our selected block
            const inBlock = path.some(el => (el as HTMLElement).dataset?.nodeId === selectedNodeId);
            if (!inBlock || isTyping) {
                if (!isTyping) {
                    selectElement(null);
                    setShowImageFloater(false);
                }
                return;
            }

            // Find closest element-tagged element
            const target = path.find((el: any) => {
                const htmlEl = el as HTMLElement;
                return htmlEl.dataset?.elementId && htmlEl.closest?.(`[data-node-id="${selectedNodeId}"]`);
            }) as HTMLElement | undefined;

            if (!target) {
                selectElement(null);
                setShowImageFloater(false);
                return;
            }

            e.stopPropagation();

            const elementId = target.dataset.elementId!;
            const elementType = detectElementType(target) || (target.dataset.elementType as ElementType) || 'container';
            const rect = target.getBoundingClientRect();

            selectElement({
                nodeId: selectedNodeId,
                elementId,
                elementType,
                rect,
                props: { ...target.dataset },
            });

            // Show image floater for images
            setShowImageFloater(elementType === 'image' || elementType === 'logo');

            // Compute smart guides
            const canvasRect = document.querySelector('.canvas-frame')?.getBoundingClientRect();
            if (canvasRect) {
                const guides: SmartGuide[] = [];
                const centerX = canvasRect.left + canvasRect.width / 2;
                const centerY = canvasRect.top + canvasRect.height / 2;
                if (Math.abs(rect.left + rect.width / 2 - centerX) < 20) guides.push({ type: 'v', pos: centerX, label: 'Center' });
                if (Math.abs(rect.top + rect.height / 2 - centerY) < 20) guides.push({ type: 'h', pos: centerY, label: 'Center' });
                setSmartGuides(guides);
                if (guides.length) setTimeout(() => setSmartGuides([]), 1200);
            }
        };

        shadow.addEventListener('mouseover', onOver as EventListener);
        shadow.addEventListener('click', onClick as EventListener);
        return () => {
            shadow.removeEventListener('mouseover', onOver as EventListener);
            shadow.removeEventListener('click', onClick as EventListener);
        };
    }, [selectedNodeId, selectElement, setHoveredElementId]);

    // Clear element selection when block selection changes
    useEffect(() => {
        return () => {
            selectElement(null);
            setShowImageFloater(false);
        };
    }, [selectedNodeId]);

    const node = selectedNode;

    const handleElementResize = useCallback((dir: ResizeDir, e: React.MouseEvent) => {
        if (!selectedElement || !elementRectRef.current) return;
        const propPath = selectedElement.props?.sizePath;
        startResize(dir, e, elementRectRef.current, (w, h) => {
            if (propPath) {
                updateNode(selectedElement.nodeId, `${propPath}.width`, `${w}px`);
                updateNode(selectedElement.nodeId, `${propPath}.height`, `${h}px`);
            } else {
                // Fallback: update generic element size props
                updateNode(selectedElement.nodeId, `props.elementSizes.${selectedElement.elementId}.width`, `${w}px`);
                updateNode(selectedElement.nodeId, `props.elementSizes.${selectedElement.elementId}.height`, `${h}px`);
            }
        });
    }, [selectedElement, startResize, updateNode]);

    // Drag logic for free placement
    const currentElementId = selectedElement?.elementId;
    const isMobile = viewport === 'mobile';
    const pos = (currentElementId && node?.props?.elementPositions?.[currentElementId]) || { mode: 'flow', x: 0, y: 0, z: 1 };
    const isFree = pos.mode === 'free';

    const { startDrag, livePos } = useFreePositionDrag(
        () => { }, // Live position is handled by hook state
        (p) => {
            if (!selectedElement || !currentElementId) return;
            const prefix = isMobile ? 'mobile' : '';
            const propX = prefix ? `props.elementPositions.${currentElementId}.${prefix}X` : `props.elementPositions.${currentElementId}.x`;
            const propY = prefix ? `props.elementPositions.${currentElementId}.${prefix}Y` : `props.elementPositions.${currentElementId}.y`;
            updateNode(selectedElement.nodeId, propX, p.x);
            updateNode(selectedElement.nodeId, propY, p.y);
            commitHistory();
        }
    );

    // Arrow key nudging
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!selectedElement || !isFree || isTyping) return;
            const arrows = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
            if (!arrows.includes(e.key)) return;

            e.preventDefault();
            const step = e.shiftKey ? 10 : e.altKey ? 0.5 : 1;
            let nx = (isMobile ? (pos.mobileX ?? pos.x) : pos.x) || 0;
            let ny = (isMobile ? (pos.mobileY ?? pos.y) : pos.y) || 0;

            if (e.key === 'ArrowUp') ny -= step;
            if (e.key === 'ArrowDown') ny += step;
            if (e.key === 'ArrowLeft') nx -= step;
            if (e.key === 'ArrowRight') nx += step;

            const prefix = isMobile ? 'mobile' : '';
            const propX = prefix ? `props.elementPositions.${currentElementId}.${prefix}X` : `props.elementPositions.${currentElementId}.x`;
            const propY = prefix ? `props.elementPositions.${currentElementId}.${prefix}Y` : `props.elementPositions.${currentElementId}.y`;

            updateNode(selectedElement.nodeId, propX, nx);
            updateNode(selectedElement.nodeId, propY, ny);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedElement, isFree, pos, isTyping, viewport, updateNode, isMobile, currentElementId]);

    // Image floater state
    const imagePropPath = selectedElement?.props?.imagePropPath || 'props.backgroundImage';
    const imgFit = (node?.props?.imageFit as 'cover' | 'contain') || 'cover';
    const imgRadius = parseInt(node?.props?.imageRadius) || 0;
    const imgOpacity = parseFloat(node?.props?.imageOpacity) || 1;
    const imgShadow = !!node?.props?.imageShadow;

    // Use elementRectRef for live positioning
    const [, forceUpdate] = useState(0);
    useEffect(() => {
        const id = setInterval(() => forceUpdate(v => v + 1), 50);
        return () => clearInterval(id);
    }, []);

    const elemRect = selectedElement
        ? (elementRectRef.current || selectedElement.rect)
        : null;

    return (
        <>
            {/* Smart guides */}
            <SmartGuides guides={smartGuides} />

            {/* Cursor lock during resize */}
            {activeCursor && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 20000, cursor: activeCursor }} />
            )}

            {/* Hover ring on sub-elements */}
            {hoveredElementId && !selectedElement && (() => {
                const host = document.querySelector('.omnora-shadow-host');
                const el = host?.shadowRoot?.querySelector(`[data-element-id="${hoveredElementId}"]`) as HTMLElement | null;
                if (!el) return null;
                const r = el.getBoundingClientRect();
                return (
                    <div style={{
                        position: 'fixed', top: r.top - 1, left: r.left - 1,
                        width: r.width + 2, height: r.height + 2,
                        border: '1.5px dashed rgba(6,182,212,0.6)',
                        borderRadius: 3, pointerEvents: 'none', zIndex: 10006,
                    }} />
                );
            })()}

            {/* Selected element controls */}
            {selectedElement && elemRect && (
                <>
                    {!isTyping && (
                        <ElementResizeHandles
                            rect={elemRect}
                            onResizeStart={handleElementResize}
                            liveW={liveW}
                            liveH={liveH}
                        />
                    )}

                    {/* Free Drag Handle */}
                    {isFree && !isTyping && (
                        <div
                            onMouseDown={e => {
                                const host = document.querySelector('.omnora-shadow-host');
                                const container = host?.shadowRoot?.querySelector(`[data-node-id="${selectedElement.nodeId}"]`)?.getBoundingClientRect();
                                const curX = isMobile ? (pos.mobileX ?? pos.x ?? 0) : (pos.x ?? 0);
                                const curY = isMobile ? (pos.mobileY ?? pos.y ?? 0) : (pos.y ?? 0);
                                const elemSize = { w: elemRect.width, h: elemRect.height };
                                startDrag(e, { x: curX, y: curY }, container, elemSize);
                            }}
                            style={{
                                position: 'fixed',
                                top: elemRect.top, left: elemRect.left,
                                width: elemRect.width, height: elemRect.height,
                                background: livePos ? 'rgba(99,102,241,0.05)' : 'transparent',
                                cursor: 'move',
                                zIndex: 10010, pointerEvents: 'auto',
                                border: livePos ? '1px dashed #6366F1' : 'none'
                            }}
                        />
                    )}

                    <ElementToolbar
                        rect={elemRect}
                        nodeId={selectedElement.nodeId}
                        elementId={selectedElement.elementId}
                        elementType={selectedElement.elementType}
                        label={selectedElement.elementType}
                        onReplace={() => {
                            openMediaPicker({
                                nodeId: selectedElement.nodeId,
                                propPath: imagePropPath,
                                currentUrl: node?.props?.backgroundImage || node?.props?.imageUrl,
                                onSelect: (url) => {
                                    updateNode(selectedElement.nodeId, imagePropPath, url);
                                    commitHistory();
                                },
                            });
                            setShowImageFloater(false);
                        }}
                        onEdit={() => {
                            // Trigger double-click to activate inline text editing
                            const host = document.querySelector('.omnora-shadow-host');
                            const el = host?.shadowRoot?.querySelector(`[data-element-id="${selectedElement.elementId}"]`) as HTMLElement | null;
                            el?.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, composed: true }));
                        }}
                        onFitToggle={() => {
                            updateNode(selectedElement.nodeId, 'props.imageFit', imgFit === 'cover' ? 'contain' : 'cover');
                            commitHistory();
                        }}
                    />

                    {/* Image controls floater */}
                    {showImageFloater && (selectedElement.elementType === 'image' || selectedElement.elementType === 'logo') && (
                        <ImageControlsFloater
                            rect={elemRect}
                            imageFit={imgFit}
                            radius={imgRadius}
                            opacity={imgOpacity}
                            shadow={imgShadow}
                            onFitChange={v => { updateNode(selectedElement.nodeId, 'props.imageFit', v); commitHistory(); }}
                            onRadiusChange={v => { updateNode(selectedElement.nodeId, 'props.imageRadius', `${v}px`); }}
                            onOpacityChange={v => { updateNode(selectedElement.nodeId, 'props.imageOpacity', String(v)); }}
                            onShadowChange={v => { updateNode(selectedElement.nodeId, 'props.imageShadow', v); commitHistory(); }}
                            onReplace={() => {
                                openMediaPicker({
                                    nodeId: selectedElement.nodeId,
                                    propPath: imagePropPath,
                                    currentUrl: node?.props?.backgroundImage,
                                    onSelect: (url) => {
                                        updateNode(selectedElement.nodeId, imagePropPath, url);
                                        commitHistory();
                                    },
                                });
                                setShowImageFloater(false);
                            }}
                        />
                    )}
                </>
            )}

            {/* Hint pill when block is selected but no element */}
            {!selectedElement && (
                <div style={{
                    position: 'fixed',
                    bottom: 80, left: '50%', transform: 'translateX(-50%)',
                    background: '#1F2937', color: 'rgba(255,255,255,0.6)',
                    padding: '6px 14px', borderRadius: 20,
                    fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap',
                    zIndex: 10000, pointerEvents: 'none',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                    animation: 'etPop 0.2s cubic-bezier(0.16,1,0.3,1)',
                }}>
                    <style>{`@keyframes etPop { from { opacity:0; transform: translateX(-50%) translateY(8px); } to { opacity:1; transform: translateX(-50%) translateY(0); } }`}</style>
                    Select any element within this block to begin customizing
                </div>
            )}
        </>
    );
};

// ─── Main CanvasOverlay ───────────────────────────────────────────────────────
const CanvasOverlayInner: React.FC = () => {
    const {
        selectedNodeId, selectNode,
        duplicateNode, deleteNode, reorderNode,
        moveNodeToIndex, updateNode, commitHistory,
        mode, addNode, isTyping,
        setIsTyping, setEditingInfo,
        nodeTree // Keep nodeTree for rootNodes and getNodeRects
    } = useBuilder();

    const { recordFriction } = useBuilderInteractionStore();

    const [selRect, setSelRect] = useState<DOMRect | null>(null);
    const [hovRect, setHovRect] = useState<DOMRect | null>(null);
    const [hovId, setHovId] = useState<string | null>(null);
    const tickRef = useRef<number>(0);

    const findEl = useCallback((id: string): HTMLElement | null => {
        const host = document.querySelector('.omnora-shadow-host');
        return (host?.shadowRoot?.querySelector(`[data-node-id="${id}"]`) as HTMLElement) || null;
    }, []);

    // 60fps rect sync for selected block
    useEffect(() => {
        if (mode === 'preview') { setSelRect(null); return; }
        const tick = () => {
            if (selectedNodeId) {
                const el = findEl(selectedNodeId);
                setSelRect(el ? el.getBoundingClientRect() : null);
            } else setSelRect(null);
            tickRef.current = requestAnimationFrame(tick);
        };
        tickRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(tickRef.current);
    }, [selectedNodeId, mode, findEl]);

    // Hover tracking
    useEffect(() => {
        if (mode === 'preview') return;
        const host = document.querySelector('.omnora-shadow-host');
        const shadow = host?.shadowRoot;
        if (!shadow) return;
        const onOver = (e: Event) => {
            const t = e.target as HTMLElement;
            const el = t.closest('[data-node-id]') as HTMLElement | null;
            if (!el) { setHovId(null); setHovRect(null); return; }
            const id = el.getAttribute('data-node-id')!;
            if (id === selectedNodeId || nodeTree[id]?.parentId !== null) { setHovId(null); setHovRect(null); return; }
            setHovId(id);
            setHovRect(el.getBoundingClientRect());
        };
        const onOut = () => { setHovId(null); setHovRect(null); };
        shadow.addEventListener('mouseover', onOver);
        shadow.addEventListener('mouseout', onOut);
        return () => { shadow.removeEventListener('mouseover', onOver); shadow.removeEventListener('mouseout', onOut); };
    }, [mode, selectedNodeId, nodeTree]);

    // Drag state
    const [dragId, setDragId] = useState<string | null>(null);
    const [dropIndex, setDropIndex] = useState<number | null>(null);
    const [dropLineY, setDropLineY] = useState<number | null>(null);
    const [snapH, setSnapH] = useState(false);
    const [snapV, setSnapV] = useState(false);
    const autoScrollRef = useRef<number | null>(null);
    const isDragging = useRef(false);
    const dragStartPos = useRef<{ x: number; y: number } | null>(null);
    const canvasEl = () => document.querySelector('.canvas-frame') as HTMLElement | null;

    const stopAutoScroll = () => {
        if (autoScrollRef.current) { cancelAnimationFrame(autoScrollRef.current); autoScrollRef.current = null; }
    };

    const startDrag = useCallback((id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragStartPos.current = { x: e.clientX, y: e.clientY };
        isDragging.current = false;

        const canvas = canvasEl();
        if (!canvas) return;

        // 1. Capture Logical Geometry Snapshot
        // We use absolute document coordinates to survive unmounting during scroll
        const scrollOffset = canvas.scrollTop;
        const rects = getNodeRects(nodeTree).map(r => ({
            ...r,
            absTop: r.top + scrollOffset,
            absBottom: r.bottom + scrollOffset
        }));

        const onMouseMove = (mv: MouseEvent) => {
            if (isTyping) return;
            const dx = mv.clientX - (dragStartPos.current?.x ?? mv.clientX);
            const dy = mv.clientY - (dragStartPos.current?.y ?? mv.clientY);
            if (!isDragging.current && Math.hypot(dx, dy) < 5) return;
            isDragging.current = true;
            setDragId(id);

            const { top, bottom } = canvas.getBoundingClientRect();
            stopAutoScroll();
            const scroll = () => {
                if (mv.clientY < top + 80) canvas.scrollTop -= 8;
                else if (mv.clientY > bottom - 80) canvas.scrollTop += 8;
                if (isDragging.current) autoScrollRef.current = requestAnimationFrame(scroll);
            };
            autoScrollRef.current = requestAnimationFrame(scroll);

            if (canvas) {
                const cr = canvas.getBoundingClientRect();
                setSnapV(Math.abs(mv.clientX - (cr.left + cr.width / 2)) < 20);
                setSnapH(Math.abs(mv.clientY - (cr.top + cr.height / 2)) < 20);
            }

            // 2. Resolve Index using Geometry Snapshot + Current Scroll
            const currentScroll = canvas.scrollTop;
            const mouseAbsY = mv.clientY + currentScroll;

            let targetIndex = rects.length;
            let lineY: number | null = null;

            for (let i = 0; i < rects.length; i++) {
                const r = rects[i];
                if (r.id === id) continue;
                if (mouseAbsY < (r.absTop + r.absBottom) / 2) {
                    targetIndex = r.index;
                    lineY = r.absTop - currentScroll - 1;
                    break;
                }
                if (i === rects.length - 1) {
                    targetIndex = rects.length;
                    lineY = r.absBottom - currentScroll + 1;
                }
            }
            setDropIndex(targetIndex);
            setDropLineY(lineY);
        };

        const onMouseUp = () => {
            stopAutoScroll();
            if (isDragging.current) {
                if (dropIndex !== null) {
                    moveNodeToIndex(id, dropIndex);
                } else {
                    // Invalid drag - dropped outside a zone
                    recordFriction('drag');
                }
            }
            isDragging.current = false;
            setDragId(null); setDropIndex(null); setDropLineY(null);
            setSnapH(false); setSnapV(false);
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }, [nodeTree, dropIndex, moveNodeToIndex, isTyping]);

    // Block resize
    const [blockResizeDir, setBlockResizeDir] = useState<string | null>(null);
    const [liveBlockSize, setLiveBlockSize] = useState<{ w: number; h: number } | null>(null);

    const startBlockResize = useCallback((dir: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!selectedNodeId || !selRect) return;
        const startX = e.clientX; const startY = e.clientY;
        const startW = selRect.width; const startH = selRect.height;
        setBlockResizeDir(dir);

        const canvas = canvasEl();
        const canvasW = canvas?.getBoundingClientRect().width || 800;

        const onMove = (mv: MouseEvent) => {
            const dx = mv.clientX - startX; const dy = mv.clientY - startY;
            let newW = startW; let newH = startH;
            if (dir.includes('e')) newW = Math.max(100, startW + dx);
            if (dir.includes('w')) newW = Math.max(100, startW - dx);
            if (dir.includes('s')) newH = Math.max(50, startH + dy);
            if (dir.includes('n')) newH = Math.max(50, startH - dy);
            newW = Math.round(newW); newH = Math.round(newH);
            setLiveBlockSize({ w: newW, h: newH });
            const widthPct = Math.min(100, Math.max(20, Math.round((newW / canvasW) * 100)));
            updateNode(selectedNodeId!, 'styles.width', `${widthPct}%`);
            if (dir.includes('s') || dir.includes('n')) {
                updateNode(selectedNodeId!, 'styles.minHeight', `${newH}px`);
            }
        };
        const onUp = () => {
            setBlockResizeDir(null); setLiveBlockSize(null); commitHistory();
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }, [selectedNodeId, selRect, updateNode, commitHistory]);

    // Context menu
    const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);

    useEffect(() => {
        if (mode === 'preview') return;
        const host = document.querySelector('.omnora-shadow-host');
        const shadow = host?.shadowRoot;
        if (!shadow) return;
        const onCtx = (e: Event) => {
            e.preventDefault();
            const path = (e as MouseEvent).composedPath() as HTMLElement[];
            const target = path.find(el => (el as HTMLElement).dataset?.nodeId);
            if (!target) return;
            const id = (target as HTMLElement).dataset.nodeId!;
            const mv = e as MouseEvent;
            setCtxMenu({ x: mv.clientX, y: mv.clientY, nodeId: id });
        };
        shadow.addEventListener('contextmenu', onCtx as EventListener);
        return () => shadow.removeEventListener('contextmenu', onCtx as EventListener);
    }, [mode]);

    const handleCtxAction = useCallback((action: string, nodeId: string) => {
        const node = nodeTree[nodeId]; // Access node from nodeTree for its properties
        switch (action) {
            case 'up': reorderNode(nodeId, 'up'); break;
            case 'down': reorderNode(nodeId, 'down'); break;
            case 'dup': duplicateNode(nodeId); break;
            case 'hide': { updateNode(nodeId, 'hidden.mobile', !node?.hidden?.mobile); commitHistory(); break; }
            case 'delete': deleteNode(nodeId); break;
        }
    }, [reorderNode, duplicateNode, deleteNode, updateNode, commitHistory, nodeTree]);

    // Keyboard shortcuts
    useEffect(() => {
        if (mode === 'preview') return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (isTyping) {
                    setIsTyping(false);
                    setEditingInfo(null);
                }
                selectNode(null);
                return;
            }

            // Resolve actual target through Shadow DOM
            const target = (e.composedPath()?.[0] as HTMLElement) || document.activeElement;
            const inInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
            if (inInput || isTyping || !selectedNodeId) return;

            if (e.key === 'ArrowUp' && !e.shiftKey) { e.preventDefault(); reorderNode(selectedNodeId, 'up'); }
            else if (e.key === 'ArrowDown' && !e.shiftKey) { e.preventDefault(); reorderNode(selectedNodeId, 'down'); }
            else if ((e.key === 'Delete' || e.key === 'Backspace') && !e.shiftKey) { e.preventDefault(); deleteNode(selectedNodeId); }
            else if ((e.ctrlKey || e.metaKey) && e.key === 'd') { e.preventDefault(); duplicateNode(selectedNodeId); }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [mode, selectedNodeId, reorderNode, deleteNode, selectNode, duplicateNode, isTyping]);

    const allNodes = Object.values(nodeTree);
    const rootNodes = allNodes.filter((n: any) => n.parentId === null);
    const selectedNode = useNodeSelector(selectedNodeId || '', (n: any) => n);
    const hoveredNode = useNodeSelector(hovId || '', (n: any) => n);

    if (mode === 'preview') return null;

    const nodeTypes = rootNodes.map((n: any) => n.type);
    const hasHero = nodeTypes.some((t: string) => ['hero', 'hero_split'].includes(t));
    const hasTrust = nodeTypes.some((t: string) => ['trust_badges', 'policy_block', 'trust_section'].includes(t));
    const hasProducts = nodeTypes.some((t: string) => ['product_grid', 'featured_product', 'best_sellers'].includes(t));

    return (
        <div
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    recordFriction('misclick');
                }
            }}
            style={{ pointerEvents: isTyping ? 'none' : 'auto' }}
        >
            {ctxMenu && <ContextMenu menu={ctxMenu} onClose={() => setCtxMenu(null)} onAction={handleCtxAction} />}

            {/* Empty canvas */}
            {rootNodes.length === 0 && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 5000 }}>
                    <div style={{ background: '#fff', border: '2px dashed #E5E7EB', borderRadius: 16, padding: '40px 48px', textAlign: 'center', maxWidth: 420, pointerEvents: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>🏗️</div>
                        <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#111827' }}>Your store is empty</h3>
                        <p style={{ margin: '0 0 20px', fontSize: 14, color: '#6B7280', lineHeight: 1.6 }}>Start with a Hero section to make a strong first impression.</p>
                        <button
                            onClick={() => addNode('hero', { headline: 'Welcome to our Store', subheadline: 'Discover amazing products', ctaText: 'Shop Now' })}
                            style={{ background: ACCENT, color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(99,102,241,0.35)' }}
                        >➕ Add Hero Section</button>
                    </div>
                </div>
            )}

            {/* Conversion hints */}
            {rootNodes.length > 0 && (
                <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 5000, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
                    {!hasHero && <ConvHint color="#F59E0B" label="Add a Hero banner for first impressions (+20 pts)" />}
                    {hasHero && !hasTrust && <ConvHint color="#6366F1" label="Add Trust Badges to remove purchase hesitation (+20 pts)" />}
                    {!hasProducts && <ConvHint color="#10B981" label="Stores with a Product Grid convert 3× better" />}
                </div>
            )}

            {/* Hover mini-bar */}
            {hovId && hovRect && hoveredNode && !dragId && (
                <>
                    <div style={{ position: 'fixed', top: hovRect.top, left: hovRect.left, width: hovRect.width, height: hovRect.height, border: '1.5px dashed rgba(99,102,241,0.45)', pointerEvents: 'none', zIndex: 10000, borderRadius: 2 }} />
                    <MiniBar rect={hovRect} nodeId={hovId} isSelected={false} onDragStart={startDrag} />
                </>
            )}

            {/* Selected block overlay */}
            {selRect && selectedNode && (
                <>
                    {/* Selection ring */}
                    <div style={{
                        position: 'fixed',
                        top: selRect.top, left: selRect.left, width: selRect.width, height: selRect.height,
                        border: `2px solid ${ACCENT}`,
                        pointerEvents: 'none', zIndex: 10000,
                        boxShadow: `0 0 0 1px rgba(0,0,0,0.2), inset 0 0 0 1px ${ACCENT_L}`,
                        borderRadius: 2,
                        transition: blockResizeDir ? 'none' : 'all 0.12s cubic-bezier(0.16,1,0.3,1)',
                    }} />

                    <SpacingOverlay rect={selRect} node={selectedNode} />
                    <MiniBar rect={selRect} nodeId={selectedNodeId!} isSelected onDragStart={startDrag} />

                    {/* 8-point block resize handles */}
                    <div style={{ position: 'fixed', top: selRect.top, left: selRect.left, width: selRect.width, height: selRect.height, pointerEvents: 'none', zIndex: 10002 }}>
                        {BLOCK_HANDLES.map(({ dir, cursor, pos }) => (
                            <div
                                key={dir}
                                onMouseDown={e => startBlockResize(dir, e)}
                                style={{
                                    position: 'absolute', width: 10, height: 10,
                                    background: '#fff', border: `2px solid ${ACCENT}`,
                                    borderRadius: 3, cursor, pointerEvents: 'auto',
                                    boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                                    transition: 'transform 0.1s', ...pos,
                                }}
                                onMouseEnter={e => { e.currentTarget.style.transform = ((pos.transform as string) || '') + ' scale(1.3)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = (pos.transform as string) || ''; }}
                            />
                        ))}
                    </div>

                    {/* Dimension badge */}
                    <div style={{
                        position: 'fixed',
                        top: selRect.bottom + 6, left: selRect.left + selRect.width / 2,
                        transform: 'translateX(-50%)',
                        background: '#1F2937', color: 'rgba(255,255,255,0.55)',
                        padding: '2px 8px', borderRadius: 4,
                        fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
                        zIndex: 10000, pointerEvents: 'none',
                    }}>
                        {liveBlockSize ? `${liveBlockSize.w} × ${liveBlockSize.h}` : `${Math.round(selRect.width)} × ${Math.round(selRect.height)}`}
                        {selectedNode.styles?.width && <span style={{ color: ACCENT, marginLeft: 6 }}>{selectedNode.styles.width}</span>}
                    </div>

                    {/* Element-level selection layer (only when block is selected) */}
                    {selectedNode && (
                        <ElementSelectionLayer selectedNodeId={selectedNodeId!} />
                    )}
                </>
            )}

            {/* Drag ghost */}
            {dragId && (() => {
                const el = findEl(dragId);
                const r = el?.getBoundingClientRect();
                if (!r) return null;
                return <div style={{ position: 'fixed', top: r.top, left: r.left, width: r.width, height: r.height, background: 'rgba(99,102,241,0.08)', border: '2px dashed rgba(99,102,241,0.4)', borderRadius: 4, pointerEvents: 'none', zIndex: 10003 }} />;
            })()}

            {/* Drop line */}
            {dragId && dropLineY !== null && (
                <div style={{ position: 'fixed', top: dropLineY, left: '50%', transform: 'translateX(-50%)', width: '80%', maxWidth: 900, height: 3, borderRadius: 3, background: ACCENT, boxShadow: `0 0 8px ${ACCENT}`, pointerEvents: 'none', zIndex: 10004 }}>
                    <div style={{ position: 'absolute', left: -5, top: '50%', transform: 'translateY(-50%)', width: 10, height: 10, borderRadius: '50%', background: ACCENT }} />
                    <div style={{ position: 'absolute', right: -5, top: '50%', transform: 'translateY(-50%)', width: 10, height: 10, borderRadius: '50%', background: ACCENT }} />
                </div>
            )}

            {/* Snap guides */}
            {dragId && snapH && <div style={{ position: 'fixed', left: 0, right: 0, top: '50%', height: 1, background: SNAP_COLOR, pointerEvents: 'none', zIndex: 10005, boxShadow: `0 0 6px ${SNAP_COLOR}` }} />}
            {dragId && snapV && <div style={{ position: 'fixed', top: 0, bottom: 0, left: '50%', width: 1, background: SNAP_COLOR, pointerEvents: 'none', zIndex: 10005, boxShadow: `0 0 6px ${SNAP_COLOR}` }} />}

            {/* Block resize cursor lock */}
            {blockResizeDir && <div style={{ position: 'fixed', inset: 0, zIndex: 20000, cursor: BLOCK_HANDLES.find(h => h.dir === blockResizeDir)?.cursor || 'default' }} />}

            {/* Smart Suggestion Bubble */}
            <SuggestionBubble />
        </div >
    );
};

// ─── Conversion hint ──────────────────────────────────────────────────────────
const ConvHint = ({ color, label }: { color: string; label: string }) => (
    <div style={{ background: '#fff', border: `1.5px solid ${color}`, borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#374151', fontWeight: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: 8, maxWidth: 280 }}>
        <span style={{ fontSize: 14 }}>⚠️</span><span>{label}</span>
    </div>
);

// ─── Wrapped Export ───────────────────────────────────────────────────────────
export const CanvasOverlay: React.FC = () => (
    <ElementControlProvider>
        <CanvasOverlayInner />
    </ElementControlProvider>
);
