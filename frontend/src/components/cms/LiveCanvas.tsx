import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useBuilder, useUI, useNodes } from '../../context/BuilderContext';
import { DynamicSection } from '../DynamicSection';
import { CanvasOverlay } from './CanvasOverlay';
import { BuilderHealthOverlay } from './BuilderHealthOverlay';
import { getPreset } from './DevicePresetPanel';

// ─── Shadow Host ──────────────────────────────────────────────────────────────
/**
 * ShadowHost — Omnora OS v5.1 Device Simulation Architecture
 *
 * Extends v5.0 singleton Shadow DOM with:
 *  - safe-area CSS variable injection (--omnora-safe-*)
 *  - GPU acceleration hints for smooth scaling
 */
const ShadowHost: React.FC<{
    children: React.ReactNode;
    designSystem: any;
    theme: any;
    mode: string;
    safeTop?: number;
    safeBottom?: number;
}> = ({ children, designSystem, theme, mode, safeTop = 0, safeBottom = 0 }) => {
    const hostRef = useRef<HTMLDivElement>(null);
    const shadowRootRef = useRef<ShadowRoot | null>(null);
    const styleElRef = useRef<HTMLStyleElement | null>(null);
    const [isReady, setIsReady] = useState(false);
    const { selectNode } = useBuilder();

    // Phase 1: Shadow Root Singleton Attachment
    useEffect(() => {
        const host = hostRef.current;
        if (!host) return;
        let root: ShadowRoot;
        if (host.shadowRoot) {
            root = host.shadowRoot;
        } else {
            try { root = host.attachShadow({ mode: 'open' }); }
            catch (err) { console.error('[Omnora] Shadow DOM attachment failed:', err); return; }
        }
        shadowRootRef.current = root;
        let styleEl = root.querySelector<HTMLStyleElement>('#omnora-shadow-styles');
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'omnora-shadow-styles';
            root.appendChild(styleEl);
        }
        styleElRef.current = styleEl;
        setIsReady(true);
        return () => {
            shadowRootRef.current = null;
            styleElRef.current = null;
            setIsReady(false);
        };
    }, []);

    // Phase 2: Zero-Lag Style Injection (full design token injection)
    const shadowStyles = useMemo(() => {
        const c = designSystem?.colors ?? {};
        const t = designSystem?.typography ?? {};
        const s = designSystem?.spacing ?? {};

        // Font family map
        const fontPairMap: Record<string, { heading: string; body: string }> = {
            luxury: { heading: "'Playfair Display', Georgia, serif", body: "'Inter', system-ui, sans-serif" },
            minimal: { heading: "'DM Sans', system-ui, sans-serif", body: "'DM Sans', system-ui, sans-serif" },
            editorial: { heading: "'Space Mono', monospace", body: "Georgia, 'Times New Roman', serif" },
            clean: { heading: "'Inter', system-ui, sans-serif", body: "'Inter', system-ui, sans-serif" },
            poppins: { heading: "'Poppins', system-ui, sans-serif", body: "'Poppins', system-ui, sans-serif" },
        };
        const pair = fontPairMap[t.pair ?? 'luxury'] ?? fontPairMap.luxury;

        // Shadow system
        const shadowMap: Record<string, string> = {
            none: 'none',
            soft: '0 2px 8px rgba(0,0,0,0.15)',
            medium: '0 8px 24px rgba(0,0,0,0.3)',
            heavy: '0 20px 60px rgba(0,0,0,0.6)',
        };
        const shadowVal = shadowMap[s.shadowStyle ?? 'soft'] ?? shadowMap.soft;

        return `
:host {
  display: block;
  width: 100%;
  min-height: 100%;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  /* ── Safe areas ─────────────────────────────── */
  --omnora-safe-top: ${safeTop}px;
  --omnora-safe-bottom: ${safeBottom}px;
  --omnora-safe-left: 0px;
  --omnora-safe-right: 0px;

  /* ── Backgrounds ───────────────────────────── */
  --bg-primary:      ${theme?.backgroundColor ?? c.primary ?? '#030304'};
  --bg-surface:      ${theme?.cardColor ?? c.surface ?? '#0a0a0b'};
  --bg-overlay:      ${c.overlay ?? 'rgba(0,0,0,0.7)'};

  /* ── Brand / Accent ────────────────────────── */
  --accent-primary:   ${theme?.primaryColor ?? c.accentPrimary ?? '#C5A059'};
  --accent-secondary: ${theme?.primaryColor ?? c.accentSecondary ?? '#8B5E2A'};

  /* ── Text ──────────────────────────────────── */
  --text-primary: ${theme?.textColor ?? c.textPrimary ?? '#ffffff'};
  --text-muted:   ${theme?.textColor ?? c.textMuted ?? 'rgba(255,255,255,0.5)'};

  /* ── UI ────────────────────────────────────── */
  --border-color: ${c.border ?? 'rgba(255,255,255,0.08)'};
  --btn-bg:       ${theme?.primaryColor ?? c.buttonBg ?? c.accentPrimary ?? '#C5A059'};
  --btn-text:     ${theme?.backgroundColor ?? c.buttonText ?? '#000000'};

  /* ── Feedback ──────────────────────────────── */
  --color-success: ${c.success ?? '#4ade80'};
  --color-error:   ${c.error ?? '#ef4444'};
  --color-warning: ${c.warning ?? '#fbbf24'};

  /* ── Typography Scale ──────────────────────── */
  --font-heading:      ${pair.heading};
  --font-body:         ${pair.body};
  --font-size-base:    ${t.baseFontSize ?? '16px'};
  --font-size-h1:      ${t.h1 ?? '56px'};
  --font-size-h2:      ${t.h2 ?? '40px'};
  --font-size-h3:      ${t.h3 ?? '28px'};
  --line-height:       ${t.lineHeight ?? '1.6'};
  --letter-spacing:    ${t.letterSpacing ? t.letterSpacing + 'px' : '0px'};

  /* ── Spacing & Layout ──────────────────────── */
  --section-padding:    ${s.sectionPadding ?? '80'}px;
  --container-width:    ${s.containerMaxWidth ?? '1200'}px;
  --card-gap:           ${s.cardGap ?? '24'}px;
  --radius-button:      ${theme?.borderRadius ?? s.buttonRadius ?? '4px'};
  --radius-card:        ${theme?.borderRadius ?? s.cardRadius ?? '8px'};
  --radius-image:       ${s.imageRadius ?? '4'}px;
  --shadow:             ${shadowVal};

  /* ── Canvas defaults ───────────────────────── */
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: var(--font-size-base);
  line-height: var(--line-height);
}
*, *::before, *::after { box-sizing: border-box; }
img { max-width: 100%; height: auto; }
h1, h2, h3, h4, h5, h6 { font-family: var(--font-heading); letter-spacing: var(--letter-spacing); }
h1 { font-size: var(--font-size-h1); }
h2 { font-size: var(--font-size-h2); }
h3 { font-size: var(--font-size-h3); }
${mode === 'edit' ? 'a, button { pointer-events: none !important; }' : ''}
.omnora-editable-text { pointer-events: auto !important; }
`;
    }, [designSystem, theme, mode, safeTop, safeBottom]);

    useEffect(() => {
        if (styleElRef.current) styleElRef.current.textContent = shadowStyles;
    }, [shadowStyles]);

    // Phase 3: Shadow Event Bridge
    useEffect(() => {
        const root = shadowRootRef.current;
        if (!root) return;
        const handleClick = (e: Event) => {
            const path = (e as MouseEvent).composedPath() as HTMLElement[];
            const target = path.find(el => (el as HTMLElement).dataset?.nodeId);
            if (target) {
                (e as MouseEvent).stopPropagation();
                selectNode((target as HTMLElement).dataset.nodeId!);
            } else {
                selectNode(null);
            }
        };
        root.addEventListener('click', handleClick as EventListener);
        return () => root.removeEventListener('click', handleClick as EventListener);
    }, [isReady, selectNode]);

    return (
        <div ref={hostRef} className="omnora-shadow-host"
            style={{ width: '100%', height: '100%', position: 'relative' }}>
            {isReady && shadowRootRef.current &&
                createPortal(children, shadowRootRef.current as unknown as Element)}
        </div>
    );
};

