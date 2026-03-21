import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { SmartSidebar } from '../cms/SmartSidebar';
import { LiveCanvas } from '../cms/LiveCanvas';
import { ElementLibrary } from '../cms/ElementLibrary';
import { BuilderToolbar } from '../cms/BuilderToolbar';

export const BuilderLayout: React.FC = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [libraryOpen, setLibraryOpen] = useState(false);
    const [continueAnyway, setContinueAnyway] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // ── Not-Supported Guard ───────────────────────────────────────────────
    if (window.innerWidth < 768 && !continueAnyway) {
        return (
            <div style={{ 
                minHeight: '100vh', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                background: '#09090b', 
                color: '#fff', 
                padding: 24, 
                textAlign: 'center' 
            }}>
                <div style={{ padding: '24px', background: '#121214', border: '1px solid #27272a', borderRadius: '16px', maxWidth: '400px' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#facc15' }}>Omnora Optimized</h2>
                    <p style={{ color: '#a1a1aa', fontSize: '13px', lineHeight: '1.5', marginBottom: '2rem' }}>
                        The Builder is best experienced on Desktop for visual accuracy. Switch to Preview Mode or Continue Anyway.
                    </p>
                    <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
                        <button 
                            onClick={() => window.open('/preview', '_blank')} 
                            style={{ width: '100%', padding: '12px', background: '#27272a', borderRadius: 10, fontSize: '12px', fontWeight: 600, color: '#fff', cursor: 'pointer', border: 'none' }}
                        >
                            Switch to Preview Mode
                        </button>
                        <button 
                            onClick={() => setContinueAnyway(true)} 
                            style={{ width: '100%', padding: '12px', background: 'var(--accent-gold, #D4AF37)', borderRadius: 10, fontSize: '12px', fontWeight: 800, color: '#000', cursor: 'pointer', border: 'none' }}
                        >
                            Continue Anyway
                        </button>
                    </div>
                </div>
            </div>
        );
    }

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
                    flex: 1, 
                    overflow: 'hidden', 
                    position: 'relative', 
                    display: 'flex', 
                    flexDirection: 'column',
                    zIndex: 10 
                }}>
                    {isMobile && (
                        <button 
                            onClick={() => setIsSidebarOpen(true)}
                            style={{ 
                                position: 'absolute', 
                                right: 16, 
                                top: 16, 
                                zIndex: 80, 
                                background: 'rgba(18,18,20,0.85)', 
                                backdropFilter: 'blur(8px)',
                                border: '1px solid rgba(255,255,255,0.05)', 
                                padding: '10px 14px', 
                                borderRadius: '10px', 
                                cursor: 'pointer', 
                                color: '#D4AF37',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
                            }}
                        >
                            <Menu size={16} /> Layers
                        </button>
                    )}
                    <LiveCanvas />
                </div>

                {/* SmartSidebar (Z-INDEX 90) */}
                {isMobile ? (
                    <>
                        {isSidebarOpen && (
                            <div 
                                onClick={() => setIsSidebarOpen(false)}
                                style={{ 
                                    position: 'fixed', 
                                    inset: 0, 
                                    background: 'rgba(0,0,0,0.4)', 
                                    backdropFilter: 'blur(4px)', 
                                    WebkitBackdropFilter: 'blur(4px)',
                                    zIndex: 89 
                                }} 
                            />
                        )}
                        <div style={{
                            position: 'fixed', 
                            right: 0, 
                            top: 0, 
                            bottom: 0,
                            transform: isSidebarOpen ? 'translateX(0)' : 'translateX(100%)',
                            transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                            zIndex: 90,
                            width: '340px'
                        }}>
                            {isSidebarOpen && (
                                <button 
                                    onClick={() => setIsSidebarOpen(false)}
                                    style={{ 
                                        position: 'absolute', 
                                        left: -40, 
                                        top: 16, 
                                        background: '#121214', 
                                        border: '1px solid rgba(255,255,255,0.05)', 
                                        padding: 8, 
                                        borderRadius: '8px 0 0 8px', 
                                        color: '#fff',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <X size={16} />
                                </button>
                            )}
                            <SmartSidebar />
                        </div>
                    </>
                ) : (
                    <div style={{ zIndex: 90 }}>
                        <SmartSidebar />
                    </div>
                )}
            </div>
        </div>
    );
};
