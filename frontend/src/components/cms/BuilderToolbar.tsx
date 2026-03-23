
import React, { useState, useRef, useLayoutEffect, useEffect, memo } from 'react';
import { createPortal } from 'react-dom';
import { useBuilder } from '../../context/BuilderContext';
import {
    Undo2, Redo2, Eye, Edit3,
    Save, Globe, Loader2,
    Plus, ChevronDown, ChevronUp, RotateCcw, HelpCircle, Sparkles
} from 'lucide-react';
import { DevicePresetPanel, getPreset } from './DevicePresetPanel';
import { AICopilotModal } from '../builder/AICopilotModal';
import { TopBarPageSelector } from '../builder/TopBarPageSelector';
import { JobMonitor } from './JobMonitor';

interface BuilderPage {
    id: string;
    title: string;
    slug: string;
    type: 'system' | 'template' | 'custom';
    isLocked: boolean;
    status: 'draft' | 'live';
}

// ─── Tokens ───────────────────────────────────────────────────────────────────
const T = {
    bg:        'var(--surface-overlay)',
    border:    'var(--border-subtle)',
    text:      'var(--text-primary)',
    muted:     'var(--text-secondary)',
    accent:    'var(--accent-primary)',
    accentSub: 'var(--accent-subtle)',
    danger:    'var(--danger)',
    success:   'var(--success)',
    warning:   'var(--warning)',
} as const;

// ─── One-time keyframe injection ──────────────────────────────────────────────
(function inject() {
    if (typeof document === 'undefined' || document.getElementById('omnora-tb-kf')) return;
    const s = document.createElement('style');
    s.id = 'omnora-tb-kf';
    s.textContent = `
        @keyframes spin    { from { transform: rotate(0deg); }  to { transform: rotate(360deg); } }
        @keyframes dropIn  { from { opacity: 0; transform: translateY(-6px) scale(0.97); } to { opacity: 1; transform: none; } }
    `;
    document.head.appendChild(s);
})();

// ─── Helpers ──────────────────────────────────────────────────────────────────
const Divider = () => (
    <div style={{ width: 1, height: 24, background: T.border, flexShrink: 0 }} />
);

const ToolBtn: React.FC<{
    onClick?: () => void; title?: string; active?: boolean;
    disabled?: boolean; children: React.ReactNode;
}> = ({ onClick, title, active, disabled, children }) => (
    <button
        onClick={onClick} title={title} disabled={disabled}
        style={{
            height: 32, minWidth: 32, padding: '0 10px',
            background: active ? T.accentSub : 'transparent',
            border: `1px solid ${active ? T.accent : T.border}`,
            borderRadius: 7, color: active ? T.accent : T.muted,
            cursor: disabled ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            fontSize: 12, fontWeight: 600, flexShrink: 0, transition: 'all .15s',
            opacity: disabled ? 0.5 : 1,
        }}
    >
        {children}
    </button>
);

const SaveIndicator = memo(({ saveStatus, hasUnsavedChanges }: {
    saveStatus: string; hasUnsavedChanges: boolean;
}) => {
    const c = saveStatus === 'saving'     ? T.warning
            : saveStatus === 'processing' ? T.accent
            : saveStatus === 'error'      ? T.danger
            : hasUnsavedChanges           ? T.warning
            : T.success;
    const label = saveStatus === 'saving'     ? 'Saving…'
                : saveStatus === 'processing' ? 'Processing…'
                : saveStatus === 'saved'      ? 'Saved'
                : saveStatus === 'error'      ? 'Error'
                : hasUnsavedChanges           ? 'Unsaved'
                : 'Saved';
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: c, fontWeight: 500 }}>
            <div style={{
                width: 6, height: 6, borderRadius: '50%', background: c,
                animation: saveStatus === 'processing' ? 'pulse 2s infinite' : 'none'
            }} />
            {label}
        </div>
    );
});

// ─── Live-measured anchor rect ────────────────────────────────────────────────
// Re-measures on every resize/scroll while `isOpen` is true.
// Never stale.
function useAnchorRect(
    ref: React.RefObject<HTMLButtonElement | null>,
    isOpen: boolean,
): DOMRect | null {
    const [rect, setRect] = useState<DOMRect | null>(null);
    useLayoutEffect(() => {
        if (!isOpen) { setRect(null); return; }
        const measure = () => setRect(ref.current?.getBoundingClientRect() ?? null);
        measure();
        window.addEventListener('resize', measure);
        window.addEventListener('scroll', measure, true);
        return () => {
            window.removeEventListener('resize', measure);
            window.removeEventListener('scroll', measure, true);
        };
    }, [isOpen, ref]);
    return rect;
}