// ─── Device Chrome ────────────────────────────────────────────────────────────
const DeviceChrome: React.FC<{
    preset: ReturnType<typeof getPreset>;
    orientation: 'portrait' | 'landscape';
    w: number;
    h: number;
    children: React.ReactNode;
}> = ({ preset, orientation, w, h, children }) => {
    const isPhone = preset.category === 'phone';
    const isTablet = preset.category === 'tablet';

    const borderRadius = isPhone ? '44px' : isTablet ? '24px' : '8px';
    const borderWidth = isPhone ? '10px' : isTablet ? '16px' : '0px';
    const borderColor = '#0d0d0e';
    const sideButtonColor = '#1a1a1b';

    return (
        <div style={{
            position: 'relative',
            display: 'inline-block',
            width: `${w}px`,
            height: `${h}px`,
        }}>
            {/* Outer frame */}
            <div style={{
                position: 'absolute',
                inset: `-${borderWidth}`,
                background: borderColor,
                borderRadius: `calc(${borderRadius} + ${borderWidth})`,
                boxShadow: '0 0 0 1.5px #222, 0 40px 80px -20px rgba(0,0,0,0.8), inset 0 0 0 0.5px rgba(255,255,255,0.07)',
                zIndex: 0,
                pointerEvents: 'none',
            }} />

            {/* Side buttons — only phones */}
            {isPhone && orientation === 'portrait' && <>
                {/* Volume buttons — left */}
                {[40, 80, 110].map((top, i) => (
                    <div key={i} style={{ position: 'absolute', left: `-${borderWidth}`, top: `${top}px`, width: borderWidth, height: '28px', background: sideButtonColor, borderRadius: '3px 0 0 3px', zIndex: 2, pointerEvents: 'none' }} />
                ))}
                {/* Power button — right */}
                <div style={{ position: 'absolute', right: `-${borderWidth}`, top: '90px', width: borderWidth, height: '48px', background: sideButtonColor, borderRadius: '0 3px 3px 0', zIndex: 2, pointerEvents: 'none' }} />
            </>}

            {/* Notch / Dynamic Island */}
            {isPhone && orientation === 'portrait' && (
                preset.hasDynamicIsland ? (
                    <div style={{
                        position: 'absolute', top: '14px',
                        left: '50%', transform: 'translateX(-50%)',
                        width: '120px', height: '34px',
                        background: '#000', borderRadius: '20px',
                        zIndex: 10, pointerEvents: 'none',
                        boxShadow: '0 0 0 1px rgba(255,255,255,0.04)',
                    }} />
                ) : preset.hasNotch ? (
                    <div style={{
                        position: 'absolute', top: 0,
                        left: '50%', transform: 'translateX(-50%)',
                        width: '160px', height: '28px',
                        background: borderColor, borderRadius: '0 0 18px 18px',
                        zIndex: 10, pointerEvents: 'none',
                    }} />
                ) : null
            )}

            {/* Home indicator (iPhone) */}
            {isPhone && orientation === 'portrait' && (
                <div style={{
                    position: 'absolute',
                    bottom: '8px', left: '50%', transform: 'translateX(-50%)',
                    width: '130px', height: '5px',
                    background: 'rgba(255,255,255,0.25)',
                    borderRadius: '3px',
                    zIndex: 10, pointerEvents: 'none',
                }} />
            )}

            {/* Canvas content */}
            <div style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                borderRadius,
                overflow: 'hidden',
                zIndex: 1,
                background: '#030304',
            }}>
                {children}
            </div>
        </div>
    );
};

