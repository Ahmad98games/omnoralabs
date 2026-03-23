import React, { useEffect, useRef, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useBuilder } from '../../context/BuilderContext';
import { CanvasOverlay } from './CanvasOverlay';
import { BuilderHealthOverlay } from './BuilderHealthOverlay';
import { getPreset } from './DevicePresetPanel';
import { useGlobalThemeStore, toCSSVariables } from '../../stores/useGlobalThemeStore';
import { SafeRenderer } from './SafeRenderer';

// 🛡️ Read nodes directly from Zustand — pageLayouts from BuilderContext
// is a separate legacy data path that is often empty, causing the black canvas.
import { useBuilderStore } from '../../stores/useBuilderStore';

// ─── One-time keyframe injection ──────────────────────────────────────────────
(function injectLiveCanvasKf() {
  if (typeof document === 'undefined' || document.getElementById('omnora-lc-kf')) return;
  const s = document.createElement('style');
  s.id = 'omnora-lc-kf';
  s.textContent = `
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes dropIn {
      from { opacity: 0; transform: translateY(15px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .dropped-block { animation: dropIn 0.2s cubic-bezier(0,0,0.2,1) !important; }
  `;
  document.head.appendChild(s);
})();

// ─── Loading Spinner ──────────────────────────────────────────────────────────
const LoadingSpinner = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100vh', width: '100%', background: '#030304', color: '#fff',
  }}>
    <div style={{
      width: 32, height: 32,
      border: '3px solid #1a1a1a',
      borderTopColor: '#FF6B35',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }} />
  </div>
);
const ShadowHost: React.FC<{
  children: React.ReactNode;
  designSystem: any;
  mode: string;
  safeTop?: number;
  safeBottom?: number;
}> = ({ children, designSystem, mode, safeTop = 0, safeBottom = 0 }) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const globalTheme = useGlobalThemeStore();
  const shadowRootRef = useRef<ShadowRoot | null>(null);
  const [isReady, setIsReady] = useState(false);
  const { selectNode } = useBuilder();

  // 1. Initial Shadow Root Attachment (One time)
  useEffect(() => {
    if (!hostRef.current || shadowRootRef.current) return;
    const root = hostRef.current.attachShadow({ mode: 'open' });
    shadowRootRef.current = root;

    const styleEl = document.createElement('style');
    styleEl.id = 'omnora-shadow-styles';
    root.appendChild(styleEl);
    
    setIsReady(true);
  }, []);

  // 2. Direct CSS Variable Injection (No re-mount flickering)
  useEffect(() => {
    if (!hostRef.current) return;
    const globalVars = toCSSVariables(globalTheme);
    const c = designSystem?.colors ?? {};

    // Apply variables to host style instead of re-writing <style> tag
    Object.entries(globalVars).forEach(([key, value]) => {
      hostRef.current?.style.setProperty(key, value as string);
    });

    // Map internal aliases
    const hostStyle = hostRef.current.style;
    hostStyle.setProperty('--omnora-safe-top', `${safeTop}px`);
    hostStyle.setProperty('--omnora-safe-bottom', `${safeBottom}px`);
    hostStyle.setProperty('--bg-primary', 'var(--omnora-color-bg)');
    hostStyle.setProperty('--accent-primary', 'var(--omnora-color-primary, #FF6B35)');
    hostStyle.setProperty('--text-primary', 'var(--omnora-color-text)');
    
    // Update the base CSS only once or when mode/fonts change
    const styleEl = shadowRootRef.current?.querySelector('#omnora-shadow-styles');
    if (styleEl) {
      styleEl.textContent = `
        :host { 
          display: block; width: 100%; min-height: 100%; 
          background: var(--bg-primary); color: var(--text-primary);
          font-family: var(--omnora-font-body);
        }
        *, *::before, *::after { box-sizing: border-box; }
        img { max-width: 100%; height: auto; }
        ${mode === 'edit' ? 'a, button { pointer-events: none !important; }' : ''}
      `;
    }
  }, [globalTheme, designSystem, mode, safeTop, safeBottom]);

  return (
    <div ref={hostRef} className="omnora-shadow-host" style={{ width: '100%', height: '100%', position: 'relative' }}>
      {isReady && shadowRootRef.current && createPortal(children, shadowRootRef.current as any)}
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

  return (
    <div style={{ position: 'relative', display: 'inline-block', width: `${w}px`, height: `${h}px` }}>
      <div style={{
        position: 'absolute',
        inset: `-${borderWidth}`,
        background: borderColor,
        borderRadius: `calc(${borderRadius} + ${borderWidth})`,
        boxShadow: '0 0 0 1.5px #222, 0 40px 80px -20px rgba(0,0,0,0.8)',
        zIndex: 0,
        pointerEvents: 'none',
      }} />
      {isPhone && orientation === 'portrait' && (
        preset.hasDynamicIsland ? (
          <div style={{
            position: 'absolute', top: '14px', left: '50%', transform: 'translateX(-50%)',
            width: '120px', height: '34px', background: '#000', borderRadius: '20px',
            zIndex: 10, pointerEvents: 'none',
          }} />
        ) : preset.hasNotch ? (
          <div style={{
            position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
            width: '160px', height: '28px', background: borderColor, borderRadius: '0 0 18px 18px',
            zIndex: 10, pointerEvents: 'none',
          }} />
        ) : null
      )}
      {isPhone && orientation === 'portrait' && (
        <div style={{
          position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)',
          width: '130px', height: '5px', background: 'rgba(255,255,255,0.25)',
          borderRadius: '3px', zIndex: 10, pointerEvents: 'none',
        }} />
      )}
      <div style={{
        position: 'relative', width: '100%', height: '100%',
        borderRadius, overflow: 'hidden', zIndex: 1, background: '#030304',
      }}>
        {children}
      </div>
    </div>
  );
};