// ─── Main component ───────────────────────────────────────────────────────────
interface Props {
    onToggleLibrary: () => void;
    libraryOpen: boolean;
}

import { useBuilderStore } from '../../stores/useBuilderStore';
import { publisher } from '../../platform/publish/Publisher';

export const BuilderToolbar: React.FC<Props> = ({ onToggleLibrary, libraryOpen }) => {
    const {
        mode, setMode,
        undo, redo, saveDraft, publishLive,
        saveStatus, activeJobId, hasUnsavedChanges,
        pages, activePageId, setActivePageId, addPage, deletePage,
        devicePreset, setDevicePreset,
        orientation, setOrientation,
        zoomLevel, setZoomLevel,
        showDeviceFrame, toggleDeviceFrame,
        showSafeAreaOverlay, toggleSafeAreaOverlay,
    } = useBuilder();

    // 🚀 Publish Hardening Zustand State
    const publishStatus = useBuilderStore(state => state.publishStatus);
    const publishError = useBuilderStore(state => state.publishError);
    const lastPublishedAt = useBuilderStore(state => state.lastPublishedAt);
    const setPublishError = useBuilderStore(state => state.setPublishError);
    const setPublishStatus = useBuilderStore(state => state.setPublishStatus);

    // 👁️ Live Preview Zustand State
    const isPreviewMode = useBuilderStore(state => state.isPreviewMode);
    const setIsPreviewMode = useBuilderStore(state => state.setIsPreviewMode);
    const previewDevice = useBuilderStore(state => state.previewDevice);
    const setPreviewDevice = useBuilderStore(state => state.setPreviewDevice);

    const [relativeTime, setRelativeTime] = useState<string>('');

    // ⏱️ Relative Time Tracker (Updates every 60s)
    useEffect(() => {
        if (!lastPublishedAt) { setRelativeTime(''); return; }
        const update = () => {
            const diff = Date.now() - new Date(lastPublishedAt).getTime();
            const sec = Math.floor(diff / 1000);
            const min = Math.floor(sec / 60);
            if (min === 0) setRelativeTime(`${sec}s ago`);
            else if (min < 60) setRelativeTime(`${min}m ago`);
            else setRelativeTime('Today');
        };
        update();
        const timer = setInterval(update, 60000);
        return () => clearInterval(timer);
    }, [lastPublishedAt]);

    const [openDropdown, setOpenDropdown] = useState<'page' | 'device' | null>(null);
    const showPagePicker   = openDropdown === 'page';
    const showDevicePicker = openDropdown === 'device';
    const close = () => setOpenDropdown(null);

    const [addingPage,  setAddingPage]  = useState(false);
    const [newPageName, setNewPageName] = useState('');
    const [isCopilotOpen, setIsCopilotOpen] = useState(false);

    const pagePickerBtnRef   = useRef<HTMLButtonElement>(null);
    const devicePickerBtnRef = useRef<HTMLButtonElement>(null);

    const pagePickerRect   = useAnchorRect(pagePickerBtnRef,   showPagePicker);
    const devicePickerRect = useAnchorRect(devicePickerBtnRef, showDevicePicker);

    const safePages = pages?.byId ?? {};
    const pageIds = pages?.allIds ?? [];

    const systemPages = pageIds.filter((id: string) => safePages[id]?.type === 'system');
    const templatePages = pageIds.filter((id: string) => safePages[id]?.type === 'template');
    const customPages = pageIds.filter((id: string) => safePages[id]?.type === 'custom');

    const activeDevice = getPreset(devicePreset);
    const displayW = orientation === 'landscape' ? activeDevice.h : activeDevice.w;
    const displayH = orientation === 'landscape' ? activeDevice.w : activeDevice.h;

    const isProcessing = saveStatus === 'processing' || !!activeJobId;

    const handlePublish = async () => {
        try {
            const merchantId = 'demo_merchant'; // or resolve from context
            const domain = 'demo.omnora.com';
            await publisher.publishSite(merchantId, domain);
        } catch (err) {
            console.error('[BuilderToolbar] publishSite failed:', err);
        }
    };

    // ... (handleAddPage, cancelAddPage, useEffect for global Escape)

    // ... (dropdownContent and main return up to the publish button)

    const handleAddPage = () => {
        if (!newPageName.trim()) return;
        const slug = '/' + newPageName.trim().toLowerCase().replace(/\s+/g, '-');
        addPage?.(newPageName.trim(), slug, 'custom');
        setNewPageName('');
        setAddingPage(false);
    };

    const cancelAddPage = () => { setNewPageName(''); setAddingPage(false); };

    // Close on global Escape.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const dropdownContent = (showPagePicker || showDevicePicker) ? (
        <>
            {/* FIX: backdrop is a portal child — truly full-viewport, not clipped by toolbar overflow */}
            <div onClick={close} style={{ position: 'fixed', inset: 0, zIndex: 9998 }} />

            {showPagePicker && pagePickerRect && (
                <div
                    onClick={e => e.stopPropagation()}
                    style={{
                        position: 'fixed',
                        top: pagePickerRect.bottom + 6,
                        left: Math.min(pagePickerRect.left, window.innerWidth - 240),
                        background: T.bg, border: `1px solid ${T.border}`,
                        borderRadius: 10, minWidth: 220, padding: 6,
                        zIndex: 9999, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                        animation: 'dropIn 0.15s cubic-bezier(0.16,1,0.3,1)',
                        fontFamily: "'Inter', system-ui, sans-serif",
                    }}
                >
                    <div style={{ maxHeight: '350px', overflowY: 'auto', padding: '4px' }}>
                        {[
                            { label: 'System Pages', ids: systemPages },
                            { label: 'Templates', ids: templatePages },
                            { label: 'Custom Pages', ids: customPages }
                        ].map((group: any) => group.ids.length > 0 && (
                            <div key={group.label} style={{ marginBottom: 12 }}>
                                <p style={{
                                    fontSize: 9, fontWeight: 900, color: T.muted,
                                    textTransform: 'uppercase', letterSpacing: '0.1em',
                                    padding: '0 8px', marginBottom: 6, opacity: 0.6
                                }}>{group.label}</p>
                                {group.ids.map((id: string) => {
                                    const p = safePages[id];
                                    const isActive = id === activePageId;
                                    return (
                                        <div key={id} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <button
                                                onClick={() => { setActivePageId(id); close(); }}
                                                style={{
                                                    flex: 1, padding: '8px 10px',
                                                    background: isActive ? T.accentSub : 'none',
                                                    border: 'none', borderRadius: 7,
                                                    color: isActive ? T.accent : T.text,
                                                    display: 'flex', alignItems: 'center', gap: 8,
                                                    cursor: 'pointer', fontSize: 13, fontWeight: 500, textAlign: 'left',
                                                    transition: 'all 0.2s',
                                                }}
                                            >
                                                <div style={{
                                                    width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                                                    background: (p.status || 'draft') === 'live' ? T.success : T.warning,
                                                }} />
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span>{p.title}</span>
                                                    <span style={{ fontSize: 10, opacity: 0.5, fontFamily: 'monospace' }}>{p.slug}</span>
                                                </div>
                                            </button>

                                            {!p.isLocked && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deletePage(id); }}
                                                    style={{
                                                        width: 28, height: 28, borderRadius: 6, background: 'none',
                                                        border: 'none', color: T.muted, cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseOver={e => (e.currentTarget.style.color = T.danger)}
                                                    onMouseOut={e => (e.currentTarget.style.color = T.muted)}
                                                >
                                                    <RotateCcw size={12} style={{ transform: 'rotate(45deg)' }} />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                    <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 4, paddingTop: 6, padding: '0 4px' }}>
                        {addingPage ? (
                            <div style={{ display: 'flex', gap: 6, padding: 4 }}>
                                <input
                                    autoFocus
                                    value={newPageName}
                                    onChange={e => setNewPageName(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter')  { handleAddPage(); return; }
                                        if (e.key === 'Escape') { cancelAddPage(); return; }
                                        e.stopPropagation();
                                    }}
                                    placeholder="Scene Name (e.g. About)"
                                    style={{
                                        flex: 1, border: `1px solid ${T.border}`, borderRadius: 8,
                                        padding: '5px 10px', fontSize: 12, outline: 'none', 
                                        color: T.text, background: 'rgba(255,255,255,0.02)'
                                    }}
                                />
                                <button onClick={handleAddPage} style={{
                                    background: T.accent, border: 'none', borderRadius: 8,
                                    padding: '5px 12px', color: '#000', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                }}>Add</button>
                                <button onClick={cancelAddPage} style={{
                                    background: 'none', border: `1px solid ${T.border}`,
                                    borderRadius: 8, padding: '5px 8px', color: T.muted,
                                    fontSize: 12, cursor: 'pointer',
                                }}>✕</button>
                            </div>
                        ) : (
                            <button onClick={() => setAddingPage(true)} style={{
                                width: '100%', height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                gap: 6, background: 'rgba(255,255,255,0.03)',
                                border: `1px dashed ${T.border}`, borderRadius: 8,
                                color: T.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = T.muted; }}
                            onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = T.border; }}
                            >
                                <Plus size={14} /> Create New Scene
                            </button>
                        )}
                    </div>
                </div>
            )}

            {showDevicePicker && devicePickerRect && (
                <div
                    onClick={e => e.stopPropagation()}
                    style={{
                        position: 'fixed',
                        top: devicePickerRect.bottom + 6,
                        // FIX: clamp so the panel never slides off the right edge of the viewport.
                        left: Math.min(devicePickerRect.left, window.innerWidth - 320),
                        zIndex: 9999,
                        animation: 'dropIn 0.15s cubic-bezier(0.16,1,0.3,1)',
                    }}
                >
                    <DevicePresetPanel
                        activePresetId={devicePreset}
                        orientation={orientation}
                        zoomLevel={zoomLevel}
                        showDeviceFrame={showDeviceFrame}
                        showSafeAreaOverlay={showSafeAreaOverlay}
                        onSelectPreset={setDevicePreset}
                        onSetOrientation={setOrientation}
                        onSetZoom={setZoomLevel}
                        onToggleFrame={toggleDeviceFrame}
                        onToggleSafeArea={toggleSafeAreaOverlay}
                        onClose={close}
                    />
                </div>
            )}
        </>
    ) : null;
    
    return (
        <>
            {/* 🛑 Inline Error Banner */}
            {publishStatus === 'error' && publishError && (
                <div style={{ 
                    background: '#FEF2F2', borderBottom: '1px solid #FCA5A5', 
                    padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 12,
                    position: 'relative', zIndex: 100,
                    fontFamily: "'Inter', sans-serif",
                }}>
                     <span style={{ color: '#B91C1C', fontSize: 13, fontWeight: 500, flex: 1 }}>
                          ⚠️ Publish Failed: {publishError}
                     </span>
                     <button 
                         onClick={handlePublish}
                         style={{ 
                             background: '#B91C1C', color: '#fff', border: 'none', 
                             borderRadius: 6, padding: '5px 12px', fontSize: 12, 
                             fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                         }}
                     >
                          Retry
                     </button>
                </div>
            )}

            <div
                className="builder-toolbar-container"
                style={{
                    height: 48, background: T.bg,
                    borderBottom: `1px solid ${T.border}`,
                    display: 'flex', alignItems: 'center',
                    padding: '0 14px', gap: 8, flexShrink: 0,
                    fontFamily: "var(--font-sans)",
                    // FIX: no overflow:auto — that creates a new fixed-position containing block
                    // that traps portaled children. Use clip instead so text doesn't overflow
                    // but fixed-position descendants are unaffected.
                    position: 'relative', zIndex: 50,
                    overflowX: 'clip',
                }}
            >
                {/* Brand */}
                {/* Brand */}
                {window.innerWidth >= 1024 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginRight: 4 }}>
                        <div style={{
                            width: 26, height: 26, borderRadius: 7, background: 'var(--accent-gold)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 13, fontWeight: 800, color: '#000',
                            boxShadow: '0 0 15px rgba(var(--accent-gold-rgb), 0.3)',
                        }}>O</div>
                        <span style={{ fontSize: 13, fontWeight: 800, color: T.text, letterSpacing: '-0.02em' }}>Omnora OS <span style={{ color: T.muted, fontWeight: 400 }}>Builder</span></span>
                    </div>
                )}

                {window.innerWidth < 1024 && window.innerWidth >= 768 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginRight: 4 }}>
                        <div style={{
                            width: 26, height: 26, borderRadius: 7, background: 'var(--accent-gold)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 13, fontWeight: 800, color: '#000',
                        }}>O</div>
                    </div>
                )}

                {window.innerWidth < 768 ? (
                    // 📱 MOBILE TOOLBAR LAYOUT
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, overflow: 'hidden' }}>
                        <div style={{ flex: 1, minWidth: 0, overflowX: 'auto' }}>
                            <TopBarPageSelector />
                        </div>

                        <SaveIndicator saveStatus={saveStatus} hasUnsavedChanges={hasUnsavedChanges} />

                        {/* Overflow Menu with ⋯ icon */}
                        <button
                            onClick={() => setOpenDropdown(v => v === 'overflow' ? null : 'overflow')}
                            style={{
                                height: 32, width: 32, borderRadius: 8,
                                background: openDropdown === 'overflow' ? T.accentSub : 'transparent',
                                border: `1px solid ${openDropdown === 'overflow' ? T.accent : T.border}`,
                                color: openDropdown === 'overflow' ? T.accent : '#fff',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                        >
                            <span style={{ fontSize: 16, fontWeight: 800 }}>⋮</span>
                        </button>

                        <button
                            onClick={handlePublish}
                            disabled={publishStatus === 'publishing'}
                            style={{
                                height: 32, padding: '0 12px', background: 'var(--accent-gold)', border: 'none',
                                cursor: publishStatus === 'publishing' ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {publishStatus === 'publishing' ? '...' : 'Publish'}
                        </button>
                    </div>
                ) : (
                    // 🖥️ DESKTOP TOOLBAR LAYOUT
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
                        
                        {/* ─── LEFT ZONE ─── */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            {/* Logo Mark (Icon Only) */}
                            <div style={{
                                width: 24, height: 24, borderRadius: 6, background: 'var(--accent-primary)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 13, fontWeight: 800, color: '#FFFFFF', cursor: 'default'
                            }}>O</div>
                            
                            <Divider />
                            <TopBarPageSelector />
                            <Divider />
                            
                            {/* ➕ Elements Library Toggle */}
                            <button 
                                onClick={onToggleLibrary}
                                style={{
                                    height: 32, padding: '0 12px', background: libraryOpen ? 'var(--accent-subtle, rgba(124, 109, 250, 0.1))' : 'none',
                                    border: `1px solid ${libraryOpen ? 'var(--accent-primary, #7c6dfa)' : 'var(--border-subtle, #3f3f46)'}`, 
                                    borderRadius: 8, color: libraryOpen ? 'var(--accent-primary, #7c6dfa)' : '#d4d4d8', 
                                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s'
                                }}
                            >
                                <Plus size={14} /> Elements
                            </button>
                        </div>

                        {/* ─── CENTER ZONE ─── */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
                            {/* Device Segmented Control */}
                            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.03)', border: `1px solid ${T.border}`, borderRadius: 8, padding: 2 }}>
                                {(['desktop', 'tablet', 'phone'] as const).map(d => {
                                    const isSel = activeDevice.category === d;
                                    return (
                                        <button
                                            key={d}
                                            onClick={() => setDevicePreset(d === 'desktop' ? 'desktop_1440' : d === 'tablet' ? 'ipad_air' : 'iphone_14')}
                                            style={{
                                                height: 28, width: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                background: isSel ? 'var(--surface-raised)' : 'transparent',
                                                border: 'none', borderRadius: 6, cursor: 'pointer',
                                                boxShadow: isSel ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                                                transition: 'all 0.15s'
                                            }}
                                        >
                                            <span style={{ fontSize: 13, filter: isSel ? 'none' : 'grayscale(1)', opacity: isSel ? 1 : 0.6 }}>
                                                {d === 'desktop' ? '🖥️' : d === 'tablet' ? '📟' : '📱'}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                            
                            {/* Read-Only Canvas Zoom */}
                            <div style={{ fontSize: 13, color: T.muted, fontWeight: 500, padding: '0 8px' }}>
                                100%
                            </div>
                        </div>

                        {/* ─── RIGHT ZONE ─── */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            {/* Undo / Redo */}
                            <div style={{ display: 'flex', gap: 2 }}>
                                <button onClick={undo} style={{ height: 32, width: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: T.text, cursor: 'pointer' }}>
                                    <Undo2 size={14} />
                                </button>
                                <button onClick={redo} style={{ height: 32, width: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: T.text, cursor: 'pointer' }}>
                                    <Redo2 size={14} />
                                </button>
                            </div>

                            <Divider />

                            {/* Preview Toggle (Ghost) */}
                            <button 
                                onClick={() => setIsPreviewMode(!isPreviewMode)}
                                style={{
                                    height: 32, padding: '0 12px', background: isPreviewMode ? 'var(--surface-raised)' : 'none',
                                    border: isPreviewMode ? `1px solid ${T.border}` : '1px solid transparent', borderRadius: 6,
                                    color: T.text, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s'
                                }}
                            >
                                {isPreviewMode ? <Edit3 size={14} /> : <Eye size={14} />}
                                <span style={{ fontSize: 13 }}>{isPreviewMode ? 'Edit' : 'Preview'}</span>
                            </button>

                            {/* AI Magic */}
                            <button 
                                onClick={() => setIsCopilotOpen(true)}
                                style={{
                                    height: 32, padding: '0 12px', background: 'none', border: 'none',
                                    color: 'var(--accent-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 6
                                }}
                            >
                                <Sparkles size={14} />
                                AI Magic
                            </button>

                            <Divider />

                            {/* Save Status & Relative Time */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <SaveIndicator saveStatus={saveStatus} hasUnsavedChanges={hasUnsavedChanges} />
                                {relativeTime && (
                                    <span style={{ fontSize: 11, color: T.muted }}>
                                        ({relativeTime})
                                    </span>
                                )}
                            </div>

                            {/* Publish Button */}
                            <button
                                onClick={handlePublish}
                                disabled={publishStatus === 'publishing'}
                                style={{
                                    height: 36, padding: '0 16px', background: 'var(--accent-primary)', border: 'none',
                                    borderRadius: 6, color: '#FFFFFF', cursor: publishStatus === 'publishing' ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 500,
                                    opacity: publishStatus === 'publishing' ? 0.7 : 1, transition: 'all 0.15s',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                }}
                            >
                                {publishStatus === 'publishing' ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Globe size={14} />}
                                {publishStatus === 'success' ? 'Published' : 'Publish'}
                            </button>
                        </div>
                    </div>
                )}


            {/* 📱 MOBILE OVERFLOW MENU */}
            {window.innerWidth < 768 && openDropdown === 'overflow' && (
                <div style={{
                    position: 'absolute', top: 52, right: 14, background: '#121214', 
                    border: '1px solid #1c1c1f', borderRadius: 12, padding: 6, 
                    zIndex: 210, width: 170, boxShadow: '0 15px 40px rgba(0,0,0,0.6)',
                    fontFamily: "'Inter', sans-serif"
                }}>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                        <button onClick={undo} style={{ flex: 1, padding: '8px', background: 'transparent', border: '1px solid #1c1c1f', borderRadius: 8, color: '#fff', display: 'flex', justifyContent: 'center' }}><Undo2 size={13} /></button>
                        <button onClick={redo} style={{ flex: 1, padding: '8px', background: 'transparent', border: '1px solid #1c1c1f', borderRadius: 8, color: '#fff', display: 'flex', justifyContent: 'center' }}><Redo2 size={13} /></button>
                    </div>
                    <div style={{ borderTop: '1px solid #1c1c1f', margin: '6px 0' }} />
                    <button 
                        onClick={() => { setIsPreviewMode(!isPreviewMode); setOpenDropdown(null); }}
                        style={{ width: '100%', padding: '9px 12px', background: 'transparent', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                    >
                        {isPreviewMode ? <Edit3 size={13} /> : <Eye size={13} />}
                        <span>{isPreviewMode ? 'View Edit' : 'Preview'}</span>
                    </button>
                    <button 
                        onClick={() => { onToggleLibrary(); setOpenDropdown(null); }}
                        style={{ width: '100%', padding: '9px 12px', background: 'transparent', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 3 }}
                    >
                        <Plus size={13} /> <span>Elements</span>
                    </button>
                </div>
            )}
            </div>

            {/* FIX: portal — dropdowns escape the toolbar's stacking context entirely */}
            {dropdownContent && createPortal(dropdownContent, document.body)}

            <AICopilotModal isOpen={isCopilotOpen} onClose={() => setIsCopilotOpen(false)} />
            <JobMonitor />
        </>
    );
};