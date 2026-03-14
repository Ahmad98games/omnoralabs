/**
 * PageSettingsPanel: Dynamic SEO Manager
 *
 * Appears in the SmartSidebar when NO block is selected (canvas background clicked).
 * Provides inputs for Page Title and Meta Description that support
 * Liquid-style data binding (e.g., `Buy {{product.title}} today!`).
 */
import React, { useCallback, useMemo } from 'react';
import { useBuilder } from '../../context/BuilderContext';
import { FileText, Search, Image as ImageIcon } from 'lucide-react';

// ─── Component ────────────────────────────────────────────────────────────────

export const PageSettingsPanel: React.FC = () => {
    const { pages, activePageId, updatePageMeta } = useBuilder();

    const activePage = useMemo(() => {
        return pages.byId[activePageId] || null;
    }, [pages, activePageId]);

    const handleTitleChange = useCallback((value: string) => {
        if (!activePageId) return;
        updatePageMeta(activePageId, 'seoMeta.title', value);
    }, [activePageId, updatePageMeta]);

    const handleDescriptionChange = useCallback((value: string) => {
        if (!activePageId) return;
        updatePageMeta(activePageId, 'seoMeta.description', value);
    }, [activePageId, updatePageMeta]);

    const seoTitle = activePage?.seoMeta?.title || '';
    const seoDescription = activePage?.seoMeta?.description || '';
    const seoOgImage = activePage?.seoMeta?.ogImage || '';

    const handleOgImageChange = useCallback((value: string) => {
        if (!activePageId) return;
        updatePageMeta(activePageId, 'seoMeta.ogImage', value);
    }, [activePageId, updatePageMeta]);

    // Simple preview: show raw text including {{ ... }} placeholders
    const previewTitle = seoTitle || activePage?.title || 'Untitled Page';
    const previewDescription = seoDescription || 'No meta description set.';

    return (
        <div style={{
            fontFamily: "'Inter', sans-serif",
            color: '#e4e4e7',
            display: 'flex', flexDirection: 'column', gap: '24px',
        }}>
            {/* Header */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '12px', background: 'rgba(255,255,255,0.03)',
                borderRadius: '8px'
            }}>
                <div style={{ padding: '6px', background: '#34d399', borderRadius: '4px' }}>
                    <FileText size={14} color="#000" />
                </div>
                <div>
                    <div style={{ fontSize: '10px', color: '#a1a1aa', fontWeight: 700, textTransform: 'uppercase' }}>Page Settings</div>
                    <div style={{ fontSize: '13px', color: '#fff', fontWeight: 600 }}>{activePage?.title || 'Global Page'}</div>
                </div>
            </div>

            {/* SEO Fields */}
            <div style={{
                background: '#0e0e11', border: '1px solid #27272a',
                borderRadius: '8px', padding: '16px'
            }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    marginBottom: '16px', color: '#e4e4e7', fontSize: '13px', fontWeight: 600
                }}>
                    <span style={{ color: '#a1a1aa' }}><Search size={14} /></span> SEO & Meta Tags
                </div>

                {/* Page Title */}
                <div style={{ marginBottom: 16 }}>
                    <div style={labelStyle}>Page Title</div>
                    <input
                        type="text"
                        value={seoTitle}
                        placeholder="e.g. Buy {{product.title}} — OmnoraStore"
                        onChange={(e) => handleTitleChange(e.target.value)}
                        style={inputStyle}
                    />
                    <div style={hintStyle}>Supports Liquid: {'{{product.title}}'}, {'{{collection.title}}'}</div>
                </div>

                {/* Meta Description */}
                <div style={{ marginBottom: 16 }}>
                    <div style={labelStyle}>Meta Description</div>
                    <textarea
                        value={seoDescription}
                        placeholder="e.g. Shop {{product.title}} at the best price. {{product.description | truncate: 120}}"
                        onChange={(e) => handleDescriptionChange(e.target.value)}
                        rows={3}
                        style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }}
                    />
                    <div style={hintStyle}>Supports Liquid: {'{{product.price | money}}'}</div>
                </div>

                {/* OG Image */}
                <div style={{ marginBottom: 16 }}>
                    <div style={labelStyle}>Social Share (OG) Image</div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{
                            width: '40px', height: '40px', background: '#18181b', borderRadius: '4px',
                            border: '1px solid #27272a', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, overflow: 'hidden'
                        }}>
                            {seoOgImage ? (
                                <img src={seoOgImage} alt="OG" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <ImageIcon size={14} color="#52525b" />
                            )}
                        </div>
                        <input
                            type="text"
                            value={seoOgImage}
                            placeholder="Image URL (1200x630px)"
                            onChange={(e) => handleOgImageChange(e.target.value)}
                            style={inputStyle}
                        />
                    </div>
                    <div style={hintStyle}>Optimal size: 1200 x 630 pixels.</div>
                </div>

                {/* Live Preview */}
                <div style={{
                    marginTop: 8, padding: '12px',
                    background: '#18181b', borderRadius: '6px',
                    border: '1px solid #27272a'
                }}>
                    <div style={{ fontSize: '10px', color: '#71717a', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>
                        Search Preview
                    </div>
                    <div style={{ fontSize: '14px', color: '#8ab4f8', fontWeight: 600, marginBottom: 4, wordBreak: 'break-word' }}>
                        {previewTitle}
                    </div>
                    <div style={{ fontSize: '11px', color: '#a1a1aa', lineHeight: 1.5, wordBreak: 'break-word' }}>
                        {previewDescription}
                    </div>
                    <div style={{ fontSize: '11px', color: '#34d399', marginTop: 4 }}>
                        omnorastore.com/{activePage?.slug || ''}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Style Constants ──────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
    fontSize: '10px', color: '#71717a', fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px'
};

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', fontSize: '12px',
    background: '#18181b', border: '1px solid #27272a',
    borderRadius: '4px', color: '#f4f4f5', fontFamily: 'monospace'
};

const hintStyle: React.CSSProperties = {
    fontSize: '10px', color: '#52525b', marginTop: 4, fontStyle: 'italic'
};
