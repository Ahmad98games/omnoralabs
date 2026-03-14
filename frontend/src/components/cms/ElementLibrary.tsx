import React, { useState, useMemo, memo, useCallback } from 'react';
import { useBuilder } from '../../context/BuilderContext';
import { BLOCK_TYPES as SECTION_TYPES } from '../../platform/core/Registry';
import { X, Search, ChevronRight } from 'lucide-react';

// ─── Tokens ───────────────────────────────────────────────────────────────────
const T = {
    bg: 'rgba(23, 23, 23, 0.8)', // bg-neutral-900/80
    bgSub: 'transparent',
    border: 'rgba(255, 255, 255, 0.05)',
    text: '#F3F4F6',
    sub: '#D1D5DB',
    muted: '#9CA3AF',
    faint: '#6B7280',
    accent: '#6366F1',
    accentBg: 'rgba(99,102,241,0.1)', // hover:bg-indigo-500/10
    success: '#10B981',
    warning: '#F59E0B',
    orange: '#F97316',
    green: '#22C55E',
};

// ─── SVG Previews (light-mode) ────────────────────────────────────────────────
const Preview = {
    hero: () => (
        <svg viewBox="0 0 120 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="120" height="64" fill="#F3F4F6" rx="3" />
            <rect x="8" y="8" width="104" height="32" fill="#E5E7EB" rx="2" />
            <rect x="18" y="16" width="60" height="5" fill="#6366F1" rx="2" opacity="0.7" />
            <rect x="18" y="24" width="40" height="3" fill="#9CA3AF" rx="1" />
            <rect x="18" y="32" width="24" height="6" fill="#6366F1" rx="2" opacity="0.5" />
            <rect x="8" y="44" width="50" height="3" fill="#E5E7EB" rx="1" />
            <rect x="62" y="44" width="50" height="3" fill="#E5E7EB" rx="1" />
        </svg>
    ),
    hero_split: () => (
        <svg viewBox="0 0 120 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="120" height="64" fill="#F3F4F6" rx="3" />
            <rect x="4" y="8" width="54" height="48" fill="#E5E7EB" rx="2" />
            <rect x="62" y="8" width="54" height="48" fill="#D1D5DB" rx="2" />
            <rect x="10" y="18" width="36" height="4" fill="#6366F1" rx="1" opacity="0.7" />
            <rect x="10" y="26" width="28" height="2.5" fill="#9CA3AF" rx="1" />
            <rect x="10" y="42" width="20" height="7" fill="#6366F1" rx="2" opacity="0.5" />
        </svg>
    ),
    nav: () => (
        <svg viewBox="0 0 120 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="120" height="64" fill="#F3F4F6" rx="3" />
            <rect x="0" y="0" width="120" height="20" fill="#fff" rx="3" />
            <rect x="6" y="7" width="16" height="6" fill="#6366F1" rx="1" opacity="0.7" />
            <rect x="34" y="8" width="12" height="4" fill="#D1D5DB" rx="1" />
            <rect x="50" y="8" width="12" height="4" fill="#D1D5DB" rx="1" />
            <rect x="94" y="6" width="20" height="8" fill="#6366F1" rx="2" opacity="0.5" />
            <rect x="8" y="28" width="104" height="28" fill="#E5E7EB" rx="2" />
        </svg>
    ),
    product_grid: () => (
        <svg viewBox="0 0 120 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="120" height="64" fill="#F3F4F6" rx="3" />
            <rect x="4" y="4" width="34" height="42" fill="#E5E7EB" rx="2" />
            <rect x="43" y="4" width="34" height="42" fill="#E5E7EB" rx="2" />
            <rect x="82" y="4" width="34" height="42" fill="#E5E7EB" rx="2" />
            <rect x="4" y="4" width="34" height="26" fill="#D1D5DB" rx="2" />
            <rect x="43" y="4" width="34" height="26" fill="#D1D5DB" rx="2" />
            <rect x="82" y="4" width="34" height="26" fill="#D1D5DB" rx="2" />
            <rect x="8" y="32" width="20" height="3" fill="#9CA3AF" rx="1" />
            <rect x="8" y="37" width="14" height="3" fill="#6366F1" rx="1" opacity="0.7" />
            <rect x="47" y="32" width="20" height="3" fill="#9CA3AF" rx="1" />
            <rect x="47" y="37" width="14" height="3" fill="#6366F1" rx="1" opacity="0.7" />
            <rect x="86" y="32" width="20" height="3" fill="#9CA3AF" rx="1" />
            <rect x="86" y="37" width="14" height="3" fill="#6366F1" rx="1" opacity="0.7" />
        </svg>
    ),
    featured_product: () => (
        <svg viewBox="0 0 120 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="120" height="64" fill="#F3F4F6" rx="3" />
            <rect x="4" y="8" width="52" height="48" fill="#D1D5DB" rx="2" />
            <rect x="67" y="12" width="36" height="4" fill="#6366F1" rx="1" opacity="0.8" />
            <rect x="67" y="20" width="26" height="3" fill="#9CA3AF" rx="1" />
            <rect x="67" y="32" width="24" height="5" fill="#6366F1" rx="1" opacity="0.6" />
            <rect x="67" y="42" width="44" height="8" fill="#6366F1" rx="2" opacity="0.4" />
        </svg>
    ),
    trust: () => (
        <svg viewBox="0 0 120 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="120" height="64" fill="#F3F4F6" rx="3" />
            <rect x="6" y="16" width="24" height="32" fill="#E5E7EB" rx="3" />
            <rect x="35" y="16" width="24" height="32" fill="#E5E7EB" rx="3" />
            <rect x="64" y="16" width="24" height="32" fill="#E5E7EB" rx="3" />
            <rect x="93" y="16" width="24" height="32" fill="#E5E7EB" rx="3" />
            <circle cx="18" cy="28" r="5" fill="#6366F1" opacity="0.4" />
            <circle cx="47" cy="28" r="5" fill="#6366F1" opacity="0.4" />
            <circle cx="76" cy="28" r="5" fill="#6366F1" opacity="0.4" />
            <circle cx="105" cy="28" r="5" fill="#6366F1" opacity="0.4" />
        </svg>
    ),
    reviews: () => (
        <svg viewBox="0 0 120 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="120" height="64" fill="#F3F4F6" rx="3" />
            <rect x="4" y="8" width="54" height="48" fill="#E5E7EB" rx="3" />
            <rect x="62" y="8" width="54" height="48" fill="#E5E7EB" rx="3" />
            <circle cx="14" cy="18" r="5" fill="#D1D5DB" />
            <rect x="22" y="15" width="22" height="3" fill="#9CA3AF" rx="1" />
            <rect x="8" y="26" width="46" height="2.5" fill="#D1D5DB" rx="1" />
            <rect x="8" y="40" width="8" height="8" fill="#6366F1" rx="1" opacity="0.5" />
            <rect x="18" y="40" width="8" height="8" fill="#6366F1" rx="1" opacity="0.5" />
            <rect x="28" y="40" width="8" height="8" fill="#6366F1" rx="1" opacity="0.5" />
        </svg>
    ),
    footer: () => (
        <svg viewBox="0 0 120 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="120" height="64" fill="#F3F4F6" rx="3" />
            <rect x="0" y="36" width="120" height="28" fill="#E5E7EB" />
            <rect x="6" y="42" width="16" height="4" fill="#6366F1" rx="1" opacity="0.6" />
            <rect x="6" y="48" width="12" height="2" fill="#D1D5DB" rx="1" />
            <rect x="4" y="8" width="112" height="24" fill="#E5E7EB" rx="2" />
        </svg>
    ),
    promo: () => (
        <svg viewBox="0 0 120 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="120" height="64" fill="#F3F4F6" rx="3" />
            <rect x="0" y="20" width="120" height="24" fill="#6366F1" rx="0" opacity="0.08" />
            <rect x="0" y="20" width="3" height="24" fill="#6366F1" />
            <rect x="10" y="28" width="60" height="4" fill="#6366F1" rx="1" opacity="0.6" />
            <rect x="82" y="25" width="32" height="14" fill="#6366F1" rx="2" opacity="0.4" />
        </svg>
    ),
    text_block: () => (
        <svg viewBox="0 0 120 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="120" height="64" fill="#F3F4F6" rx="3" />
            <rect x="16" y="10" width="88" height="5" fill="#6366F1" rx="1" opacity="0.6" />
            <rect x="10" y="20" width="100" height="2.5" fill="#D1D5DB" rx="1" />
            <rect x="10" y="25" width="94" height="2.5" fill="#D1D5DB" rx="1" />
            <rect x="36" y="44" width="48" height="10" fill="#6366F1" rx="2" opacity="0.4" />
        </svg>
    ),
    cart: () => (
        <svg viewBox="0 0 120 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="120" height="64" fill="#F3F4F6" rx="3" />
            <rect x="72" y="0" width="48" height="64" fill="#E5E7EB" rx="3" />
            <rect x="76" y="8" width="36" height="4" fill="#6366F1" rx="1" opacity="0.5" />
            <rect x="76" y="16" width="40" height="12" fill="#D1D5DB" rx="2" />
            <rect x="76" y="48" width="40" height="10" fill="#6366F1" rx="2" opacity="0.5" />
        </svg>
    ),
    countdown: () => (
        <svg viewBox="0 0 120 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="120" height="64" fill="#F3F4F6" rx="3" />
            <rect x="4" y="12" width="112" height="40" fill="#E5E7EB" rx="3" />
            <rect x="18" y="20" width="18" height="20" fill="#D1D5DB" rx="3" />
            <rect x="40" y="20" width="18" height="20" fill="#D1D5DB" rx="3" />
            <rect x="62" y="20" width="18" height="20" fill="#D1D5DB" rx="3" />
            <rect x="84" y="20" width="18" height="20" fill="#D1D5DB" rx="3" />
            <rect x="22" y="25" width="10" height="10" fill="#6366F1" rx="1" opacity="0.6" />
        </svg>
    ),
    generic: () => (
        <svg viewBox="0 0 120 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="120" height="64" fill="#F3F4F6" rx="3" />
            <rect x="8" y="12" width="104" height="40" fill="#E5E7EB" rx="3" strokeDasharray="3 2" stroke="#D1D5DB" strokeWidth="1" />
            <rect x="42" y="24" width="36" height="4" fill="#D1D5DB" rx="1" />
        </svg>
    ),
};

