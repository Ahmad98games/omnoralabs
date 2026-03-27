import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { SmartSidebar } from '../cms/SmartSidebar';
import { LiveCanvas } from '../cms/LiveCanvas';
import { ElementLibrary } from '../cms/ElementLibrary';
import { BuilderToolbar } from '../cms/BuilderToolbar';
import { useBuilderStore } from '../../stores/useBuilderStore';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// 🛡️ standard React ErrorBoundary for catching inner Canvas/Hydrating crashes
interface ErrorBoundaryProps {
    navigate: any; // NavigateFunction from react-router-dom
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
                    minHeight: '100vh', display: 'flex', flexDirection: 'column', 
                    alignItems: 'center', justifyContent: 'center', 
                    background: '#09090b', color: '#fff', padding: 24, textAlign: 'center' 
                }}>
                    <div style={{ padding: '24px', background: 'var(--surface-raised, #121214)', border: '1px solid var(--border-subtle, #27272a)', borderRadius: '16px', maxWidth: '280px', margin: '0 auto' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#ef4444' }}>⚠️ Layout Crashed</h2>
                        <p style={{ color: '#a1a1aa', fontSize: '13px', lineHeight: '1.5', marginBottom: '2rem' }}>
                            We encountered a fatal error rendering this page section. Choose an escape action to restore order.
                        </p>
                        <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
                            <button 
                                onClick={() => {
                                    const { navigate, lastValidPageId } = this.props;
                                    if (lastValidPageId) {
                                        navigate(`/builder/${lastValidPageId}`, { replace: true });
                                    } else {
                                        navigate('/builder', { replace: true });
                                    }
                                    this.setState({ hasError: false, errorMessage: null });
                                }} 
                                style={{ width: '100%', padding: '12px', background: 'transparent', borderRadius: 10, fontSize: '12px', fontWeight: 600, color: 'var(--text-primary, #fff)', cursor: 'pointer', border: '1px solid var(--border-subtle, #333)' }}
                            >
                                Go Back to Last Page
                            </button>
                            <button 
                                onClick={() => {
                                    const store = useBuilderStore.getState() as any;
                                    if (store.activePageId && store.resetPageNodes) {
                                        store.resetPageNodes(store.activePageId);
                                    }
                                    this.setState({ hasError: false, errorMessage: null });
                                }} 
                                style={{ width: '100%', padding: '12px', background: 'var(--danger, #dc2626)', borderRadius: 10, fontSize: '12px', fontWeight: 800, color: '#fff', cursor: 'pointer', border: 'none' }}
                            >
                                Clear Page & Start Fresh
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
    const [isMobileSheet, setIsMobileSheet] = useState(window.innerWidth < 768);
    const isSidebarOpenGlobal = useBuilderStore(state => state.isSidebarOpen);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [snapIndex, setSnapIndex] = useState(1); // 0=hidden, 1=40%, 2=90%
    
    const libraryOpen = isSidebarOpenGlobal;
    const setLibraryOpen = (val: boolean | ((prev: boolean) => boolean)) => {
        const nextVal = typeof val === 'function' ? val(useBuilderStore.getState().isSidebarOpen) : val;
        useBuilderStore.getState().setSidebarOpen(nextVal);
    };
    const [continueAnyway, setContinueAnyway] = useState(false);

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
        const timer = setTimeout(() => {
            if (iframeRef.current?.contentWindow) {
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
                setLastValidPageId(activePageId);
                // Persist to localStorage as a safe fallback
                try { localStorage.setItem('omnora_last_valid_page', activePageId); } catch {}
            }
        } catch (e) {
            console.error('[BuilderLayout] Page Switch Failure caught:', e);
            useBuilderStore.getState().setIsHydrating(false);
        }
    }, [activePageId]);
    
    // 🛡️ Auto-select first page if none selected
    const pages = useBuilderStore(state => state.pages);
    const setActivePageId = useBuilderStore(state => state.setActivePageId);

    useEffect(() => {
        const pageCount = Object.keys(pages || {}).length;
        if (pageCount > 0 && !activePageId) {
            const pageList = Object.values(pages);
            const homePage = pageList.find(p => p.slug === 'home' || p.slug === 'index');
            const firstPage = pageList[0];
            const pageToSelect = homePage || firstPage;
            
            if (pageToSelect) {
                console.log('[BuilderLayout] Auto-selecting active page:', pageToSelect.id);
                setActivePageId(pageToSelect.id);
            }
        }
    }, [pages, activePageId, setActivePageId]);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        
        // 🛡️ Safe rehydration — only if persist middleware is configured
        try {
            if (useBuilderStore.persist?.rehydrate) {
                useBuilderStore.persist.rehydrate();
            }
        } catch (e) {
            console.error('[BuilderLayout] Hydration error caught:', e);
        }

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // ── Not-Supported Guard Removed ───────────────────────────────────────
    // Enabled full-width Canvas for viewports < 768px natively.

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}>
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
    const lastValidPageId = (useBuilderStore.getState() as any).lastValidPageId 
        || localStorage.getItem('omnora_last_valid_page') 
        || null;

    return (
        <BuilderLayoutErrorBoundary navigate={navigate} lastValidPageId={lastValidPageId}>
            <BuilderLayoutContent />
        </BuilderLayoutErrorBoundary>
    );
};
