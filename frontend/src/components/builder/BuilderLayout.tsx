import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { SmartSidebar } from '../cms/SmartSidebar';
import { LiveCanvas } from '../cms/LiveCanvas';
import { ElementLibrary } from '../cms/ElementLibrary';
import { BuilderToolbar } from '../cms/BuilderToolbar';
import { useBuilderStore } from '../../stores/useBuilderStore';
import { useNavigate } from 'react-router-dom';
import { NewPageInitializer } from '../../platform/kernel/NewPageInitializer';
import { OmnoraBootloader } from '../../platform/kernel/OmnoraBootloader';
import { motion, AnimatePresence } from 'framer-motion';

// 🛡️ standard React ErrorBoundary for catching inner Canvas/Hydrating crashes
class BuilderLayoutErrorBoundary extends React.Component<
    { children: React.ReactNode; onGoBack: () => void; onResetPage: () => void }, 
    { hasError: boolean; error: any }
> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: any) {
        return { hasError: true, error };
    }

    componentDidCatch(error: any, errorInfo: any) {
        console.error('[BuilderLayoutErrorBoundary] Crash caught:', error, errorInfo.componentStack);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ 
                    minHeight: '100vh', display: 'flex', flexDirection: 'column', 
                    alignItems: 'center', justifyContent: 'center', 
                    background: '#09090b', color: '#fff', padding: 24, textAlign: 'center' 
                }}>
                    <div style={{ padding: '24px', background: '#121214', border: '1px solid #7f1d1d', borderRadius: '16px', maxWidth: '400px' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#ef4444' }}>⚠️ Layout Crashed</h2>
                        <p style={{ color: '#a1a1aa', fontSize: '13px', lineHeight: '1.5', marginBottom: '2rem' }}>
                            We encountered a fatal error rendering this page section. Choose an escape action to restore order.
                        </p>
                        <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
                            <button 
                                onClick={this.props.onGoBack} 
                                style={{ width: '100%', padding: '12px', background: '#27272a', borderRadius: 10, fontSize: '12px', fontWeight: 600, color: '#fff', cursor: 'pointer', border: 'none' }}
                            >
                                Go Back to Last Page
                            </button>
                            <button 
                                onClick={this.props.onResetPage} 
                                style={{ width: '100%', padding: '12px', background: '#7f1d1d', borderRadius: 10, fontSize: '12px', fontWeight: 800, color: '#fff', cursor: 'pointer', border: 'none' }}
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
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [snapIndex, setSnapIndex] = useState(1); // 0=hidden, 1=40%, 2=90%
    const [libraryOpen, setLibraryOpen] = useState(false);
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
                // Safely commit new page to tracked valid fallback history 
                setLastValidPageId(activePageId);
                OmnoraBootloader.saveLastValidPageId(activePageId);
            }
        } catch (e) {
            console.error('[BuilderLayout] Page Switch Failure caught:', e);
            // Fallback: Reset state atomically and route back to explicit home builder path
            useBuilderStore.getState().setIsHydrating(false);
            window.location.hash = `/builder/home`; // standard router-independent fallback replace
        }
    }, [activePageId]);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        
        // 🛡️ Spec 4: Manually trigger rehydration inside safe React loop
        try {
            useBuilderStore.persist.rehydrate();
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
                <div style={{ zIndex: 85 }}>
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
    const activePageId = useBuilderStore(state => state.activePageId) || 'home';

    const handleGoBack = () => {
        // Safe Navigate back to standard explicit path to avoid empty backstacks
        navigate(`/builder/home`); // or exact string matching dashboard home templates
    };

    const handleResetPage = () => {
        const state = useBuilderStore.getState();
        const activeId = state.activePageId;
        if (activeId) {
             const blankAST = NewPageInitializer.generateBlankAST();
             useBuilderStore.setState((s: any) => {
                 s.nodes = { ...s.nodes, ...blankAST.nodes };
             });
             // Also notify layout buffers
             window.location.reload(); // Quick reset atomic trigger 
        }
    };

    return (
        <BuilderLayoutErrorBoundary onGoBack={handleGoBack} onResetPage={handleResetPage}>
            <BuilderLayoutContent />
        </BuilderLayoutErrorBoundary>
    );
};