// ─── Safe Area Overlay ────────────────────────────────────────────────────────
const SafeAreaOverlay: React.FC<{ safeTop: number; safeBottom: number; w: number; h: number }> = ({ safeTop, safeBottom, w, h }) => (
    <>
        {safeTop > 0 && (
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: `${safeTop}px`,
                background: 'rgba(197,160,89,0.08)', borderBottom: '1px dashed rgba(197,160,89,0.4)',
                zIndex: 20, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <span style={{ fontSize: '7px', color: '#C5A059', fontWeight: 900, letterSpacing: '0.1em' }}>SAFE AREA TOP — {safeTop}px</span>
            </div>
        )}
        {safeBottom > 0 && (
            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: `${safeBottom}px`,
                background: 'rgba(197,160,89,0.06)', borderTop: '1px dashed rgba(197,160,89,0.3)',
                zIndex: 20, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <span style={{ fontSize: '7px', color: '#C5A059', fontWeight: 900, letterSpacing: '0.1em' }}>HOME INDICATOR — {safeBottom}px</span>
            </div>
        )}
    </>
);

// ─── Ruler Bar ────────────────────────────────────────────────────────────────
const RulerBar: React.FC<{ w: number; label: string }> = ({ w, label }) => (
    <div style={{
        height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', marginBottom: '10px', flexShrink: 0,
    }}>
        <div style={{ position: 'absolute', left: 0, right: 0, height: '1px', background: 'rgba(255,255,255,0.04)' }} />
        {/* Tick marks */}
        {[0, 25, 50, 75, 100].map(pct => (
            <div key={pct} style={{
                position: 'absolute', left: `${pct}%`, top: '50%', transform: 'translate(-50%, -50%)',
                height: pct === 50 ? '12px' : '6px', width: '1px',
                background: pct === 50 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
            }} />
        ))}
        <span style={{
            background: '#0a0a0b', border: '1px solid #1a1a1b', borderRadius: '5px',
            padding: '3px 10px', fontSize: '8px', fontWeight: 900, color: '#555',
            letterSpacing: '0.1em', position: 'relative', zIndex: 1,
        }}>
            {label} — {w}px WIDE
        </span>
    </div>
);