// ─── Block types ──────────────────────────────────────────────────────────────
type Badge = 'essential' | 'popular' | 'sales' | 'new';
interface Block { type: string; label: string; description: string; preview: keyof typeof Preview; badge?: Badge; defaultProps?: Record<string, any>; defaultStyles?: Record<string, string>; }
interface Category { id: string; label: string; emoji: string; blocks: Block[]; }

const CATEGORIES: Category[] = [
    {
        id: 'quickstart', label: 'Recommended', emoji: '⭐', blocks: [
            { type: SECTION_TYPES.HERO, label: 'Hero Banner', description: 'Large headline + CTA', preview: 'hero', badge: 'essential' },
            { type: SECTION_TYPES.PRODUCT_GRID, label: 'Product Grid', description: 'Bestsellers in a clean grid', preview: 'product_grid', badge: 'essential' },
            { type: SECTION_TYPES.TRUST_BADGES, label: 'Trust Badges', description: 'Shipping, checkout, returns', preview: 'trust', badge: 'essential' },
            { type: SECTION_TYPES.REVIEW_BLOCK, label: 'Customer Reviews', description: 'Social proof drives purchases', preview: 'reviews', badge: 'sales' },
        ]
    },
    {
        id: 'navigation', label: 'Navigation', emoji: '🧭', blocks: [
            { type: SECTION_TYPES.HEADER, label: 'Store Header', description: 'Logo, menu, search, cart', preview: 'nav', badge: 'essential' },
            { type: SECTION_TYPES.ANNOUNCEMENT_BAR, label: 'Announcement Bar', description: 'Highlight sales or news', preview: 'promo', badge: 'popular' },
        ]
    },
    {
        id: 'hero', label: 'Hero & Banners', emoji: '🖼️', blocks: [
            { type: SECTION_TYPES.HERO, label: 'Hero Banner', description: 'Headline + image + CTA', preview: 'hero', badge: 'essential' },
            { type: SECTION_TYPES.HERO_SPLIT, label: 'Split Hero', description: 'Left text / right image', preview: 'hero_split', badge: 'popular' },
            { type: SECTION_TYPES.PROMO_BANNER, label: 'Promo Strip', description: 'Limited-time offer banner', preview: 'promo', badge: 'sales' },
            { type: SECTION_TYPES.COUNTDOWN_BANNER, label: 'Countdown', description: 'Urgency flash sale timer', preview: 'countdown', badge: 'sales' },
        ]
    },
    {
        id: 'products', label: 'Products', emoji: '🛍️', blocks: [
            { type: SECTION_TYPES.PRODUCT_GRID, label: 'Product Grid', description: '3-column grid', preview: 'product_grid', badge: 'essential' },
            { type: SECTION_TYPES.FEATURED_PRODUCT, label: 'Featured Product', description: 'Spotlight one product', preview: 'featured_product', badge: 'popular' },
            { type: SECTION_TYPES.RECENTLY_VIEWED, label: 'Recently Viewed', description: 'Auto last-browsed', preview: 'product_grid', badge: 'sales' },
            { type: SECTION_TYPES.BEST_SELLERS, label: 'Best Sellers', description: 'Top-performing products', preview: 'product_grid', badge: 'popular' },
        ]
    },
    {
        id: 'commerce', label: 'Commerce', emoji: '💳', blocks: [
            { type: SECTION_TYPES.CART_DRAWER, label: 'Cart Drawer', description: 'Slide-out cart with upsells', preview: 'cart', badge: 'essential' },
            { type: SECTION_TYPES.CHECKOUT_BLOCK, label: 'Checkout', description: 'Streamlined purchase flow', preview: 'cart', badge: 'essential' },
            { type: SECTION_TYPES.UPSELL_WIDGET, label: 'Upsell Widget', description: 'Add-ons at checkout', preview: 'featured_product', badge: 'sales' },
        ]
    },
    {
        id: 'trust', label: 'Trust & Authority', emoji: '🛡️', blocks: [
            { type: SECTION_TYPES.TRUST_BADGES, label: 'Trust Badges', description: 'Secure, fast, easy returns', preview: 'trust', badge: 'essential' },
            { type: SECTION_TYPES.REVIEW_BLOCK, label: 'Customer Reviews', description: 'Stars and testimonials', preview: 'reviews', badge: 'sales' },
            { type: SECTION_TYPES.POLICY_BLOCK, label: 'Policy Strip', description: 'Return/privacy/shipping info', preview: 'trust' },
            { type: SECTION_TYPES.WHATSAPP_BUTTON, label: 'WhatsApp Button', description: 'Instant customer support', preview: 'generic', badge: 'popular' },
        ]
    },
    {
        id: 'content', label: 'Content', emoji: '📝', blocks: [
            { type: SECTION_TYPES.TEXT_BLOCK, label: 'Text Section', description: 'Heading, rich text, CTA', preview: 'text_block' },
            { type: SECTION_TYPES.FEATURE_BLOCK, label: 'Features Grid', description: 'Icon + title + text', preview: 'trust' },
            { type: SECTION_TYPES.IMAGE_BLOCK, label: 'Image Block', description: 'Full-width or contained', preview: 'hero' },
            { type: SECTION_TYPES.FAQ_BLOCK, label: 'FAQ Accordion', description: 'Questions & answers', preview: 'generic' },
        ]
    },
    {
        id: 'footer', label: 'Footer', emoji: '📌', blocks: [
            { type: SECTION_TYPES.FOOTER, label: 'Site Footer', description: 'Links, social, newsletter', preview: 'footer', badge: 'essential' },
            { type: SECTION_TYPES.NEWSLETTER, label: 'Newsletter Signup', description: 'Capture email leads', preview: 'promo', badge: 'popular' },
        ]
    },
];

