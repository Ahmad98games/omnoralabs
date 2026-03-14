import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { Save, X, Edit, Sliders, Settings, Layout, DollarSign } from 'lucide-react';
import client from '../../api/client';

interface EditModeOverlayProps {
    pageKey: 'home' | 'collection' | 'product';
    onSave: (data: any) => void;
    initialData: any;
}

export default function EditModeOverlay({ pageKey, onSave, initialData }: EditModeOverlayProps) {
    const { isSeller } = useAuth();
    const [isActive, setIsActive] = useState(false);
    const [activeTab, setActiveTab] = useState<'visual' | 'branding'>('visual');
    const [formData, setFormData] = useState(initialData);
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

    useEffect(() => {
        setFormData(initialData);
    }, [initialData]);

    if (!isSeller) return null;

    const handleFieldChange = (field: string, value: any) => {
        setFormData((prev: any) => {
            const next = {
                ...prev,
                pages: {
                    ...prev.pages,
                    [pageKey]: {
                        ...prev.pages?.[pageKey],
                        [field]: value
                    }
                }
            };
            return next;
        });
    };

    const handleStyleChange = (field: string, value: any) => {
        setFormData((prev: any) => ({
            ...prev,
            globalStyles: { ...prev.globalStyles, [field]: value }
        }));
    };

    const handleConfigChange = (section: string, key: string, value: any) => {
        setFormData((prev: any) => {
            if (section === 'none') {
                return {
                    ...prev,
                    configuration: {
                        ...prev.configuration,
                        [key]: value
                    }
                };
            }
            return {
                ...prev,
                configuration: {
                    ...prev.configuration,
                    [section]: {
                        ...prev.configuration?.[section],
                        [key]: value
                    }
                }
            };
        });
    };

    const EditorUI = (
        <div className="ghost-root">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
                
                .ghost-editor-panel {
                    position: fixed;
                    top: 1.5rem;
                    right: 1.5rem;
                    width: 350px;
                    background: rgba(255, 255, 255, 0.98);
                    backdrop-filter: blur(25px) saturate(200%);
                    border: 1px solid rgba(0, 0, 0, 0.1);
                    border-radius: 20px;
                    box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 0.5);
                    padding: 2rem;
                    font-family: 'Inter', system-ui, sans-serif;
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    z-index: 2000000000;
                    color: #1e293b;
                    pointer-events: auto;
                }
                .ghost-header { font-weight: 900; font-size: 0.8rem; color: #0f172a; border-bottom: 1px solid rgba(0,0,0,0.05); padding-bottom: 1rem; display: flex; align-items: center; gap: 0.8rem; letter-spacing: 0.05em; text-transform: uppercase; }
                .tab-row { display: flex; gap: 0.5rem; background: #f1f5f9; padding: 0.3rem; border-radius: 12px; }
                .tab-btn { flex: 1; background: transparent; border: none; padding: 0.5rem; border-radius: 8px; font-size: 0.65rem; font-weight: 700; cursor: pointer; color: #64748b; display: flex; align-items: center; justify-content: center; gap: 0.4rem; }
                .tab-btn.active { background: white; color: #0f172a; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
                .field-group { display: flex; flex-direction: column; gap: 0.6rem; }
                .field-group label { font-size: 0.65rem; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.02em; }
                .field-input { padding: 0.8rem; border: 2px solid #f1f5f9; border-radius: 12px; font-size: 0.85rem; background: #f8fafc; transition: all 0.2s; color: #0f172a; }
                .field-input:focus { border-color: #1e293b; outline: none; background: white; }
                .btn-primary { background: #0f172a; color: white; border: none; padding: 1rem; border-radius: 14px; font-weight: 800; font-size: 0.8rem; cursor: pointer; margin-top: 1rem; box-shadow: 0 10px 20px rgba(0,0,0,0.2); transition: transform 0.2s; }
                .btn-primary:hover { transform: translateY(-2px); }
                .btn-publish { background: #C0C0C0; color: #000; border: none; padding: 1rem; border-radius: 14px; font-weight: 900; font-size: 0.8rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: all 0.3s; }
                .btn-publish:hover { background: #FFFFFF; box-shadow: 0 0 30px rgba(192, 192, 192, 0.4); }
                .btn-secondary { background: transparent; color: #64748b; border: 2px solid #f1f5f9; padding: 1rem; border-radius: 14px; font-weight: 700; font-size: 0.8rem; cursor: pointer; }
                
                .toggle-trigger {
                    position: fixed;
                    bottom: 2.5rem;
                    right: 2.5rem;
                    background: #0f172a;
                    color: white;
                    border: none;
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 15px 35px rgba(0,0,0,0.4);
                    z-index: 2000000000;
                    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .toggle-trigger:hover { transform: scale(1.1) rotate(45deg); }

                [data-theme='dark'] .ghost-editor-panel {
                    background: rgba(15, 23, 42, 0.95);
                    border-color: rgba(255, 255, 255, 0.1);
                    color: #f8fafc;
                }
                [data-theme='dark'] .field-input { background: #1e293b; border-color: #334155; color: white; }
                [data-theme='dark'] .tab-row { background: #0f172a; }
                [data-theme='dark'] .tab-btn.active { background: #334155; color: white; }
            `}</style>

            {!isActive ? (
                <button
                    type="button"
                    className="toggle-trigger"
                    onClick={(e) => { e.stopPropagation(); setIsActive(true); }}
                    aria-expanded="false"
                    aria-controls="ghost-editor-panel"
                    aria-label="Open Ghost Edit Engine"
                    title="Open Ghost Edit Engine"
                >
                    <Settings size={28} aria-hidden="true" />
                </button>
            ) : (
                <div
                    id="ghost-editor-panel"
                    className="ghost-editor-panel"
                    role="dialog"
                    aria-labelledby="editor-title"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="ghost-header" id="editor-title">
                        <Sliders size={16} aria-hidden="true" /> GHOST-EDIT ENGINE (v3)
                    </div>

                    <div className="tab-row" role="tablist">
                        <button
                            id="tab-visual"
                            type="button"
                            role="tab"
                            aria-selected={activeTab === 'visual'}
                            aria-controls="panel-visual"
                            className={`tab-btn ${activeTab === 'visual' ? 'active' : ''}`}
                            onClick={() => setActiveTab('visual')}
                        >
                            <Layout size={12} aria-hidden="true" /> VISUAL
                        </button>
                        <button
                            id="tab-branding"
                            type="button"
                            role="tab"
                            aria-selected={activeTab === 'branding'}
                            aria-controls="panel-branding"
                            className={`tab-btn ${activeTab === 'branding' ? 'active' : ''}`}
                            onClick={() => setActiveTab('branding')}
                        >
                            <Settings size={12} aria-hidden="true" /> IDENTITY
                        </button>
                    </div>

                    {activeTab === 'visual' && (
                        <div id="panel-visual" role="tabpanel" aria-labelledby="tab-visual" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <div className="field-group">
                                <label htmlFor="headlineText">Headline</label>
                                <input
                                    id="headlineText"
                                    className="field-input"
                                    value={formData.pages?.[pageKey]?.headlineText || ''}
                                    onChange={(e) => handleFieldChange('headlineText', e.target.value)}
                                />
                            </div>

                            <div className="field-group">
                                <label htmlFor="heroImage">Hero Asset (Image URL)</label>
                                <input
                                    id="heroImage"
                                    className="field-input"
                                    placeholder="https://images.unsplash.com/..."
                                    value={formData.pages?.[pageKey]?.heroImage || ''}
                                    onChange={(e) => handleFieldChange('heroImage', e.target.value)}
                                />
                                <p style={{ fontSize: '0.6rem', color: '#64748b', marginTop: '-0.4rem' }}>
                                    Full freedom: Use any high-res URL for your main banner.
                                </p>
                            </div>

                            <div className="field-group">
                                <label htmlFor="primaryColor">Highlight Color</label>
                                <input
                                    id="primaryColor"
                                    type="color"
                                    className="field-input"
                                    style={{ height: '40px', padding: '4px' }}
                                    value={formData.globalStyles?.primaryColor || '#D4AF37'}
                                    onChange={(e) => handleStyleChange('primaryColor', e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'branding' && (
                        <div id="panel-branding" role="tabpanel" aria-labelledby="tab-branding" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <div className="field-group">
                                <label htmlFor="storeName">Store Display Name</label>
                                <input
                                    id="storeName"
                                    className="field-input"
                                    placeholder="My Elite Boutique"
                                    value={formData.configuration?.name || ''}
                                    onChange={(e) => handleConfigChange('none', 'name', e.target.value)}
                                />
                                <p style={{ fontSize: '0.6rem', color: '#64748b', marginTop: '-0.4rem' }}>
                                    This updates your browser tab and site identity.
                                </p>
                            </div>

                            <div className="field-group">
                                <label htmlFor="faviconUrl">Brand Favicon (URL)</label>
                                <input
                                    id="faviconUrl"
                                    className="field-input"
                                    placeholder="https://.../favicon.ico"
                                    value={formData.configuration?.assets?.favicon || ''}
                                    onChange={(e) => handleConfigChange('assets', 'favicon', e.target.value)}
                                />
                                <p style={{ fontSize: '0.6rem', color: '#64748b', marginTop: '-0.4rem' }}>
                                    Full isolation: Your own brand icon on the browser tab.
                                </p>
                            </div>

                            <div className="field-group">
                                <label htmlFor="spatialPadding">Global Spatial Depth</label>
                                <input
                                    id="spatialPadding"
                                    className="field-input"
                                    placeholder="e.g. 2.5rem"
                                    value={formData.configuration?.ui?.spatialPadding || ''}
                                    onChange={(e) => handleConfigChange('ui', 'spatialPadding', e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: 'auto' }}>
                        <button
                            type="button"
                            className="btn-primary"
                            onClick={async () => {
                                await onSave(formData);
                            }}
                        >
                            SAVE DRAFT
                        </button>

                        <button
                            type="button"
                            className="btn-publish"
                            onClick={async (e) => {
                                try {
                                    const btn = e.currentTarget;
                                    const { data } = await client.post('/cms/content/publish');
                                    if (data.success) {
                                        btn.classList.add('publish-success');
                                        setTimeout(() => btn.classList.remove('publish-success'), 1500);
                                        alert('SITE PUBLISHED: Silver Glow Snapshot Created.');
                                    }
                                } catch (err) {
                                    alert('Publish failed');
                                }
                            }}
                        >
                            <Save size={14} /> PUBLISH TO LIVE
                        </button>

                        <button type="button" className="btn-secondary" aria-label="Close Ghost Edit Engine" onClick={() => setIsActive(false)}>CLOSE EDITOR</button>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div ref={shadowHostRef} style={{ position: 'fixed', zIndex: 2147483647 }}>
            {shadowRoot && ReactDOM.createPortal(EditorUI, shadowRoot)}
        </div>
    );
}