// ─── Fold Marker ─────────────────────────────────────────────────────────────
const FoldMarker: React.FC<{ h: number }> = ({ h }) => (
    <div style={{
        position: 'absolute', left: 0, right: 0, top: `${h}px`,
        height: '1px', background: 'rgba(197,160,89,0.3)',
        zIndex: 30, pointerEvents: 'none',
    }}>
        <div style={{
            position: 'absolute', right: '8px', top: '-9px',
            fontSize: '7px', color: '#C5A059', fontWeight: 900, letterSpacing: '0.08em',
            background: 'rgba(197,160,89,0.1)', padding: '2px 6px', borderRadius: '3px',
            border: '1px solid rgba(197,160,89,0.2)',
        }}>
            ↑ ABOVE THE FOLD ({h}px)
        </div>
    </div>
);

// ─── Main LiveCanvas ──────────────────────────────────────────────────────────
// ─── Render Engine ────────────────────────────────────────────────────────────
/**
 * RenderTree: Enforces OS.IDENTITY by keeping the same component instances
 * across mode transitions. 
 */
const RenderTree: React.FC<{ blocks: string[] }> = React.memo(({ blocks }) => {
    return <DynamicSection blocks={blocks} />;
});

// ─── Main LiveCanvas ──────────────────────────────────────────────────────────
export const LiveCanvas: React.FC = () => {
    const {
        mode, designSystem, theme, activePageId, pageLayouts,
        devicePreset, orientation, zoomLevel, showDeviceFrame, showSafeAreaOverlay,
    } = useBuilder();

    const containerRef = useRef<HTMLDivElement>(null);
    const [containerH, setContainerH] = useState(800);
    const [containerW, setContainerW] = useState(1200);

    // Track container size for "fit" zoom
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const ro = new ResizeObserver(entries => {
            if (!entries[0]) return;
            const { width, height } = entries[0].contentRect;
            setContainerW(width);
            setContainerH(height);
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const preset = useMemo(() => getPreset(devicePreset), [devicePreset]);

    // Device pixel dimensions (swap on landscape)
    const rawW = orientation === 'landscape' ? preset.h : preset.w;
    const rawH = orientation === 'landscape' ? preset.w : preset.h;

    // Compute actual scale
    const scale = useMemo(() => {
        if (mode === 'preview') return 1;
        if (preset.category === 'desktop') return 1;
        if (zoomLevel === -1) {
            const fitH = (containerH - 80) / rawH;
            const fitW = (containerW - 60) / rawW;
            return Math.min(fitH, fitW, 1);
        }
        return zoomLevel / 100;
    }, [zoomLevel, rawH, rawW, containerH, containerW, mode, preset.category]);

    const safeTop = orientation === 'portrait' ? (preset.safeTop ?? 0) : 0;
    const safeBottom = orientation === 'portrait' ? (preset.safeBottom ?? 0) : 0;

    const blocks = useMemo(() => pageLayouts[activePageId] || [], [pageLayouts, activePageId]);

    const isEdit = mode === 'edit';
    const isPhone = preset.category === 'phone';
    const isTablet = preset.category === 'tablet';
    const needsFrame = (isPhone || isTablet) && showDeviceFrame && isEdit;

    // Actual canvas display area
    const canvasDisplayW = preset.category === 'desktop' ? (isEdit ? Math.min(rawW, containerW - 48) : '100%') : rawW;
    const canvasDisplayH = rawH;

    const viewportLabel = preset.category === 'desktop'
        ? preset.name
        : `${preset.name} ${orientation === 'landscape' ? '(Landscape)' : '(Portrait)'}`;

    // ── Unified Rendering Pipeline ──────────────────────────────────────────
    /**
     * OS.STABILITY: This render block is preserved across all mode/frame transitions.
     * We use conditional styles instead of conditional component branches to prevent unmounting.
     */
    const CanvasCore = (
        <div
            style={{
                width: typeof canvasDisplayW === 'number' ? `${canvasDisplayW}px` : canvasDisplayW,
                minHeight: isEdit ? (preset.category === 'desktop' ? '85vh' : `${canvasDisplayH}px`) : '100vh',
                background: '#030304',
                borderRadius: isEdit ? (isPhone ? (needsFrame ? '44px' : '32px') : isTablet ? '20px' : '12px') : 0,
                overflow: 'hidden',
                position: 'relative',
                transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)',
                boxShadow: (isEdit && !needsFrame) ? '0 60px 120px -30px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.03)' : 'none',
                zIndex: 1,
            }}
        >
            <ShadowHost designSystem={designSystem} theme={theme} mode={mode} safeTop={safeTop} safeBottom={safeBottom}>
                <RenderTree blocks={blocks} />
            </ShadowHost>
            {isEdit && <CanvasOverlay />}
            {showSafeAreaOverlay && isEdit && <SafeAreaOverlay safeTop={safeTop} safeBottom={safeBottom} w={typeof canvasDisplayW === 'number' ? canvasDisplayW : 1200} h={canvasDisplayH} />}
            {(isPhone || isTablet) && isEdit && <FoldMarker h={canvasDisplayH} />}
        </div>
    );

    return (
        <div
            ref={containerRef}
            className={`canvas-frame ${isEdit ? '' : 'mode-preview'}`}
            style={{
                flex: 1,
                background: isEdit ? '#000' : '#030304',
                overflowX: 'hidden',
                overflowY: 'auto',
                padding: isEdit ? (preset.category === 'desktop' ? '24px 24px' : '24px') : 0,
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
            }}
        >
            {/* Ruler — Edit only */}
            {isEdit && (
                <div style={{ width: '100%', maxWidth: `${containerW - 48}px` }}>
                    <RulerBar w={rawW} label={viewportLabel} />
                </div>
            )}

            {/* Scaled canvas wrapper */}
            <div style={{
                transform: (isEdit && scale !== 1) ? `scale(${scale})` : undefined,
                transformOrigin: 'top center',
                willChange: (isEdit && scale !== 1) ? 'transform' : undefined,
                transition: 'transform 0.4s cubic-bezier(0.16,1,0.3,1)',
                flexShrink: 0,
                width: isEdit ? 'auto' : '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginBottom: (isEdit && scale !== 1) ? `${(canvasDisplayH * scale) - canvasDisplayH}px` : undefined,
            }}>
                {needsFrame ? (
                    <DeviceChrome preset={preset} orientation={orientation} w={canvasDisplayW as number} h={canvasDisplayH}>
                        {CanvasCore}
                    </DeviceChrome>
                ) : CanvasCore}
            </div>

            {/* Health Overlay — Dev Edit only */}
            {isEdit && <BuilderHealthOverlay />}

            <style>{`
                .canvas-frame::-webkit-scrollbar { width: 4px; }
                .canvas-frame::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
                .canvas-frame::-webkit-scrollbar-track { background: transparent; }
                .canvas-frame.mode-preview::-webkit-scrollbar { display: none; }
            `}</style>
        </div>
    );
};
