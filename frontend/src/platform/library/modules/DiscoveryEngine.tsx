import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Plus } from 'lucide-react';
import { useOmnora } from '../../client/OmnoraContext';
import { EditableText } from '../EditableComponents';
import { PureRecursiveNode } from '../../client/OmnoraRenderer';

/**
 * OmnoraMegaMenu: Recursive navigation module with dropdown physics.
 */
export const OmnoraMegaMenu: React.FC<{ nodeId: string }> = ({ nodeId }) => {
    const { nodes } = useOmnora();
    const node = nodes[nodeId];
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    if (!node) return null;

    const navLinks = node.children || [];

    return (
        <nav className="omnora-megamenu" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            padding: node.styles?.padding || '0 20px',
            height: node.styles?.height || '80px',
            background: node.styles?.background || 'transparent',
            ...node.styles
        }}>
            {(node.children || []).map((childId: string) => (
                <MenuLink key={childId} nodeId={childId} parentId={nodeId} />
            ))}
        </nav>
    );
};

const MenuLink: React.FC<{ nodeId: string, parentId: string }> = ({ nodeId }) => {
    const { nodes, mode, selectNode } = useOmnora();
    const [isHovered, setIsHovered] = useState(false);
    const node = nodes[nodeId];

    if (!node) return null;

    const hasChildren = node.children && node.children.length > 0;

    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => setIsHovered(false);

    const isHoveredForced = node.forcedState === 'hover';
    const showDropdown = isHovered || isHoveredForced;

    const dropdownStyle: React.CSSProperties = {
        position: 'absolute',
        top: '100%',
        left: 0,
        minWidth: '240px',
        background: '#0a0a0b',
        border: '1px solid #1a1a1b',
        padding: '20px',
        opacity: showDropdown ? 1 : 0,
        visibility: showDropdown ? 'visible' : 'hidden',
        transform: showDropdown ? 'translateY(0)' : 'translateY(10px)',
        transition: `all ${node.motion?.duration || 300}ms cubic-bezier(0.16, 1, 0.3, 1)`,
        zIndex: 1000,
        ...((isHovered || isHoveredForced) ? node.interactions?.hover : {})
    };

    return (
        <div
            className="menu-item-container"
            style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <a href="#" style={{
                textDecoration: 'none',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 900,
                letterSpacing: '0.1em',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
            }}>
                <EditableText nodeId={nodeId} path="props.label" tag="span" />
                {hasChildren && <ChevronDown size={10} />}
            </a>

            {hasChildren && (
                <div className="mega-dropdown" style={dropdownStyle}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                        {(node.children || []).map((childId: string) => (
                            <PureRecursiveNode key={childId} id={childId} />
                        ))}
                    </div>

                    {/* Promo Image Slot (Conditional render if configured) */}
                    {node.props?.showPromo && (
                        <div className="dropdown-promo" style={{ marginTop: '20px', borderTop: '1px solid #1a1a1b', paddingTop: '20px' }}>
                            <div style={{ width: '100%', height: '120px', background: '#111', borderRadius: '4px' }} />
                            <div style={{ marginTop: '10px' }}>
                                <EditableText nodeId={nodeId} path="props.promoText" style={{ fontSize: '9px', fontWeight: 900 }} />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

/**
 * OmnoraSmartSearch: Autocomplete search bar with manifest-controlled focus state.
 */
export const OmnoraSmartSearch: React.FC<{ nodeId: string }> = ({ nodeId }) => {
    const { nodes, mode } = useOmnora();
    const [isFocused, setIsFocused] = useState(false);
    const node = nodes[nodeId];

    if (!node) return null;

    const isActiveForced = node.forcedState === 'active';
    const showResults = isFocused || isActiveForced;

    const baseStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        background: node.styles?.background || 'rgba(255,255,255,0.03)',
        border: `1px solid ${(isFocused || isActiveForced) ? 'var(--accent-primary)' : (node.styles?.borderColor || '#1a1a1b')}`,
        borderRadius: node.styles?.borderRadius || '4px',
        height: node.styles?.height || '44px',
        width: '100%',
        transition: 'all 0.3s ease',
        position: 'relative',
        ...node.styles
    };

    return (
        <div className="omnora-smart-search" style={{ width: '100%' }}>
            <div style={baseStyle}>
                <Search size={14} color={(isFocused || isActiveForced) ? 'var(--accent-primary)' : '#555'} />
                <input
                    type="text"
                    placeholder=""
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    style={{
                        flex: 1,
                        background: 'none',
                        border: 'none',
                        outline: 'none',
                        color: '#fff',
                        fontSize: '11px',
                        fontWeight: 500,
                        marginLeft: '12px',
                        width: '100%'
                    }}
                />
                <div style={{ position: 'absolute', left: '44px', pointerEvents: 'none' }}>
                    {(!isFocused && !isActiveForced) && <EditableText nodeId={nodeId} path="props.placeholder" style={{ opacity: 0.3 }} />}
                </div>
            </div>

            {/* Global Focus State Control specifically from Sidebar */}
            {showResults && (
                <div className="search-results-dropdown" style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    right: 0,
                    background: '#0a0a0b',
                    border: '1px solid #1a1a1b',
                    borderRadius: '8px',
                    padding: '12px',
                    zIndex: 2000,
                    boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                }}>
                    <span style={{ fontSize: '9px', fontWeight: 900, color: '#555', letterSpacing: '0.1em' }}>QUICK RESULTS</span>
                    <div style={{ marginTop: '12px', display: 'grid', gap: '8px' }}>
                        {[1, 2, 3].map(i => (
                            <div key={i} style={{ padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', fontSize: '10px' }}>
                                Result Piece {i}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