const BADGE_CONFIG: Record<Badge, { label: string; color: string; bg: string }> = {
    essential: { label: '⭐ Essential', color: '#6366F1', bg: 'rgba(99,102,241,0.08)' },
    popular: { label: '🔥 Popular', color: '#F97316', bg: 'rgba(249,115,22,0.08)' },
    sales: { label: '🛒 Boosts Sales', color: '#10B981', bg: 'rgba(16,185,129,0.08)' },
    new: { label: '✨ New', color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)' },
};

// ─── Store progress ───────────────────────────────────────────────────────────
// ─── Conversion Score ─────────────────────────────────────────────────────────
const SCORE_ITEMS = [
    { key: 'header', label: 'Store Header', types: ['header'], pts: 10, tip: 'Builds brand trust' },
    { key: 'hero', label: 'Hero Banner', types: ['hero', 'hero_split'], pts: 20, tip: 'First impression drives clicks' },
    { key: 'featured', label: 'Featured Product', types: ['featured_product', 'best_sellers'], pts: 10, tip: 'Spotlight boosts CTR' },
    { key: 'products', label: 'Product Grid', types: ['product_grid'], pts: 20, tip: 'Core selling area' },
    { key: 'trust', label: 'Trust Badges', types: ['trust_badges', 'policy_block'], pts: 20, tip: 'Removes purchase hesitation' },
    { key: 'reviews', label: 'Reviews', types: ['review_block', 'social_proof'], pts: 15, tip: 'Social proof converts buyers' },
    { key: 'promo', label: 'Promo Banner', types: ['promo_strip', 'countdown', 'marquee'], pts: 5, tip: 'Urgency increases order value' },
];

