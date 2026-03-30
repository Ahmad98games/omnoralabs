import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { SmartSidebar } from '../cms/SmartSidebar';
import { LiveCanvas } from '../cms/LiveCanvas';
import { ElementLibrary } from '../cms/ElementLibrary';
import { BuilderToolbar } from '../cms/BuilderToolbar';
import { useBuilderStore } from '../../stores/useBuilderStore';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// 🛡️ standard React ErrorBoundary for catching inner Canvas/Hydrating crashes
interface ErrorBoundaryProps {
    navigate: ReturnType<typeof useNavigate>; // NavigateFunction from react-router-dom
    lastValidPageId: string | null;
    children: React.ReactNode;
}

class BuilderLayoutErrorBoundary extends React.Component<
    ErrorBoundaryProps, 
    { hasError: boolean; errorMessage: string | null }
> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, errorMessage: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, errorMessage: error.message };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('[BuilderCrash]', {
            message: error.message,
            componentStack: info.componentStack,
            activePageId: useBuilderStore.getState().activePageId,
        });
        useBuilderStore.getState().setPublishError(
            'A layout error occurred. Your work has been preserved.'
        );
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    padding: '40px',
                    width: '100%',
                    background: 'var(--obsidian-bg)',
                    color: 'white',
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    zIndex: 9999
                }}>
                        <div style={{
                            background: 'var(--surface-high)',
                            border: '1px solid var(--border-low)',
                            borderRadius: '16px',
                            padding: '40px',
                            maxWidth: '520px',
                            width: '100%',
                            textAlign: 'center',
                        }}>
                        <div style={{
                            fontSize: '10px',
                            color: 'var(--accent-gold)',
                            letterSpacing: '0.15em',
                            textTransform: 'uppercase',
                            marginBottom: '16px',
                            fontWeight: 900,
                        }}>
                            Builder State Discrepancy
                        </div>
                        <h3 style={{
                            color: '#fff',
                            fontSize: '20px',
                            fontWeight: 900,
                            marginBottom: '12px',
                            letterSpacing: '-0.02em'
                        }}>
                            Vault Access Interrupted
                        </h3>
                        <p style={{
                            color: 'var(--text-ghost)',
                            fontSize: '13px',
                            lineHeight: 1.6,
                            marginBottom: '24px',
                        }}>
                            The builder engine encountered an unexpected render cycle. 
                            Your work manifests have been cached in the session vault.
                        </p>
                        <p style={{
                            color: 'var(--text-tertiary, #52565E)',
                            fontSize: '11px',
                            fontFamily: 'monospace',
                            background: 'rgba(0,0,0,0.3)',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            marginBottom: '24px',
                            textAlign: 'left',
                            wordBreak: 'break-all',
                        }}>
                            {this.state.errorMessage || 'Internal Sync Failure'}
                        </p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <button
                                onClick={() => {
                                    this.setState({ hasError: false, errorMessage: null });
                                }}
                                style={{
                                    padding: '8px 16px',
                                    background: 'var(--surface-3, #1C1E21)',
                                    border: '1px solid var(--border-medium, #2A2D31)',
                                    borderRadius: '8px',
                                    color: 'var(--text-primary, #F2F3F5)',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                }}
                            >
                                Retry Component
                            </button>
                            <button
                                onClick={() => {
                                    localStorage.clear();
                                    window.location.reload();
                                }}
                                style={{
                                    padding: '8px 16px',
                                    background: 'transparent',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: '8px',
                                    color: '#EF4444',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                }}
                            >
                                Hard Reset
                            </button>
                        </div>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