// ─── Safe Area Overlay ────────────────────────────────────────────────────────
const SafeAreaOverlay: React.FC<{ safeTop: number; safeBottom: number }> = ({ safeTop, safeBottom }) => (
  <>
    {safeTop > 0 && (
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: `${safeTop}px`,
        background: 'rgba(197,160,89,0.08)', borderBottom: '1px dashed rgba(197,160,89,0.4)',
        zIndex: 20, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: '7px', color: '#C5A059', fontWeight: 900 }}>SAFE AREA — {safeTop}px</span>
      </div>
    )}
    {safeBottom > 0 && (
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: `${safeBottom}px`,
        background: 'rgba(197,160,89,0.06)', borderTop: '1px dashed rgba(197,160,89,0.3)',
        zIndex: 20, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: '7px', color: '#C5A059', fontWeight: 900 }}>HOME INDICATOR — {safeBottom}px</span>
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
      fontSize: '7px', color: '#C5A059', fontWeight: 900,
      background: 'rgba(197,160,89,0.1)', padding: '2px 6px', borderRadius: '3px',
    }}>
      ↑ ABOVE THE FOLD ({h}px)
    </div>
  </div>
);

// ─── Canvas Error Boundary ────────────────────────────────────────────────────
class CanvasErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[Omnora Canvas Crash]', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px', textAlign: 'center', background: '#1a0505',
          color: '#ff6b6b', borderRadius: '12px', border: '1px solid #ff4444',
          margin: '20px', fontFamily: 'monospace',
        }}>
          <h3 style={{ margin: '0 0 10px 0' }}>⚠️ Canvas Render Failure</h3>
          <p style={{ fontSize: '12px', opacity: 0.8 }}>{this.state.error?.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              marginTop: '12px', padding: '8px 16px', background: '#FF6B35',
              color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Main LiveCanvas ──────────────────────────────────────────────────────────
export const LiveCanvas: React.FC = () => {
  const {
    isLoading, mode, designSystem, theme,
    devicePreset, orientation, zoomLevel,
    showDeviceFrame, showSafeAreaOverlay,
  } = useBuilder();

  // 🛡️ THE FIX: Read activePageId and nodes directly from Zustand.
  // BuilderContext.pageLayouts is a legacy path that is frequently empty,
  // which caused the black canvas. Zustand nodes is the live source of truth.
  const activePageId = useBuilderStore(s => s.activePageId);
  const nodes = useBuilderStore(s => s.nodes);
  const isHydrating = useBuilderStore(s => s.isHydrating);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerH, setContainerH] = useState(800);
  const [containerW, setContainerW] = useState(1200);
  const [isMobileScreen, setIsMobileScreen] = useState(window.innerWidth < 1024);
  const [forceRender, setForceRender] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobileScreen(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Force render escape hatch if loading hangs > 5s
  useEffect(() => {
    const timer = setTimeout(() => setForceRender(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  const preset = useMemo(() => getPreset(devicePreset), [devicePreset]);
  const rawW = orientation === 'landscape' ? preset.h : preset.w;
  const rawH = orientation === 'landscape' ? preset.w : preset.h;

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

  // 🛡️ Resolve blocks from Zustand nodes — this is the live builder state.
  // nodes[activePageId] is an array of block IDs or block objects depending
  // on how addNode() stores them. SafeRenderer handles both formats.
  const blocks = useMemo(() => {
    if (!activePageId || !nodes) return [];
    const pageBlocks = nodes[activePageId];
    return Array.isArray(pageBlocks) ? pageBlocks : [];
  }, [nodes, activePageId]);

  const isEdit = mode === 'edit';
  const isPhone = preset.category === 'phone';
  const isTablet = preset.category === 'tablet';
  const needsFrame = (isPhone || isTablet) && showDeviceFrame && isEdit;

  const canvasDisplayW = preset.category === 'desktop'
    ? (isEdit ? Math.min(rawW, containerW - 48) : '100%')
    : rawW;
  const canvasDisplayH = rawH;

  const viewportLabel = preset.category === 'desktop'
    ? preset.name
    : `${preset.name} ${orientation === 'landscape' ? '(Landscape)' : '(Portrait)'}`;

  // Show loading only while hydrating and not timed out
  if (isHydrating && !forceRender) {
    return <LoadingSpinner />;
  }

  const CanvasCore = (
    <div style={{
      width: typeof canvasDisplayW === 'number' ? `${canvasDisplayW}px` : canvasDisplayW,
      minHeight: isEdit
        ? (preset.category === 'desktop' ? '85vh' : `${canvasDisplayH}px`)
        : '100vh',
      // 🛡️ Background is transparent — blocks provide their own backgrounds.
      // Previously #030304 was forcing a black canvas even when blocks rendered.
      background: 'transparent',
      borderRadius: isEdit
        ? (isPhone ? (needsFrame ? '44px' : '32px') : isTablet ? '20px' : '12px')
        : 0,
      overflow: 'hidden',
      position: 'relative',
      transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)',
      boxShadow: (isEdit && !needsFrame)
        ? '0 60px 120px -30px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.03)'
        : 'none',
      zIndex: 1,
    }}>
      <ShadowHost
        designSystem={designSystem}
        theme={theme}
        mode={mode}
        safeTop={safeTop}
        safeBottom={safeBottom}
      >
        <SafeRenderer
          blocks={blocks}
          loading={isLoading && !forceRender}
          isBuilder={isEdit}
        />
      </ShadowHost>
      {isEdit && <CanvasOverlay />}
      {showSafeAreaOverlay && isEdit && (
        <SafeAreaOverlay safeTop={safeTop} safeBottom={safeBottom} />
      )}
      {(isPhone || isTablet) && isEdit && <FoldMarker h={canvasDisplayH} />}
    </div>
  );
// Inside LiveCanvas before return
const isEmpty = blocks.length === 0;

// Inside CanvasCore after ShadowHost
{isEdit && isEmpty && (
  <div style={{
    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', color: '#555', gap: '12px'
  }}>
    <div style={{ fontSize: '24px' }}>🧱</div>
    <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em' }}>
      YOUR CANVAS IS EMPTY
    </p>
    <p style={{ fontSize: '9px', opacity: 0.6 }}>
      Drag an element from the left sidebar to start building.
    </p>
  </div>
)}
  return (
    <CanvasErrorBoundary>
      <div
        ref={containerRef}
        className={`canvas-frame ${isEdit ? '' : 'mode-preview'}`}
        style={{
          flex: 1,
          // 🛡️ Canvas outer background — dark in edit, transparent in preview
          background: isEdit ? '#09090b' : 'transparent',
          overflowX: 'hidden',
          overflowY: 'auto',
          padding: isEdit
            ? (isMobileScreen ? 0 : (preset.category === 'desktop' ? '24px' : '24px'))
            : 0,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: isMobileScreen ? '100vw' : 'auto',
        }}
      >
        {isEdit && (
          <div style={{ width: '100%', maxWidth: `${containerW - 48}px` }}>
            <RulerBar w={rawW} label={viewportLabel} />
          </div>
        )}

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
          marginBottom: (isEdit && scale !== 1)
            ? `${(canvasDisplayH * scale) - canvasDisplayH}px`
            : undefined,
        }}>
          {needsFrame ? (
            <DeviceChrome
              preset={preset}
              orientation={orientation}
              w={canvasDisplayW as number}
              h={canvasDisplayH}
            >
              {CanvasCore}
            </DeviceChrome>
          ) : CanvasCore}
        </div>

        {isEdit && <BuilderHealthOverlay />}

        <style>{`
          .canvas-frame::-webkit-scrollbar { width: 4px; }
          .canvas-frame::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
          .canvas-frame::-webkit-scrollbar-track { background: transparent; }
          .canvas-frame.mode-preview::-webkit-scrollbar { display: none; }
        `}</style>
      </div>
    </CanvasErrorBoundary>
  );
};