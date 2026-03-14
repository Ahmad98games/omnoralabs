/**
 * AdminPageManager: Custom Pages CMS
 *
 * Manage custom static pages (e.g. /about, /contact).
 * Registered in BuilderRegistry as 'admin_page_manager'.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { databaseClient } from '../../platform/core/DatabaseClient';
import type { CustomPage } from '../../platform/core/DatabaseTypes';

// ─── Design Tokens ────────────────────────────────────────────────────────────

const T = {
    bg: '#0a0a0f', surface: '#111118', surface2: '#1a1a24', surface3: '#222230',
    border: '#2a2a3a', accent: '#7c6dfa', accentDim: 'rgba(124,109,250,0.15)',
    text: '#f0f0f5', textDim: '#8b8ba0', textMuted: '#5a5a70',
    danger: '#ff4d6a', dangerDim: 'rgba(255,77,106,0.12)',
    success: '#34d399', successDim: 'rgba(52,211,153,0.12)',
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface AdminPageManagerProps {
    nodeId: string;
    merchantId?: string;
    children?: React.ReactNode;
}

export const adminPageManagerSchema = {
    merchantId: { type: 'text' as const, label: 'Merchant ID', defaultValue: '' },
};

// ─── Component ────────────────────────────────────────────────────────────────

export const AdminPageManager: React.FC<AdminPageManagerProps> = ({ nodeId, merchantId = '' }) => {
    const [pages, setPages] = useState<CustomPage[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingPage, setEditingPage] = useState<CustomPage | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ title: '', slug: '', status: 'draft' as 'draft' | 'published' });

    const loadPages = useCallback(async () => {
        if (!merchantId) { setLoading(false); return; }
        setLoading(true);
        try { setPages(await databaseClient.getPagesByMerchant(merchantId)); }
        catch (err) { console.error('[PageManager] Load failed:', err); }
        finally { setLoading(false); }
    }, [merchantId]);

    useEffect(() => { loadPages(); }, [loadPages]);

    const openAdd = () => {
        setEditingPage(null);
        setForm({ title: '', slug: '', status: 'draft' });
        setModalOpen(true);
    };

    const openEdit = (page: CustomPage) => {
        setEditingPage(page);
        setForm({ title: page.title, slug: page.slug, status: page.status });
        setModalOpen(true);
    };

    const handleSave = async () => {
        if (!merchantId || !form.title.trim()) return;
        setSaving(true);
        const slug = form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        try {
            if (editingPage) {
                await databaseClient.updatePage(editingPage.id, { title: form.title, slug, status: form.status });
            } else {
                await databaseClient.createPage(merchantId, { title: form.title, slug, status: form.status, nodeIds: [] });
            }
            await loadPages();
            setModalOpen(false);
        } catch (err) { console.error('[PageManager] Save failed:', err); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        if (!merchantId) return;
        await databaseClient.deletePage(merchantId, id);
        await loadPages();
    };

    const handleEditInBuilder = (page: CustomPage) => {
        // Dispatch custom event so the builder's active-page switcher picks it up
        window.dispatchEvent(new CustomEvent('omnora:switch-page', {
            detail: { pageId: page.id, slug: page.slug, title: page.title },
        }));
    };

    if (!merchantId) {
        return (
            <div data-node-id={nodeId} style={{ padding: 40, textAlign: 'center', fontFamily: "'Inter', sans-serif" }}>
                <p style={{ color: T.textMuted, fontSize: 14 }}>Set <strong>Merchant ID</strong> in block settings.</p>
            </div>
        );
    }

    return (
        <div data-node-id={nodeId} style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: T.bg, minHeight: 300 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
                <div>
                    <h2 style={{ fontSize: 22, fontWeight: 800, color: T.text, margin: '0 0 4px', letterSpacing: '-0.02em' }}>Pages</h2>
                    <p style={{ fontSize: 12, color: T.textMuted, margin: 0 }}>{pages.length} page{pages.length !== 1 ? 's' : ''}</p>
                </div>
                <button onClick={openAdd} style={btnPrimary}>+ Add Page</button>
            </div>

            {/* Table */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                    <div style={spinnerStyle} />
                    <p style={{ color: T.textMuted, fontSize: 13, marginTop: 12 }}>Loading…</p>
                </div>
            ) : pages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60 }}>
                    <span style={{ fontSize: 40, display: 'block', marginBottom: 12, opacity: 0.2 }}>📄</span>
                    <p style={{ color: T.textDim, fontSize: 14, fontWeight: 600, margin: '0 0 4px' }}>No custom pages</p>
                    <p style={{ color: T.textMuted, fontSize: 12, margin: 0 }}>Click "Add Page" to create /about, /contact, etc.</p>
                </div>
            ) : (
                <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{
                        display: 'grid', gridTemplateColumns: '1fr 140px 100px 90px 60px',
                        padding: '10px 16px', background: T.surface2,
                        fontSize: 10, fontWeight: 700, color: T.textMuted,
                        textTransform: 'uppercase', letterSpacing: '0.08em',
                    }}>
                        <span>Page</span><span>Slug</span><span>Status</span><span /><span />
                    </div>
                    {pages.map(page => (
                        <div
                            key={page.id}
                            onClick={() => openEdit(page)}
                            style={{
                                display: 'grid', gridTemplateColumns: '1fr 140px 100px 90px 60px',
                                padding: '12px 16px', alignItems: 'center',
                                borderTop: `1px solid ${T.border}`, cursor: 'pointer',
                                transition: 'background 0.15s',
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = T.surface2; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                        >
                            <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{page.title}</span>
                            <span style={{ fontSize: 12, color: T.textDim, fontFamily: 'monospace' }}>/pages/{page.slug}</span>
                            <span style={{
                                fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                                background: page.status === 'published' ? T.successDim : T.dangerDim,
                                color: page.status === 'published' ? T.success : T.danger,
                                width: 'fit-content',
                            }}>
                                {page.status === 'published' ? 'Published' : 'Draft'}
                            </span>
                            <button
                                onClick={e => { e.stopPropagation(); handleEditInBuilder(page); }}
                                style={{ ...linkBtn, fontSize: 11 }}
                            >✏️ Builder</button>
                            <button
                                onClick={e => { e.stopPropagation(); handleDelete(page.id); }}
                                style={{ background: 'none', border: 'none', color: T.textMuted, cursor: 'pointer', fontSize: 16, padding: 4 }}
                            >🗑</button>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {modalOpen && (
                <div style={overlayStyle} onClick={() => setModalOpen(false)}>
                    <div style={modalStyle} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h3 style={{ fontSize: 18, fontWeight: 800, color: T.text, margin: 0 }}>
                                {editingPage ? 'Edit Page' : 'Add Page'}
                            </h3>
                            <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: T.textMuted, fontSize: 20, cursor: 'pointer' }}>×</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <Field label="Title" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="About Us" />
                            <Field label="Slug" value={form.slug} onChange={v => setForm(f => ({ ...f, slug: v }))} placeholder="about (auto-generated)" />
                            <div>
                                <label style={labelStyle}>Status</label>
                                <select
                                    value={form.status}
                                    onChange={e => setForm(f => ({ ...f, status: e.target.value as 'draft' | 'published' }))}
                                    style={{ ...inputStyle, appearance: 'auto' as any }}
                                >
                                    <option value="draft">Draft</option>
                                    <option value="published">Published</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20, borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
                            <button onClick={() => setModalOpen(false)} style={btnSecondary}>Cancel</button>
                            <button onClick={handleSave} disabled={saving || !form.title.trim()} style={{
                                ...btnPrimary, opacity: saving || !form.title.trim() ? 0.5 : 1,
                            }}>
                                {saving ? 'Saving…' : editingPage ? 'Update Page' : 'Create Page'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`@keyframes omnoraPageSpin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const Field: React.FC<{ label: string; value: string; onChange: (v: string) => void; placeholder?: string }> = ({ label, value, onChange, placeholder }) => (
    <div>
        <label style={labelStyle}>{label}</label>
        <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
    </div>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 700, color: T.textMuted,
    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6,
};
const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', background: T.surface2,
    border: `1.5px solid ${T.border}`, borderRadius: 8, color: T.text,
    fontSize: 13, fontWeight: 500, outline: 'none', boxSizing: 'border-box',
};
const btnPrimary: React.CSSProperties = {
    padding: '10px 20px', background: `linear-gradient(135deg, ${T.accent}, #9b8aff)`,
    border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 700,
    cursor: 'pointer', boxShadow: '0 2px 12px rgba(124,109,250,0.3)',
};
const btnSecondary: React.CSSProperties = {
    padding: '10px 20px', background: T.surface2,
    border: `1px solid ${T.border}`, borderRadius: 8, color: T.textDim,
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
};
const linkBtn: React.CSSProperties = {
    background: 'none', border: 'none', color: T.accent,
    fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '4px 0',
};
const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', zIndex: 10000,
};
const modalStyle: React.CSSProperties = {
    background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14,
    padding: 28, width: '100%', maxWidth: 480, boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
};
const spinnerStyle: React.CSSProperties = {
    width: 24, height: 24, border: '2.5px solid #27272a', borderTopColor: T.accent,
    borderRadius: '50%', display: 'inline-block', animation: 'omnoraPageSpin 0.7s linear infinite',
};

export default AdminPageManager;