const ConversionScore = memo(({ nodeTypes }: { nodeTypes: string[] }) => {
    const [open, setOpen] = useState(false);
    const items = SCORE_ITEMS.map(item => ({ ...item, done: item.types.some(t => nodeTypes.includes(t)) }));
    const score = items.reduce((sum, item) => sum + (item.done ? item.pts : 0), 0);
    const scoreColor = score >= 70 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444';
    const missing = items.filter(i => !i.done);

    return (
        <div style={{ borderBottom: `1px solid ${T.border}` }}>
            {/* Header row */}
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                aria-expanded={open}
                style={{
                    width: '100%', padding: '12px 16px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                }}
            >
                {/* Score circle */}
                <div style={{
                    width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                    background: `conic-gradient(${scoreColor} ${score * 3.6}deg, #F3F4F6 0deg)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative',
                }}>
                    <div style={{
                        position: 'absolute', inset: 4, borderRadius: '50%',
                        background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 800, color: scoreColor,
                    }}>{score}</div>
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.sub }}>Conversion Score</div>
                    <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>
                        {score >= 70 ? '🟢 Store ready to sell' : score >= 40 ? '🟡 Needs improvement' : '🔴 Missing key sections'}
                    </div>
                </div>
                <span style={{ fontSize: 12, color: T.faint, flexShrink: 0 }}>{open ? '▲' : '▼'}</span>
            </button>

            {/* Expanded detail */}
            {open && (
                <div style={{ padding: '0 16px 14px' }}>
                    {/* Bar */}
                    <div style={{ height: 6, background: '#F3F4F6', borderRadius: 6, marginBottom: 12, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${score}%`, background: scoreColor, borderRadius: 6, transition: 'width .4s ease' }} />
                    </div>
                    {/* Item list */}
                    {items.map(item => (
                        <div key={item.key} style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '5px 0', borderBottom: `1px solid ${T.border}`,
                        }}>
                            <span style={{ fontSize: 14 }}>{item.done ? '✅' : '❌'}</span>
                            <span style={{ fontSize: 12, fontWeight: 500, color: item.done ? T.sub : T.muted, flex: 1 }}>{item.label}</span>
                            {!item.done && (
                                <span style={{
                                    fontSize: 10, fontWeight: 700, color: scoreColor,
                                    background: score >= 70 ? '#ECFDF5' : score >= 40 ? '#FFFBEB' : '#FEF2F2',
                                    padding: '2px 6px', borderRadius: 4,
                                }}>+{item.pts} pts</span>
                            )}
                        </div>
                    ))}
                    {missing.length === 0 && (
                        <p style={{ margin: '10px 0 0', fontSize: 12, color: T.success, fontWeight: 600 }}>🎉 Perfect store setup!</p>
                    )}
                    {missing.length > 0 && (
                        <p style={{ margin: '10px 0 0', fontSize: 11, color: T.muted }}>Add the missing sections from the library above ↑</p>
                    )}
                </div>
            )}
        </div>
    );
});