const BuilderLayoutContent: React.FC = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const isMobileSheet = window.innerWidth < 768; // Derived state to avoid setState warning if not needed reactively
    const isSidebarOpenGlobal = useBuilderStore(state => state.isSidebarOpen);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [snapIndex, setSnapIndex] = useState(1); // 0=hidden, 1=40%, 2=90%
    
    const [isZombie, setIsZombie] = useState(false);
    
    const libraryOpen = isSidebarOpenGlobal;
    const setLibraryOpen = (val: boolean | ((prev: boolean) => boolean)) => {
        const nextVal = typeof val === 'function' ? val(useBuilderStore.getState().isSidebarOpen) : val;
        useBuilderStore.getState().setSidebarOpen(nextVal);
    };
    const activePageId = useBuilderStore(state => state.activePageId);
    const [lastValidPageId, setLastValidPageId] = useState<'home' | string>(activePageId || 'home');

    // 👁️ Preview Sync States
    const isPreviewMode = useBuilderStore(state => state.isPreviewMode);
    const previewDevice = useBuilderStore(state => state.previewDevice);
    const nodes = useBuilderStore(state => state.nodes);
    const iframeRef = React.useRef<HTMLIFrameElement>(null);

    // 👁️ Live Preview postMessage Dispatcher (Debounced 300ms)
    useEffect(() => {
        if (!isPreviewMode) return;
        const nodesVersion = JSON.stringify(nodes).length; 
        const timer = setTimeout(() => {
            if (iframeRef.current?.contentWindow) {
                console.log('[Preview] Dispatching sync at version:', nodesVersion);
                iframeRef.current.contentWindow.postMessage(
                    { type: 'OMNORA_PREVIEW_UPDATE', nodes, activePageId },
                    window.location.origin
                );
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [nodes, isPreviewMode, activePageId]);

    // 🛡️ Page Switch Guard & Safety Net
    useEffect(() => {
        try {
            if (activePageId && activePageId !== lastValidPageId) {
                // Defer state update to next tick to avoid cascading render warnings
                const timer = setTimeout(() => {
                    setLastValidPageId((prev) => {
                        if (prev !== activePageId) {
                            try { localStorage.setItem('omnora_last_valid_page', activePageId); } catch (e) { console.warn(e); }
                            return activePageId;
                        }
                        return prev;
                    });
                }, 0);
                return () => clearTimeout(timer);
            }
        } catch (e) {
            console.error('[BuilderLayout] Page Switch Failure caught:', e);
            useBuilderStore.getState().setIsHydrating(false);
        }
    }, [activePageId, lastValidPageId]);
    
    // 🛡️ Auto-select first page if none selected
    const pages = useBuilderStore(state => state.pages);
    const setActivePageId = useBuilderStore(state => state.setActivePageId);

    useEffect(() => {
        const pageIds = Object.keys(pages || {});
        if (pageIds.length > 0 && !activePageId) {
            const pageList = Object.values(pages);
            const homePage = pageList.find(p => p.slug === 'home' || p.slug === 'index');
            const firstPage = pageList[0];
            const pageToSelect = homePage || firstPage;
            
            if (pageToSelect) {
                console.log('[BuilderLayout] Auto-selecting active page:', pageToSelect.id);
                // Wrap in a microtask to ensure we don't trigger cascading render error
                Promise.resolve().then(() => {
                    setActivePageId(pageToSelect.id);
                });
            }
        }
    }, [pages, activePageId, setActivePageId]);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        
        // 🛡️ Safe rehydration — only if persist middleware is configured
        const rehydrate = async () => {
            try {
                if (useBuilderStore.persist?.rehydrate) {
                    await useBuilderStore.persist.rehydrate();
                }
            } catch (e) {
                console.error('[BuilderLayout] Hydration failed:', e);
                useBuilderStore.getState().setIsHydrating(false);
            } finally {
                useBuilderStore.getState().setIsHydrating(false);
            }
        };
        rehydrate();

        // 🛡️ Zombie Detection (4s Safety Net)
        const zombieTimer = setTimeout(() => {
            if (useBuilderStore.getState().isHydrating) {
                console.warn('[BuilderLayout] Zombie hydration detected. Forcing clear.');
                setIsZombie(true);
                // We don't force clear yet, let the user decide via UI
            }
        }, 4000);

        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(zombieTimer);
        };
    }, []);

    // ── Not-Supported Guard Removed ───────────────────────────────────────
    // Enabled full-width Canvas for viewports < 768px natively.

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}>
            {/* 🧟 Zombie State UI Overlay */}
            <AnimatePresence>
                {isZombie && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ 
                            position: 'fixed', inset: 0, zIndex: 1000, 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                            background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)', padding: '24px' 
                        }}
                    >
                        <div style={{ 
                            maxWidth: '400px', width: '100%', background: '#0A0A0A', 
                            border: '1px solid rgba(239, 68, 68, 0.2)', padding: '32px', 
                            borderRadius: '16px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' 
                        }}>
                            <div style={{ color: '#EF4444', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '16px' }}>
                                [ SYSTEM_ZOMBIE_STATE ]
                            </div>
                            <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>Hydration Synchronicity Failed</h2>
                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '32px', lineHeight: '1.5' }}>
                                The persistence engine is hanging. This usually happens if the local state schema 
                                conflicts with the current kernel version.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <button 
                                    onClick={() => {
                                        useBuilderStore.getState().setIsHydrating(false);
                                        setIsZombie(false);
                                    }}
                                    style={{ 
                                        width: '100%', padding: '12px', background: 'white', color: 'black', 
                                        fontWeight: 'bold', fontSize: '14px', borderRadius: '12px', cursor: 'pointer', border: 'none' 
                                    }}
                                >
                                    Force Bypass Hydration
                                </button>
                                <button 
                                    onClick={() => {
                                        localStorage.clear();
                                        window.location.reload();
                                    }}
                                    style={{ 
                                        width: '100%', padding: '12px', background: 'transparent', 
                                        border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', 
                                        fontWeight: 500, fontSize: '12px', borderRadius: '12px', cursor: 'pointer' 
                                    }}
                                >
                                    Hard Reset (Purge Local Sync)
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Toolbar always on top (Z-INDEX 100) */}
            <div style={{ zIndex: 100 }}>
                <BuilderToolbar onToggleLibrary={() => setLibraryOpen(o => !o)} libraryOpen={libraryOpen} />
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
                
                {/* Element Library (Z-INDEX 85) */}
                <div style={{ 
                    zIndex: 85,
                    width: libraryOpen ? '280px' : '0px',
                    overflow: 'hidden',
                    transition: 'width 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                    flexShrink: 0,
                    borderRight: libraryOpen ? '1px solid var(--border-subtle, #27272a)' : 'none'
                }}>
                    <ElementLibrary isOpen={libraryOpen} onClose={() => setLibraryOpen(false)} />
                </div>

                {/* Main Canvas Area (Z-INDEX 10) */}
                <div style={{ 
                    flex: isPreviewMode ? '1 1 50%' : 1, 
                    overflow: 'hidden', 
                    position: 'relative', 
                    display: 'flex', 
                    flexDirection: 'column',
                    zIndex: 10,
                    minWidth: isPreviewMode && !isMobile ? '480px' : 'auto',
                    borderRight: isPreviewMode && !isMobile ? '1px solid #27272a' : 'none',
                    transition: 'all 0.3s ease',
                    width: '100%'
                }}>
                    {isMobile && (
                        <button 
                            onClick={() => setIsSidebarOpen(true)}
                            style={{ 
                                position: 'absolute', 
                                right: 16, 
                                bottom: 16, // Moved to bottom for thumb reachability
                                zIndex: 80, 
                                background: 'rgba(18,18,20,0.85)', 
                                backdropFilter: 'blur(8px)',
                                border: '1px solid rgba(255,255,255,0.05)', 
                                padding: '12px 16px', 
                                borderRadius: '14px', 
                                cursor: 'pointer', 
                                color: '#D4AF37',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '13px',
                                fontWeight: 'bold',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                            }}
                        >
                            <Menu size={16} /> Edit Props
                        </button>
                    )}
                    <LiveCanvas />
                </div>

                {/* 👁️ Live Preview IFrame Area (Z-INDEX 10) */}
                {isPreviewMode && (
                    <div style={{ 
                        flex: 1, 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        background: '#09090b', 
                        overflow: 'hidden',
                        zIndex: 10
                    }}>
                        <iframe 
                            ref={iframeRef}
                            src={`/?preview=true`} 
                            style={{ 
                                width: previewDevice === 'mobile' ? '375px' : previewDevice === 'tablet' ? '768px' : '100%', 
                                height: '100%', 
                                border: 'none',
                                background: '#050508',
                                transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                boxShadow: '0 10px 50px rgba(0,0,0,0.6)'
                            }} 
                        />
                    </div>
                )}

                {/* SmartSidebar (Z-INDEX 90 / 200) */}
                {isMobileSheet ? (
                    <AnimatePresence>
                        {isSidebarOpen && (
                            <>
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => { setIsSidebarOpen(false); setSnapIndex(1); }}
                                    style={{ 
                                        position: 'fixed', inset: 0, 
                                        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', 
                                        zIndex: 199 
                                    }} 
                                />
                                <motion.div
                                    initial={{ y: '100%' }}
                                    animate={{ y: snapIndex === 0 ? '100%' : `${100 - (snapIndex === 1 ? 40 : 90)}%` }}
                                    exit={{ y: '100%' }}
                                    transition={{ type: 'spring', damping: 22, stiffness: 200 }}
                                    drag="y"
                                    dragConstraints={{ top: 0, bottom: 0 }}
                                    dragElastic={0.15}
                                    onDragEnd={(e, info) => {
                                         if (info.offset.y > 120) {
                                              if (snapIndex === 2) setSnapIndex(1);
                                              else { setSnapIndex(0); setIsSidebarOpen(false); }
                                         } else if (info.offset.y < -120) {
                                              if (snapIndex === 1) setSnapIndex(2);
                                         }
                                    }}
                                    style={{
                                        position: 'fixed', bottom: 0, left: 0, right: 0,
                                        height: '90vh', background: '#09090b', borderTop: '1px solid #1c1c1f',
                                        borderRadius: '24px 24px 0 0', zIndex: 200, padding: '12px 0 0',
                                        boxShadow: '0 -15px 50px rgba(0,0,0,0.7)', overflow: 'hidden',
                                        display: 'flex', flexDirection: 'column'
                                    }}
                                >
                                     {/* Drag Handle trigger */}
                                     <div style={{ width: 45, height: 5, background: '#27272a', borderRadius: 3, margin: '0 auto 16px', cursor: 'grab', flexShrink: 0 }} />
                                     <div style={{ flex: 1, overflowY: 'auto' }}>
                                          <SmartSidebar />
                                     </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                ) : (
                    <div style={{ zIndex: 90 }}>
                        <SmartSidebar />
                    </div>
                )}
            </div>
        </div>
    );
};

export const BuilderLayout: React.FC = () => {
    const navigate = useNavigate();
    const lastValidPageId = (useBuilderStore.getState() as unknown as { lastValidPageId?: string | null }).lastValidPageId 
        || localStorage.getItem('omnora_last_valid_page') 
        || null;

    return (
        <BuilderLayoutErrorBoundary navigate={navigate} lastValidPageId={lastValidPageId}>
            <BuilderLayoutContent />
        </BuilderLayoutErrorBoundary>
    );
};
