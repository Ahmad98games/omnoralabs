import React, { memo } from 'react';
import { Monitor, Tablet, Smartphone, RotateCcw, Box, Eye, EyeOff, ZoomIn, ZoomOut, Maximize } from 'lucide-react';

// ─── Device Definitions ───────────────────────────────────────────────────────
export interface DevicePreset {
    id: string;
    name: string;
    brand: string;
    w: number;
    h: number;
    category: 'phone' | 'tablet' | 'desktop';
    hasNotch?: boolean;
    hasDynamicIsland?: boolean;
    safeTop?: number;
    safeBottom?: number;
}

export const DEVICE_PRESETS: DevicePreset[] = [
    // ── Phones ──────────────────────────────────────────────────────────────
    { id: 'phone_iphone13', name: 'iPhone 13 Pro', brand: 'Apple', category: 'phone', w: 390, h: 844, hasNotch: true, safeTop: 47, safeBottom: 34 },
    { id: 'phone_iphone15', name: 'iPhone 15 Pro', brand: 'Apple', category: 'phone', w: 393, h: 852, hasDynamicIsland: true, safeTop: 59, safeBottom: 34 },
    { id: 'phone_iphone17max', name: 'iPhone 17 Pro Max', brand: 'Apple', category: 'phone', w: 430, h: 932, hasDynamicIsland: true, safeTop: 59, safeBottom: 34 },
    { id: 'phone_samsung_s', name: 'Samsung S Series', brand: 'Samsung', category: 'phone', w: 360, h: 800 },
    { id: 'phone_samsung_ultra', name: 'Samsung S Ultra', brand: 'Samsung', category: 'phone', w: 412, h: 915 },
    { id: 'phone_pixel', name: 'Pixel 7 / 8', brand: 'Google', category: 'phone', w: 412, h: 915 },
    { id: 'phone_zflip', name: 'Galaxy Z Flip', brand: 'Samsung', category: 'phone', w: 360, h: 880 },
    // ── Tablets ─────────────────────────────────────────────────────────────
    { id: 'tablet_ipad', name: 'iPad', brand: 'Apple', category: 'tablet', w: 768, h: 1024 },
    { id: 'tablet_ipad_pro', name: 'iPad Pro 12.9"', brand: 'Apple', category: 'tablet', w: 1024, h: 1366 },
    { id: 'tablet_samsung', name: 'Samsung Galaxy Tab', brand: 'Samsung', category: 'tablet', w: 800, h: 1280 },
    // ── Desktops ────────────────────────────────────────────────────────────
    { id: 'desktop_1280', name: 'Laptop 1280', brand: '', category: 'desktop', w: 1280, h: 800 },
    { id: 'desktop_1440', name: 'Desktop 1440', brand: '', category: 'desktop', w: 1440, h: 900 },
    { id: 'desktop_1920', name: 'UltraWide 1920', brand: '', category: 'desktop', w: 1920, h: 1080 },
];

export const getPreset = (id: string): DevicePreset =>
    DEVICE_PRESETS.find(p => p.id === id) ?? DEVICE_PRESETS.find(p => p.id === 'desktop_1440')!;

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    phone: <Smartphone size={12} />,
    tablet: <Tablet size={12} />,
    desktop: <Monitor size={12} />,
};

const CATEGORY_LABELS: Record<string, string> = {
    phone: '📱 Phones',
    tablet: '📟 Tablets',
    desktop: '🖥️ Desktop',
};

interface Props {
    activePresetId: string;
    orientation: 'portrait' | 'landscape';
    zoomLevel: number;
    showDeviceFrame: boolean;
    showSafeAreaOverlay: boolean;
    onSelectPreset: (id: string) => void;
    onSetOrientation: (o: 'portrait' | 'landscape') => void;
    onSetZoom: (z: number) => void;
    onToggleFrame: () => void;
    onToggleSafeArea: () => void;
    onClose: () => void;
}

