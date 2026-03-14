/**
 * AdminNavigationManager: Visual Menu Builder
 *
 * Sortable link list for managing store navigation menus.
 * Saves menu structures to DatabaseClient for StoreHeader/SiteFooter consumption.
 * Registered in BuilderRegistry as 'admin_navigation_manager'.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { databaseClient } from '../../platform/core/DatabaseClient';
import type { NavLink } from '../../platform/core/DatabaseTypes';

// ─── Design Tokens ────────────────────────────────────────────────────────────

const T = {
    bg: '#0a0a0f', surface: '#111118', surface2: '#1a1a24', surface3: '#222230',
    border: '#2a2a3a', accent: '#7c6dfa', accentDim: 'rgba(124,109,250,0.15)',
    text: '#f0f0f5', textDim: '#8b8ba0', textMuted: '#5a5a70',
    danger: '#ff4d6a', success: '#34d399',
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface AdminNavigationManagerProps {
    nodeId: string;
    merchantId?: string;
    menuName?: string;
    children?: React.ReactNode;
}

export const adminNavigationManagerSchema = {
    merchantId: { type: 'text' as const, label: 'Merchant ID', defaultValue: '' },
    menuName: { type: 'text' as const, label: 'Menu Name', defaultValue: 'main-nav' },
};

// ─── Component ────────────────────────────────────────────────────────────────

export const AdminNavigationManager: React.FC<AdminNavigationManagerProps> = ({
    nodeId, merchantId = '', menuName = 'main-nav',
}) => {
    const [links, setLinks] = useState<NavLink[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [dragIdx, setDragIdx] = useState<number | null>(null);

    // ── Load ──────────────────────────────────────────────────────────────
    const loadMenu = useCallback(async () => {
        if (!merchantId) { setLoading(false); return; }
        setLoading(true);
        try {
            const menu = await databaseClient.getNavMenu(merchantId, menuName);
            setLinks(menu?.links || []);
        } catch (err) {
            console.error('[NavManager] Load failed:', err);
        } finally {
            setLoading(false);
        }
    }, [merchantId, menuName]);

    useEffect(() => { loadMenu(); }, [loadMenu]);

    // ── Save ──────────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!merchantId) return;
        setSaving(true);
        try {
            await databaseClient.saveNavMenu(merchantId, menuName, links);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            console.error('[NavManager] Save failed:', err);
        } finally {
            setSaving(false);
        }
    };

    // ── Add link ──────────────────────────────────────────────────────────
    const addLink = () => {
        setLinks(prev => [...prev, {
            id: `link_${Date.now()}`, label: '', url: '',
        }]);
    };

    // ── Update link field ─────────────────────────────────────────────────
    const updateLink = (idx: number, field: 'label' | 'url', value: string) => {
        setLinks(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l));
    };

    // ── Remove link ───────────────────────────────────────────────────────
    const removeLink = (idx: number) => {
        setLinks(prev => prev.filter((_, i) => i !== idx));
    };

    // ── Drag reorder ──────────────────────────────────────────────────────
    const handleDragStart = (idx: number) => setDragIdx(idx);

    const handleDragOver = (e: React.DragEvent, idx: number) => {
        e.preventDefault();
        if (dragIdx === null || dragIdx === idx) return;
        setLinks(prev => {
            const updated = [...prev];
            const [dragged] = updated.splice(dragIdx, 1);
            updated.splice(idx, 0, dragged);
            return updated;
        });
        setDragIdx(idx);
    };

    const handleDragEnd = () => setDragIdx(null);

    // ── Move up/down ──────────────────────────────────────────────────────
    const moveLink = (idx: number, dir: -1 | 1) => {
        const target = idx + dir;
        if (target < 0 || target >= links.length) return;
        setLinks(prev => {
            const updated = [...prev];
            [updated[idx], updated[target]] = [updated[target], updated[idx]];
            return updated;
        });
    };

    if (!merchantId) {
        return (
            <div data-node-id={nodeId} style={{ padding: 40, textAlign: 'center', fontFamily: "'Inter', sans-serif" }}>
                <p style={{ color: T.textMuted, fontSize: 14 }}>Set <strong>Merchant ID</strong> in block settings.</p>
            </div>
        );
    }

    return (
        <div data-node-id={nodeId} style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: T.bg, minHeight: 200 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12 }}>
                <div>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: T.text, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
                        Navigation: {menuName}
                    </h2>
                    <p style={{ fontSize: 11, color: T.textMuted, margin: 0 }}>
                        {links.length} link{links.length !== 1 ? 's' : ''} · drag to reorder
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={addLink} style={btnSecondary}>+ Add Link</button>
                    <button onClick={handleSave} disabled={saving} style={{
                        ...btnPrimary,
                        opacity: saving ? 0.5 : 1,
                        background: saved ? `linear-gradient(135deg, ${T.success}, #5eeaa0)` : btnPrimary.background,
                    }}>
                        {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Menu'}
                    </button>
                </div>
            </div>

            {/* Links List */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                    <div style={spinnerStyle} />
                </div>
            ) : links.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                    <span style={{ fontSize: 36, display: 'block', marginBottom: 8, opacity: 0.2 }}>🔗</span>
                    <p style={{ color: T.textMuted, fontSize: 13 }}>No links. Click "Add Link" to get started.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {links.map((link, idx) => (
                        <div
                            key={link.id}
                            draggable
                            onDragStart={() => handleDragStart(idx)}
                            onDragOver={e => handleDragOver(e, idx)}
                            onDragEnd={handleDragEnd}
                            style={{
                                display: 'grid', gridTemplateColumns: '28px 1fr 1fr 60px 36px',
                                gap: 8, alignItems: 'center',
                                padding: '8px 12px', borderRadius: 8,
                                background: dragIdx === idx ? T.accentDim : T.surface2,
                                border: `1px solid ${dragIdx === idx ? T.accent : T.border}`,
                                cursor: 'grab', transition: 'all 0.15s',
                            }}
                        >
                            {/* Grip handle */}
                            <span style={{ fontSize: 14, color: T.textMuted, cursor: 'grab', userSelect: 'none' }}>⠿</span>

                            {/* Label */}
                            <input
                                value={link.label}
                                onChange={e => updateLink(idx, 'label', e.target.value)}
                                placeholder="Label (e.g. Shop)"
                                style={inputSmall}
                            />

                            {/* URL */}
                            <input
                                value={link.url}
                                onChange={e => updateLink(idx, 'url', e.target.value)}
                                placeholder="URL (e.g. /collections/all)"
                                style={inputSmall}
                            />

                            {/* Move buttons */}
                            <div style={{ display: 'flex', gap: 2 }}>
                                <button onClick={() => moveLink(idx, -1)} disabled={idx === 0}
                                    style={{ ...miniBtn, opacity: idx === 0 ? 0.2 : 1 }}>↑</button>
                                <button onClick={() => moveLink(idx, 1)} disabled={idx === links.length - 1}
                                    style={{ ...miniBtn, opacity: idx === links.length - 1 ? 0.2 : 1 }}>↓</button>
                            </div>

                            {/* Delete */}
                            <button onClick={() => removeLink(idx)} style={{ ...miniBtn, color: T.textMuted }}
                                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = T.danger; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = T.textMuted; }}
                            >🗑</button>
                        </div>
                    ))}
                </div>
            )}

            <style>{`@keyframes omnoraNavSpin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const inputSmall: React.CSSProperties = {
    width: '100%', padding: '7px 10px', background: T.surface,
    border: `1px solid ${T.border}`, borderRadius: 6,
    color: T.text, fontSize: 12, fontWeight: 500, outline: 'none', boxSizing: 'border-box',
};
const btnPrimary: React.CSSProperties = {
    padding: '8px 18px', background: `linear-gradient(135deg, ${T.accent}, #9b8aff)`,
    border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 700,
    cursor: 'pointer', boxShadow: '0 2px 12px rgba(124,109,250,0.3)',
};
const btnSecondary: React.CSSProperties = {
    padding: '8px 18px', background: T.surface2,
    border: `1px solid ${T.border}`, borderRadius: 8,
    color: T.textDim, fontSize: 12, fontWeight: 600, cursor: 'pointer',
};
const miniBtn: React.CSSProperties = {
    background: 'none', border: 'none', color: T.textDim,
    fontSize: 14, cursor: 'pointer', padding: '2px 4px',
};
const spinnerStyle: React.CSSProperties = {
    width: 24, height: 24, border: '2.5px solid #27272a', borderTopColor: T.accent,
    borderRadius: '50%', display: 'inline-block', animation: 'omnoraNavSpin 0.7s linear infinite',
};

export default AdminNavigationManager;