// ─── Block card ───────────────────────────────────────────────────────────────
const BlockCard = memo(({ block, onAdd }: { block: Block; onAdd: (b: Block) => void }) => {
    const [hovered, setHovered] = useState(false);
    const PreviewComp = Preview[block.preview] || Preview.generic;
    const badge = block.badge ? BADGE_CONFIG[block.badge] : null;

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={() => onAdd(block)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onAdd(block); }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            aria-label={`Add ${block.label} section`}
            style={{
                background: hovered ? T.accentBg : 'rgba(255,255,255,0.02)',
                border: `1px solid ${hovered ? 'rgba(99,102,241,0.5)' : T.border}`,
                borderRadius: 12, cursor: 'pointer', overflow: 'hidden',
                transition: 'all .2s ease', marginBottom: 8,
                boxShadow: hovered ? '0 4px 12px rgba(99,102,241,0.15)' : 'none',
                outline: 'none'
            }}
        >
            {/* Preview */}
            <div style={{ width: '100%', height: 64, overflow: 'hidden', borderBottom: `1px solid ${T.border}`, background: 'rgba(0,0,0,0.2)', position: 'relative' }}>
                <div style={{ opacity: 0.6, transform: 'scale(0.9)', transformOrigin: 'top center' }}>
                    <PreviewComp />
                </div>
                {hovered && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(99,102,241,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ background: T.accent, color: '#fff', fontSize: 12, fontWeight: 700, padding: '4px 14px', borderRadius: 20 }}>+ Add</div>
                    </div>
                )}
            </div>
            {/* Info */}
            <div style={{ padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{block.label}</span>
                    {badge && (
                        <span style={{ fontSize: 10, fontWeight: 600, color: badge.color, background: badge.bg, padding: '2px 7px', borderRadius: 5, flexShrink: 0 }}>
                            {badge.label}
                        </span>
                    )}
                </div>
                <p style={{ fontSize: 11, color: T.muted, margin: 0, lineHeight: 1.5 }}>{block.description}</p>
            </div>
        </div>
    );
});

