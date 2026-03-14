
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
    bg:        'var(--bg-background)',
    border:    'var(--border-primary)',
    text:      'var(--text-primary)',
    muted:     'var(--text-secondary)',
    accent:    'var(--accent-gold)',
    accentSub: 'rgba(var(--accent-gold-rgb), 0.1)',
    danger:    '#EF4444',
    success:   '#10B981',
    warning:   '#F59E0B',
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

import { JobMonitor } from './JobMonitor';

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

    // ... (rest of state logic)
    const [openDropdown, setOpenDropdown] = useState<'page' | 'device' | null>(null);
    const showPagePicker   = openDropdown === 'page';
    const showDevicePicker = openDropdown === 'device';
    const close = () => setOpenDropdown(null);

    const [addingPage,  setAddingPage]  = useState(false);
    const [newPageName, setNewPageName] = useState('');
    const [isCopilotOpen, setIsCopilotOpen] = useState(false);
    const [publishing, setPublishing] = useState(false);

    // ... (other refs and hooks)
    const pagePickerBtnRef   = useRef<HTMLButtonElement>(null);
    const devicePickerBtnRef = useRef<HTMLButtonElement>(null);

    const pagePickerRect   = useAnchorRect(pagePickerBtnRef,   showPagePicker);
    const devicePickerRect = useAnchorRect(devicePickerBtnRef, showDevicePicker);

    const safePages = pages?.byId ?? {};
    const pageIds = pages?.allIds ?? [];

    // ... (grouping logic)
    const systemPages = pageIds.filter((id: string) => safePages[id]?.type === 'system');
    const templatePages = pageIds.filter((id: string) => safePages[id]?.type === 'template');
    const customPages = pageIds.filter((id: string) => safePages[id]?.type === 'custom');

    const activeDevice = getPreset(devicePreset);
    const displayW = orientation === 'landscape' ? activeDevice.h : activeDevice.w;
    const displayH = orientation === 'landscape' ? activeDevice.w : activeDevice.h;

    const isProcessing = saveStatus === 'processing' || !!activeJobId;

    const handlePublish = async () => {
        setPublishing(true);
        try {
            await publishLive();
        } catch (err) {
            console.error('[BuilderToolbar] publishLive failed:', err);
        } finally {
            setPublishing(false);
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
            <div
                className="builder-toolbar-container"
                style={{
                    height: 52, background: T.bg,
                    borderBottom: `1px solid ${T.border}`,
                    display: 'flex', alignItems: 'center',
                    padding: '0 14px', gap: 8, flexShrink: 0,
                    fontFamily: "'Inter', system-ui, sans-serif",
                    // FIX: no overflow:auto — that creates a new fixed-position containing block
                    // that traps portaled children. Use clip instead so text doesn't overflow
                    // but fixed-position descendants are unaffected.
                    position: 'relative', zIndex: 50,
                    overflowX: 'clip',
                }}
            >
                {/* Brand */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginRight: 4 }}>
                    <div style={{
                        width: 26, height: 26, borderRadius: 7, background: 'var(--accent-gold)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 800, color: '#000',
                        boxShadow: '0 0 15px rgba(var(--accent-gold-rgb), 0.3)',
                    }}>O</div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: T.text, letterSpacing: '-0.02em' }}>Omnora OS <span style={{ color: T.muted, fontWeight: 400 }}>Builder</span></span>
                </div>

                <Divider />

                <ToolBtn onClick={onToggleLibrary} active={libraryOpen}>
                    <Plus size={13} /> Elements
                </ToolBtn>

                <Divider />

                {/* Page picker trigger */}
                <button
                    ref={pagePickerBtnRef}
                    onClick={() => setOpenDropdown(v => v === 'page' ? null : 'page')}
                    style={{
                        height: 32, padding: '0 10px',
                        background: showPagePicker ? T.accentSub : 'transparent',
                        border: `1px solid ${showPagePicker ? T.accent : T.border}`,
                        borderRadius: 7, color: showPagePicker ? T.accent : T.muted,
                        cursor: 'pointer', display: 'flex', alignItems: 'center',
                        gap: 5, fontSize: 12, fontWeight: 600, flexShrink: 0,
                    }}
                >
                    <Globe size={13} />
                    {safePages[activePageId]?.title || activePageId || 'Home'}
                    {showPagePicker ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                </button>

                <Divider />

                {/* Device picker trigger */}
                <button
                    ref={devicePickerBtnRef}
                    onClick={() => setOpenDropdown(v => v === 'device' ? null : 'device')}
                    style={{
                        height: 32, padding: '0 10px',
                        background: showDevicePicker ? T.accentSub : 'transparent',
                        border: `1px solid ${showDevicePicker ? T.accent : T.border}`,
                        borderRadius: 7, color: showDevicePicker ? T.accent : T.muted,
                        cursor: 'pointer', display: 'flex', alignItems: 'center',
                        gap: 5, fontSize: 12, fontWeight: 600, flexShrink: 0,
                    }}
                >
                    <span>{activeDevice.category === 'phone' ? '📱' : activeDevice.category === 'tablet' ? '📟' : '🖥️'}</span>
                    <span style={{ maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {activeDevice.name}
                    </span>
                    <span style={{ color: T.muted, fontSize: 11 }}>{displayW}×{displayH}</span>
                    {showDevicePicker ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                </button>

                {activeDevice.category !== 'desktop' && (
                    <ToolBtn
                        onClick={() => setOrientation(orientation === 'portrait' ? 'landscape' : 'portrait')}
                        title="Rotate"
                    >
                        <RotateCcw
                            size={13}
                            style={{
                                transform: orientation === 'landscape' ? 'rotate(-90deg)' : 'none',
                                transition: 'transform .3s',
                            }}
                        />
                    </ToolBtn>
                )}

                <Divider />

                <ToolBtn onClick={undo} title="Undo"><Undo2 size={13} /></ToolBtn>
                <ToolBtn onClick={redo} title="Redo"><Redo2 size={13} /></ToolBtn>

                <Divider />

                <div style={{ display: 'flex', border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                    {(['edit', 'preview'] as const).map(m => (
                        <button key={m} onClick={() => setMode(m)} style={{
                            height: 32, padding: '0 12px',
                            background: mode === m ? '#F3F4F6' : 'transparent',
                            border: 'none', color: mode === m ? T.text : T.muted,
                            cursor: 'pointer', display: 'flex', alignItems: 'center',
                            gap: 5, fontSize: 13, fontWeight: mode === m ? 600 : 400,
                        }}>
                            {m === 'edit' ? <><Edit3 size={13} /> Edit</> : <><Eye size={13} /> Preview</>}
                        </button>
                    ))}
                </div>
                
                <Divider />

                <ToolBtn onClick={() => setIsCopilotOpen(true)} title="AI Magic Copilot" active={isCopilotOpen}>
                    <Sparkles size={13} className="text-indigo-500" />
                    <span className="text-indigo-600">AI Magic</span>
                </ToolBtn>

                <ToolBtn onClick={() => window.open('/builder/help', '_blank')} title="Help Guide">
                    <HelpCircle size={13} /> Help
                </ToolBtn>

                <div style={{ flex: 1, minWidth: 12 }} />

                <SaveIndicator saveStatus={saveStatus} hasUnsavedChanges={hasUnsavedChanges} />

                <div data-tour="save-button">
                    <ToolBtn onClick={() => saveDraft()}>
                        <Save size={13} /> Save
                    </ToolBtn>
                </div>

                <button
                    onClick={handlePublish}
                    disabled={publishing}
                    style={{
                        height: 32, padding: '0 18px', background: 'var(--accent-gold)', border: 'none',
                        borderRadius: 8, color: '#000', cursor: publishing ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700,
                        opacity: publishing ? 0.7 : 1, flexShrink: 0,
                        boxShadow: '0 4px 15px rgba(var(--accent-gold-rgb), 0.2)',
                        transition: 'all 0.3s ease',
                    }}
                >
                    {publishing
                        // FIX: spin keyframe is now defined via one-time head injection above.
                        ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                        : <Globe size={13} />
                    }
                    {publishing ? 'Publishing…' : 'Publish'}
                </button>
            </div>

            {/* FIX: portal — dropdowns escape the toolbar's stacking context entirely */}
            {dropdownContent && createPortal(dropdownContent, document.body)}

            <AICopilotModal isOpen={isCopilotOpen} onClose={() => setIsCopilotOpen(false)} />
            <JobMonitor />
        </>
    );
};