export const DevicePresetPanel: React.FC<Props> = memo(({
    activePresetId, orientation, zoomLevel, showDeviceFrame, showSafeAreaOverlay,
    onSelectPreset, onSetOrientation, onSetZoom, onToggleFrame, onToggleSafeArea, onClose
}) => {
    const active = getPreset(activePresetId);
    const categories = ['phone', 'tablet', 'desktop'] as const;

    return (
        <>
            {/* Click-away backdrop */}
            <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 99998 }} />

            <div style={{
                position: 'fixed',
                top: '52px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '340px',
                background: '#13131f',
                border: '1px solid #1a1a1b',
                borderRadius: '12px',
                zIndex: 99999,
                boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
                fontFamily: "'Inter', system-ui, sans-serif",
                overflow: 'hidden',
            }}>
                {/* Header */}
                <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #111' }}>
                    <div style={{ fontSize: '10px', fontWeight: 900, color: '#7c6dfa', letterSpacing: '0.12em', marginBottom: '2px' }}>DEVICE SIMULATOR</div>
                    <div style={{ fontSize: '9px', color: '#4a4a6e' }}>Pixel-accurate store preview</div>
                </div>

                {/* Device Groups */}
                <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                    {categories.map(cat => {
                        const devices = DEVICE_PRESETS.filter(d => d.category === cat);
                        return (
                            <div key={cat}>
                                <div style={{ padding: '8px 16px 4px', display: 'flex', alignItems: 'center', gap: '6px', position: 'sticky', top: 0, background: '#13131f', zIndex: 1 }}>
                                    {CATEGORY_ICONS[cat]}
                                    <span style={{ fontSize: '8px', fontWeight: 900, color: '#5a5a7e', letterSpacing: '0.12em' }}>{CATEGORY_LABELS[cat].toUpperCase().replace(/[📱📟🖥️] /g, '')}</span>
                                </div>
                                {devices.map(device => {
                                    const isActive = device.id === activePresetId;
                                    return (
                                        <button
                                            key={device.id}
                                            onClick={() => { onSelectPreset(device.id); onClose(); }}
                                            style={{
                                                width: '100%',
                                                padding: '8px 16px',
                                                background: isActive ? 'rgba(124,109,250,0.08)' : 'transparent',
                                                border: 'none',
                                                borderLeft: isActive ? '2px solid #7c6dfa' : '2px solid transparent',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                cursor: 'pointer',
                                                transition: 'all 0.12s',
                                            }}
                                            onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(124,109,250,0.04)'; }}
                                            onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ color: isActive ? '#7c6dfa' : '#4a4a6e' }}>{CATEGORY_ICONS[cat]}</div>
                                                <div style={{ textAlign: 'left' }}>
                                                    <div style={{ fontSize: '11px', fontWeight: isActive ? 800 : 600, color: isActive ? '#7c6dfa' : '#ccc' }}>{device.name}</div>
                                                    {device.brand && <div style={{ fontSize: '8px', color: '#4a4a6e' }}>{device.brand}</div>}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span style={{ fontSize: '8px', color: '#2a2a48', background: '#181830', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>
                                                    {device.w}×{device.h}
                                                </span>
                                                {(device.hasNotch || device.hasDynamicIsland) && (
                                                    <span style={{ fontSize: '7px', color: '#5a5a7e', background: '#0f0f10', padding: '1px 4px', borderRadius: '3px' }}>
                                                        {device.hasDynamicIsland ? 'DI' : 'Notch'}
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>

                {/* Controls Footer */}
                <div style={{ borderTop: '1px solid #111', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Orientation (phone/tablet only) */}
                    {active.category !== 'desktop' && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '9px', color: '#5a5a7e', fontWeight: 800 }}>ORIENTATION</span>
                            <div style={{ display: 'flex', background: '#181830', border: '1px solid #1a1a1b', borderRadius: '6px', overflow: 'hidden' }}>
                                {(['portrait', 'landscape'] as const).map(o => (
                                    <button key={o} onClick={() => onSetOrientation(o)}
                                        style={{ padding: '4px 12px', background: orientation === o ? 'rgba(124,109,250,0.15)' : 'transparent', border: 'none', color: orientation === o ? '#7c6dfa' : '#5a5a7e', fontSize: '8px', fontWeight: 900, cursor: 'pointer', letterSpacing: '0.05em' }}>
                                        {o === 'portrait' ? '↕ PORT' : '↔ LAND'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Zoom */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '9px', color: '#5a5a7e', fontWeight: 800 }}>ZOOM</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button onClick={() => onSetZoom(Math.max(25, zoomLevel - 25))}
                                style={{ width: '24px', height: '24px', background: '#181830', border: '1px solid #1a1a1b', borderRadius: '4px', color: '#5a5a7e', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ZoomOut size={11} />
                            </button>
                            {[50, 75, 100].map(z => (
                                <button key={z} onClick={() => onSetZoom(z)}
                                    style={{ padding: '3px 8px', background: zoomLevel === z ? 'rgba(124,109,250,0.12)' : '#181830', border: `1px solid ${zoomLevel === z ? 'rgba(124,109,250,0.3)' : '#1e1e35'}`, borderRadius: '4px', color: zoomLevel === z ? '#7c6dfa' : '#5a5a7e', fontSize: '8px', fontWeight: 900, cursor: 'pointer' }}>
                                    {z}%
                                </button>
                            ))}
                            <button onClick={() => onSetZoom(-1)} title="Fit to screen"
                                style={{ width: '24px', height: '24px', background: zoomLevel === -1 ? 'rgba(124,109,250,0.12)' : '#181830', border: `1px solid ${zoomLevel === -1 ? 'rgba(124,109,250,0.3)' : '#1e1e35'}`, borderRadius: '4px', color: zoomLevel === -1 ? '#7c6dfa' : '#5a5a7e', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Maximize size={10} />
                            </button>
                            <button onClick={() => onSetZoom(Math.min(150, zoomLevel + 25))}
                                style={{ width: '24px', height: '24px', background: '#181830', border: '1px solid #1a1a1b', borderRadius: '4px', color: '#5a5a7e', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ZoomIn size={11} />
                            </button>
                        </div>
                    </div>

                    {/* Frame & Safe Area toggles */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={onToggleFrame}
                            style={{ flex: 1, padding: '6px', background: showDeviceFrame ? 'rgba(124,109,250,0.08)' : '#181830', border: `1px solid ${showDeviceFrame ? 'rgba(124,109,250,0.25)' : '#1e1e35'}`, borderRadius: '6px', color: showDeviceFrame ? '#7c6dfa' : '#4a4a6e', fontSize: '8px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <Box size={10} /> {showDeviceFrame ? 'FRAME ON' : 'FRAME OFF'}
                        </button>
                        <button onClick={onToggleSafeArea}
                            style={{ flex: 1, padding: '6px', background: showSafeAreaOverlay ? 'rgba(124,109,250,0.08)' : '#181830', border: `1px solid ${showSafeAreaOverlay ? 'rgba(124,109,250,0.25)' : '#1e1e35'}`, borderRadius: '6px', color: showSafeAreaOverlay ? '#7c6dfa' : '#4a4a6e', fontSize: '8px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            {showSafeAreaOverlay ? <Eye size={10} /> : <EyeOff size={10} />} SAFE AREA
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
});