// ─── Category section ─────────────────────────────────────────────────────────
const CategorySection = memo(({ category, onAdd, query }: { category: Category; onAdd: (b: Block) => void; query: string }) => {
    const [open, setOpen] = useState(true);
    const filtered = useMemo(() => {
        if (!query) return category.blocks;
        const q = query.toLowerCase();
        return category.blocks.filter(b => b.label.toLowerCase().includes(q) || b.description.toLowerCase().includes(q));
    }, [category.blocks, query]);

    if (filtered.length === 0) return null;

    return (
        <div style={{ marginBottom: 2 }}>
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                aria-expanded={open}
                style={{
                    width: '100%', padding: '10px 16px',
                    background: 'none', border: 'none',
                    display: 'flex', alignItems: 'center', gap: 8,
                    cursor: 'pointer', textAlign: 'left',
                    position: 'sticky', top: 0, zIndex: 2,
                    backdropFilter: 'blur(8px)', backgroundColor: 'rgba(249,250,251,0.95)',
                    borderBottom: `1px solid ${T.border}`,
                }}
            >
                <span style={{ fontSize: 14 }}>{category.emoji}</span>
                <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: T.sub }}>{category.label}</span>
                <span style={{ fontSize: 11, color: T.faint, background: '#F3F4F6', padding: '1px 7px', borderRadius: 4 }}>
                    {filtered.length}
                </span>
                <ChevronRight size={13} color={T.faint} style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }} />
            </button>
            {open && (
                <div style={{ padding: '8px 12px' }}>
                    {filtered.map(b => <BlockCard key={b.type + b.label} block={b} onAdd={onAdd} />)}
                </div>
            )}
        </div>
    );
});

