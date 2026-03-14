/**
 * StoreHeader: Smart Navigation Block
 *
 * Primary store navigation with reactive cart badge.
 * Reads cart state via useCartSelector for surgical re-renders.
 * Registered in BuilderRegistry as 'store_header'.
 */
import React, { useState } from 'react';
import { useCartSelector, cartActions } from '../../hooks/useCart';
import { useStorefront } from '../../context/StorefrontContext';

// ─── Design Tokens ────────────────────────────────────────────────────────────

const T = {
    bg: 'rgba(10,10,15,0.85)',
    surface: '#13131a',
    border: '#2a2a3a',
    accent: '#7c6dfa',
    accentDim: 'rgba(124,109,250,0.12)',
    text: '#f0f0f5',
    textDim: '#8b8ba0',
};

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface HeaderNavLink {
    label: string;
    url: string;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface StoreHeaderProps {
    nodeId: string;
    storeName?: string;
    showSearch?: boolean;
    sticky?: boolean;
    navLinks?: HeaderNavLink[];
    children?: React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const StoreHeader: React.FC<StoreHeaderProps> = ({
    nodeId,
    storeName,
    showSearch = true,
    sticky = true,
    navLinks = [],
}) => {
    const { state } = useStorefront();
    const displayName = storeName || state.settings.name || 'Store';
    const totalItems = useCartSelector(s => s.totalItems);
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            alert(`Search for: "${searchQuery.trim()}"`);
        }
    };

    // Resolve links: prefer prop navLinks, fallback to global storefront nav
    const resolvedLinks: HeaderNavLink[] = navLinks.length > 0
        ? navLinks
        : (state.settings as any).navLinks || [];

    return (
        <header
            data-node-id={nodeId}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 28px',
                background: T.bg,
                backdropFilter: 'blur(16px)',
                borderBottom: `1px solid ${T.border}`,
                fontFamily: "'Inter', -apple-system, sans-serif",
                position: sticky ? 'sticky' : 'relative',
                top: 0,
                zIndex: 9990,
                gap: 16,
            }}
        >
            {/* Logo / Store Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: `linear-gradient(135deg, ${T.accent}, #9b8aff)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 900, color: '#fff',
                }}>
                    {displayName.charAt(0).toUpperCase()}
                </div>
                <span style={{
                    fontSize: 16, fontWeight: 800, color: T.text,
                    letterSpacing: '-0.02em',
                }}>
                    {displayName}
                </span>
            </div>

            {/* Navigation Links */}
            {resolvedLinks.length > 0 && (
                <nav style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                    {resolvedLinks.map((link, i) => (
                        <a
                            key={i}
                            href={link.url}
                            style={{
                                color: T.textDim, fontSize: 13, fontWeight: 600,
                                textDecoration: 'none', transition: 'color 0.15s',
                                whiteSpace: 'nowrap',
                            }}
                            onMouseEnter={e => { (e.target as HTMLElement).style.color = T.text; }}
                            onMouseLeave={e => { (e.target as HTMLElement).style.color = T.textDim; }}
                        >
                            {link.label}
                        </a>
                    ))}
                </nav>
            )}

            {/* Center: Search */}
            {showSearch && (
                <form
                    onSubmit={handleSearchSubmit}
                    style={{
                        flex: '0 1 360px',
                        position: 'relative',
                    }}
                >
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '9px 16px 9px 36px',
                            background: T.surface,
                            border: `1px solid ${T.border}`,
                            borderRadius: 10,
                            color: T.text,
                            fontSize: 13,
                            fontWeight: 500,
                            outline: 'none',
                            fontFamily: 'inherit',
                            transition: 'border-color 0.15s',
                        }}
                        onFocus={e => e.currentTarget.style.borderColor = T.accent}
                        onBlur={e => e.currentTarget.style.borderColor = T.border}
                    />
                    <span style={{
                        position: 'absolute', left: 12, top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: 14, opacity: 0.4,
                    }}>
                        🔍
                    </span>
                </form>
            )}

            {/* Right: Cart Icon */}
            <button
                onClick={cartActions.openCart}
                style={{
                    position: 'relative',
                    background: 'transparent',
                    border: `1px solid ${T.border}`,
                    borderRadius: 10,
                    padding: '8px 14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    color: T.text,
                    fontSize: 14,
                    fontWeight: 600,
                    transition: 'all 0.15s',
                    fontFamily: 'inherit',
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.borderColor = T.accent;
                    e.currentTarget.style.background = T.accentDim;
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.borderColor = T.border;
                    e.currentTarget.style.background = 'transparent';
                }}
            >
                <span style={{ fontSize: 16 }}>🛒</span>
                <span style={{ fontSize: 13, color: T.textDim }}>Cart</span>

                {/* Dynamic Badge */}
                {totalItems > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: -6, right: -6,
                        minWidth: 20, height: 20,
                        borderRadius: 10,
                        background: T.accent,
                        color: '#fff',
                        fontSize: 10,
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 5px',
                        boxShadow: `0 2px 8px rgba(124,109,250,0.4)`,
                        animation: 'omnoraHeaderBadgePop 0.3s cubic-bezier(0.16,1,0.3,1)',
                    }}>
                        {totalItems > 99 ? '99+' : totalItems}
                    </span>
                )}
            </button>

            <style>{`
                @keyframes omnoraHeaderBadgePop {
                    0% { transform: scale(0); }
                    60% { transform: scale(1.2); }
                    100% { transform: scale(1); }
                }
            `}</style>
        </header>
    );
};

export default StoreHeader;
