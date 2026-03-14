import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Save, X, Edit, Sliders, Settings, Layout, DollarSign, Target, CheckCircle2 } from 'lucide-react';
import { useBuilder } from '../../context/BuilderContext';

export default function SovereignWidget() {
    const {
        isBuilderActive, setIsBuilderActive, isPreview,
        selectedNodeId, nodeTree, updateNode,
        designSystem, updateDesignSystem,
        saveDraft, publishLive,
    } = useBuilder();

    const [activeTab, setActiveTab] = useState<'visual' | 'identity' | 'performance'>('visual');
    const panelRef = useRef<HTMLDivElement>(null);
    const shadowHostRef = useRef<HTMLDivElement>(null);
    const [shadowRoot, setShadowRoot] = useState<ShadowRoot | null>(null);

    useEffect(() => {
        if (shadowHostRef.current) {
            if (!shadowHostRef.current.shadowRoot) {
                try {
                    const root = shadowHostRef.current.attachShadow({ mode: 'open' });
                    setShadowRoot(root);
                } catch (err) {
                    console.error('Shadow DOM Attachment Failed:', err);
                }
            } else {
                setShadowRoot(shadowHostRef.current.shadowRoot);
            }
        }
    }, []);


    if (!isPreview) return null;

    const EditorUI = (
        <div className="sovereign-root">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
                
                .sovereign-widget-panel {
                    position: fixed;
                    top: 1.5rem;
                    right: 1.5rem;
                    width: 380px;
                    height: calc(100vh - 3rem);
                    background: rgba(3, 3, 4, 0.9);
                    backdrop-filter: blur(25px) saturate(200%);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 20px;
                    box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 0.8);
                    padding: 2rem;
                    font-family: 'Inter', system-ui, sans-serif;
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    z-index: 2000000000;
                    color: #fff;
                    pointer-events: auto;
                    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }

                .sovereign-header { font-weight: 900; font-size: 0.8rem; color: #fff; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 1rem; display: flex; align-items: center; justify-content: space-between; letter-spacing: 0.1em; text-transform: uppercase; }
                .header-label { display: flex; align-items: center; gap: 0.8rem; }
                .header-label span { color: var(--accent-primary, #C5A059); }

                .tab-row { display: flex; gap: 0.5rem; background: rgba(255,255,255,0.03); padding: 0.3rem; border-radius: 12px; }
                .tab-btn { flex: 1; background: transparent; border: none; padding: 0.6rem; border-radius: 8px; font-size: 0.65rem; font-weight: 700; cursor: pointer; color: rgba(255,255,255,0.4); display: flex; align-items: center; justify-content: center; gap: 0.4rem; transition: all 0.2s; }
                .tab-btn.active { background: rgba(255,255,255,0.05); color: #fff; border: 1px solid rgba(255,255,255,0.1); }
                .tab-btn:hover { color: #fff; }

                .scroll-area { flex: 1; overflow-y: auto; padding-right: 0.5rem; display: flex; flex-direction: column; gap: 1.5rem; }
                .scroll-area::-webkit-scrollbar { width: 4px; }
                .scroll-area::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }

                .field-group { display: flex; flex-direction: column; gap: 0.6rem; }
                .field-group label { font-size: 0.6rem; font-weight: 900; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.1em; }
                .field-input { padding: 0.8rem 1rem; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; font-size: 0.8rem; background: rgba(255,255,255,0.02); transition: all 0.2s; color: #fff; }
                .field-input:focus { border-color: #C5A059; outline: none; background: rgba(255,255,255,0.05); }

                .section-header { font-size: 0.7rem; font-weight: 800; color: #C5A059; margin-top: 1rem; display: flex; align-items: center; gap: 0.5rem; }

                .action-footer { display: flex; flex-direction: column; gap: 0.8rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 1.5rem; }
                .btn-primary { background: #C5A059; color: #000; border: none; padding: 1rem; border-radius: 12px; font-weight: 900; font-size: 0.8rem; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
                .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(197, 160, 89, 0.2); }
                .btn-secondary { background: rgba(255,255,255,0.03); color: #fff; border: 1px solid rgba(255,255,255,0.1); padding: 1rem; border-radius: 12px; font-weight: 700; font-size: 0.8rem; cursor: pointer; transition: all 0.2s; }
                .btn-secondary:hover { background: rgba(255,255,255,0.08); }

                .toggle-trigger {
                    position: fixed;
                    bottom: 2rem;
                    right: 2rem;
                    background: #C5A059;
                    color: #000;
                    border: none;
                    width: 64px;
                    height: 64px;
                    border-radius: 16px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.6);
                    z-index: 2000000000;
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .toggle-trigger:hover { transform: scale(1.1) rotate(5deg); }
                .toggle-trigger.active { transform: scale(0); opacity: 0; }
            `}</style>

            {!isBuilderActive ? (
                <button className="toggle-trigger" onClick={() => setIsBuilderActive(true)}>
                    <Edit size={28} />
                </button>
            ) : (
                <div className="sovereign-widget-panel" ref={panelRef}>
                    <div className="sovereign-header">
                        <div className="header-label">
                            <Sliders size={16} /> <span>SOVEREIGN BUILDER</span>
                        </div>
                        <X size={18} style={{ cursor: 'pointer', opacity: 0.5 }} onClick={() => setIsBuilderActive(false)} />
                    </div>

                    <div className="tab-row">
                        <button className={`tab-btn ${activeTab === 'visual' ? 'active' : ''}`} onClick={() => setActiveTab('visual')}>
                            <Layout size={12} /> LAYOUT
                        </button>
                        <button className={`tab-btn ${activeTab === 'identity' ? 'active' : ''}`} onClick={() => setActiveTab('identity')}>
                            <Settings size={12} /> BRAND
                        </button>
                        <button className={`tab-btn ${activeTab === 'performance' ? 'active' : ''}`} onClick={() => setActiveTab('performance')}>
                            <Target size={12} /> GOALS
                        </button>
                    </div>

                    <div className="scroll-area">
                        {activeTab === 'visual' && selectedNodeId && (() => {
                            const node = nodeTree[selectedNodeId];
                            return node ? (
                                <div className="section-editor animate-fade-in">
                                    <div className="section-header">
                                        <Layout size={14} /> ACTIVE NODE: {node.type.toUpperCase()}
                                    </div>
                                    {node.props && Object.entries(node.props).map(([key, value]: [string, any]) => (
                                        <div className="field-group" key={key}>
                                            <label>{key.replace(/([A-Z])/g, ' $1').toUpperCase()}</label>
                                            <input
                                                className="field-input"
                                                defaultValue={String(value ?? '')}
                                                onChange={(e) => updateNode(selectedNodeId, `props.${key}`, e.target.value)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : null;
                        })()}

                        {activeTab === 'visual' && !selectedNodeId && (
                            <div className="empty-state text-center" style={{ opacity: 0.5, padding: '2rem' }}>
                                <p>Click a block on the canvas to begin editing.</p>
                            </div>
                        )}

                        {activeTab === 'identity' && (
                            <div className="branding-editor animate-fade-in">
                                <div className="field-group">
                                    <label>STORE NAME</label>
                                    <input
                                        className="field-input"
                                        defaultValue={designSystem?.configuration?.name || ''}
                                        onChange={(e) => updateDesignSystem('configuration.name', e.target.value)}
                                    />
                                </div>
                                <div className="field-group">
                                    <label>PRIMARY ACCENT</label>
                                    <input
                                        type="color"
                                        className="field-input"
                                        style={{ height: '50px', padding: '4px' }}
                                        defaultValue={designSystem?.colors?.accentPrimary || '#C5A059'}
                                        onChange={(e) => updateDesignSystem('colors.accentPrimary', e.target.value)}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="action-footer">
                        <button className="btn-primary" onClick={saveDraft}>
                            <Save size={16} /> SAVE DRAFT
                        </button>
                        <button className="btn-secondary" onClick={async () => {
                            if (window.confirm('PUBLISH: Sync draft to public storefront?')) {
                                await publishLive();
                                alert('PUBLISHED: Site is now LIVE.');
                            }
                        }}>
                            <CheckCircle2 size={16} /> PUBLISH TO LIVE
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div ref={shadowHostRef} style={{ position: 'fixed', zIndex: 2147483647 }}>
            {shadowRoot && ReactDOM.createPortal(EditorUI, shadowRoot as unknown as Element)}
        </div>
    );
}