// ─── Main ElementLibrary ──────────────────────────────────────────────────────
interface Props { isOpen: boolean; onClose: () => void; }

export const ElementLibrary: React.FC<Props> = ({ isOpen, onClose }) => {
    const { addNode, selectNode, nodeTree } = useBuilder();
    const [query, setQuery] = useState('');

    const nodeTypes = useMemo(() => Object.values(nodeTree).map((n: any) => n.type).filter(Boolean), [nodeTree]);
    const allBlocks = useMemo(() => CATEGORIES.flatMap(c => c.blocks), []);
    const searchResults = useMemo(() => {
        if (!query.trim()) return [];
        const q = query.toLowerCase();
        return allBlocks.filter(b => b.label.toLowerCase().includes(q) || b.description.toLowerCase().includes(q) || b.type.toLowerCase().includes(q));
    }, [query, allBlocks]);

    const handleAdd = useCallback((block: Block) => {
        const id = addNode(block.type, { ...(block.defaultProps || {}), styles: block.defaultStyles || {} });
        if (id) selectNode(id);
    }, [addNode, selectNode]);

    if (!isOpen) return null;

    return (
        <aside style={{
            width: 320, height: '100vh', background: T.bg,
            backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)',
            borderRight: `1px solid ${T.border}`,
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden', flexShrink: 0,
            fontFamily: "'Inter', system-ui, sans-serif",
            position: 'relative', zIndex: 40
        }}>
            {/* Header */}
            <div style={{ padding: '24px 20px 16px', borderBottom: `1px solid ${T.border}`, background: 'transparent', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.text }}>Add sections</p>
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: T.muted }}>Click to add to your page</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close Element Library"
                        style={{ background: '#F3F4F6', border: 'none', borderRadius: 7, width: 30, height: 30, color: T.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <X size={15} />
                    </button>
                </div>
                {/* Search */}
                <div style={{ position: 'relative' }}>
                    <Search size={14} color={T.faint} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                        value={query} onChange={e => setQuery(e.target.value)}
                        placeholder="Search sections…"
                        aria-label="Search sections"
                        style={{
                            width: '100%', height: 40,
                            background: 'rgba(0,0,0,0.3)', border: `1px solid ${T.border}`,
                            borderRadius: 8, paddingLeft: 36, paddingRight: 12,
                            color: T.text, fontSize: 13, outline: 'none', boxSizing: 'border-box',
                            transition: 'border-color 0.2s',
                        }}
                        onFocus={e => (e.target.style.borderColor = T.accent)}
                        onBlur={e => (e.target.style.borderColor = T.border)}
                    />
                </div>
            </div>

            {/* Conversion Score */}
            <ConversionScore nodeTypes={nodeTypes} />

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 20 }}>
                {query.trim() ? (
                    <div style={{ padding: '12px 12px' }}>
                        {searchResults.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 20px', color: T.faint, fontSize: 13 }}>No results for "{query}"</div>
                        ) : (
                            <>
                                <p style={{ fontSize: 12, color: T.muted, marginBottom: 10 }}>{searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</p>
                                {searchResults.map(b => <BlockCard key={b.type + b.label} block={b} onAdd={handleAdd} />)}
                            </>
                        )}
                    </div>
                ) : (
                    CATEGORIES.map(cat => <CategorySection key={cat.id} category={cat} onAdd={handleAdd} query="" />)
                )}
            </div>

            {/* Tip */}
            <div style={{ padding: '10px 16px', borderTop: `1px solid ${T.border}`, background: T.bg, flexShrink: 0 }}>
                <p style={{ fontSize: 12, color: T.muted, margin: 0, textAlign: 'center' }}>
                    💡 Tip: Hero → Products → Trust Badges for a great store
                </p>
            </div>
        </aside>
    );
};
