import React, { useMemo, useState } from 'react';
import { useBuilder } from '../../context/BuilderContext';
import { BLOCK_TYPES as SECTION_TYPES, getRegistryEntry } from '../../platform/core/Registry';
import { useNodeSelector } from '../../hooks/useNodeSelector';
import { dispatcher } from '../../platform/core/Dispatcher';
import {
    Settings, Type, ImageIcon, Layout,
    Layers, Package, Monitor, Smartphone, Tablet,
    ChevronRight, ChevronDown, Plus, Trash2, Copy,
    ArrowUp, ArrowDown, Search, Brain, EyeOff
} from 'lucide-react';
import { StyleEditorPanel } from './StyleEditorPanel';
import { PageSettingsPanel } from './PageSettingsPanel';
import { MediaLibraryModal } from './MediaLibraryModal';

// Property Module Imports
import { FeatureGridv5 as FeatureGridv5Editor } from '../../platform/library/modules/FeatureGridv5';
import { IntelligenceEditor } from './editors/IntelligenceEditor';
import { ProductGridEditor } from './editors/ProductGridEditor';
import { FeaturedProductEditor } from './editors/FeaturedProductEditor';
import { LinkPickerEditor } from './editors/LinkPickerEditor';

const MODULE_MAP: Record<string, React.FC<any>> = {
    [SECTION_TYPES.HERO]: () => <div>Hero Properties (Legacy Slot)</div>,
    [SECTION_TYPES.PRODUCT_GRID]: ProductGridEditor,
    [SECTION_TYPES.FEATURE_GRID_V5]: FeatureGridv5Editor,
    [SECTION_TYPES.RECENTLY_VIEWED]: IntelligenceEditor,
    [SECTION_TYPES.SMART_SEARCH]: IntelligenceEditor,
    [SECTION_TYPES.FEATURED_PRODUCT]: FeaturedProductEditor,
};

/**
 * GenericSchemaEditor: Deterministic Property Binding via Dispatcher
 */
/** * UPDATED: Added Deep Path Support & Field Types 
 */
const GenericSchemaEditor: React.FC<{ nodeId: string; schema: any }> = ({ nodeId, schema }) => {
    const node = useNodeSelector(nodeId, (n) => ({ props: n.props }));
    const [mediaField, setMediaField] = useState<string | null>(null);
    if (!node || !schema) return null;

    const handleChange = (path: string, value: any) => {
        // Impact-Aware Dispatch — FIXED: removed trailing space corruption
        dispatcher.dispatch({
            nodeId,
            path: path.startsWith('props.') ? path : `props.${path}`,
            value,
            type: 'visual',
            source: 'editor'
        });
    };

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '10px 14px',
        background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-primary)',
        borderRadius: 10, color: '#fff', fontSize: '13px',
        fontFamily: 'inherit', outline: 'none',
        transition: 'all 0.3s var(--ease-cinematic)',
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Object.entries(schema).map(([key, field]: [string, any]) => {
                const value = key.split('.').reduce((acc, part) => acc && acc[part], node.props);

                return (
                    <div key={key} className="prop-field">
                        <label style={{ fontSize: '11px', color: '#71717a', marginBottom: '4px', display: 'block' }}>
                            {field.label || key}
                        </label>

                        {/* ── Text Input ─────────────────────────────── */}
                        {field.type === 'text' && (
                            <input
                                type="text"
                                value={value ?? ''}
                                onChange={(e) => handleChange(key, e.target.value)}
                                style={inputStyle}
                                placeholder={field.label}
                            />
                        )}

                        {/* ── Number Input ───────────────────────────── */}
                        {field.type === 'number' && (
                            <input
                                type="number"
                                value={value ?? 0}
                                onChange={(e) => handleChange(key, Number(e.target.value))}
                                style={inputStyle}
                                min={field.min}
                                max={field.max}
                                step={field.step}
                            />
                        )}

                        {/* ── Slider (Range) Input ──────────────────── */}
                        {field.type === 'slider' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <input
                                    type="range"
                                    min={field.min ?? 0}
                                    max={field.max ?? 100}
                                    step={field.step ?? 1}
                                    value={value ?? field.min ?? 0}
                                    onChange={(e) => handleChange(key, Number(e.target.value))}
                                    style={{ flex: 1, accentColor: '#7c6dfa' }}
                                />
                                <span style={{ fontSize: 11, color: '#a1a1aa', minWidth: 28, textAlign: 'right' }}>
                                    {value ?? field.min ?? 0}{field.unit || ''}
                                </span>
                            </div>
                        )}

                        {/* ── Select Dropdown ──────────────────────── */}
                        {field.type === 'select' && (
                            <select
                                value={value ?? ''}
                                onChange={(e) => handleChange(key, e.target.value)}
                                style={{ ...inputStyle, cursor: 'pointer' }}
                            >
                                {field.options?.map((opt: any) => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        )}

                        {/* ── Boolean Toggle ──────────────────────── */}
                        {field.type === 'boolean' && (
                            <button
                                onClick={() => handleChange(key, !value)}
                                style={{
                                    padding: '6px 14px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                                    cursor: 'pointer', border: '1px solid',
                                    background: value ? 'rgba(var(--accent-gold-rgb), 0.1)' : 'rgba(255,255,255,0.03)',
                                    borderColor: value ? 'var(--accent-gold)' : 'var(--border-primary)',
                                    color: value ? 'var(--accent-gold)' : 'var(--text-secondary)',
                                    transition: 'all 0.3s var(--ease-cinematic)',
                                }}
                            >
                                {value ? '● ACTIVE' : '○ INACTIVE'}
                            </button>
                        )}

                        {/* ── Link Picker (Internal/External) ───────── */}
                        {field.type === 'link' && (
                            <LinkPickerEditor 
                                value={value ?? ''} 
                                onChange={(val) => handleChange(key, val)} 
                                label={field.label} 
                            />
                        )}

                        {/* ── Color Picker ─────────────────────────── */}
                        {field.type === 'color' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <input
                                    type="color"
                                    value={value ?? '#7c6dfa'}
                                    onChange={(e) => handleChange(key, e.target.value)}
                                    style={{
                                        width: 32, height: 32, border: '1px solid #2a2a3a',
                                        borderRadius: 6, background: 'transparent', cursor: 'pointer',
                                        padding: 2,
                                    }}
                                />
                                <input
                                    type="text"
                                    value={value ?? '#7c6dfa'}
                                    onChange={(e) => handleChange(key, e.target.value)}
                                    style={{ ...inputStyle, flex: 1, fontFamily: 'monospace', fontSize: 11 }}
                                />
                            </div>
                        )}

                        {/* ── Image Picker with Media Library ─────── */}
                        {field.type === 'image' && (
                            <div>
                                {value && (
                                    <div style={{
                                        width: '100%', height: 80, borderRadius: 8,
                                        overflow: 'hidden', marginBottom: 6,
                                        background: '#1a1a24', border: '1px solid #2a2a3a',
                                    }}>
                                        <img src={value as string} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                )}
                                <button
                                    onClick={() => setMediaField(key)}
                                    style={{
                                        width: '100%', padding: '7px 12px',
                                        background: '#1a1a24', border: '1px solid #2a2a3a',
                                        borderRadius: 6, color: '#8b8ba0', fontSize: 11,
                                        fontWeight: 600, cursor: 'pointer',
                                        transition: 'border-color 0.15s',
                                    }}
                                >
                                    📁 {value ? 'Replace Image' : 'Open Media Library'}
                                </button>
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Media Library Modal */}
            <MediaLibraryModal
                isOpen={!!mediaField}
                onClose={() => setMediaField(null)}
                onSelect={(url) => { if (mediaField) handleChange(mediaField, url); setMediaField(null); }}
                merchantId="default"
            />
        </div>
    );
};
export const SmartSidebar: React.FC = () => {
    const {
        selectedNodeId, viewport, setViewport, mode, setMode
    } = useBuilder();

    const [activeTab, setActiveTab] = useState<'settings' | 'design'>('settings');

    // Only re-renders when selection changes
    const selectedNode = useNodeSelector(selectedNodeId || '', (n) => ({ id: n.id, type: n.type }));

    return (
        <div className="smart-sidebar" style={{ 
            width: '340px', 
            background: 'var(--bg-surface)',
            backdropFilter: 'var(--glass-blur)',
            WebkitBackdropFilter: 'var(--glass-blur)',
            height: '100vh', 
            borderLeft: '1px solid var(--border-primary)', 
            display: 'flex', 
            flexDirection: 'column',
            zIndex: 40 
        }}>
            {/* Top Toolbar */}
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-primary)' }}>
                <div style={{ display: 'flex', gap: '4px', padding: '4px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid var(--border-primary)' }}>
                    <button
                        onClick={() => setMode('edit')}
                        style={{ flex: 1, padding: '8px', borderRadius: '8px', background: mode === 'edit' ? 'var(--accent-gold)' : 'transparent', border: 'none', color: mode === 'edit' ? '#000' : 'var(--text-secondary)', fontSize: '12px', fontWeight: 800, cursor: 'pointer', transition: 'all 0.3s' }}
                    >BUILD</button>
                    <button
                        onClick={() => setMode('preview')}
                        style={{ flex: 1, padding: '8px', borderRadius: '8px', background: mode === 'preview' ? 'var(--accent-gold)' : 'transparent', border: 'none', color: mode === 'preview' ? '#000' : 'var(--text-secondary)', fontSize: '12px', fontWeight: 800, cursor: 'pointer', transition: 'all 0.3s' }}
                    >EYE</button>
                </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
                {!selectedNode ? (
                    <div style={{ padding: '1rem' }}>
                        <PageSettingsPanel />
                    </div>
                ) : (
                    <>
                        {/* Two-Tab Navigation */}
                        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-primary)' }}>
                            <button
                                onClick={() => setActiveTab('settings')}
                                style={{
                                    flex: 1, padding: '16px', background: 'transparent', border: 'none',
                                    color: activeTab === 'settings' ? 'var(--accent-gold)' : 'var(--text-secondary)',
                                    borderBottom: activeTab === 'settings' ? '2px solid var(--accent-gold)' : '2px solid transparent',
                                    fontSize: '11px', fontWeight: 800, cursor: 'pointer',
                                    letterSpacing: '0.1em',
                                    transition: 'all 0.3s var(--ease-cinematic)'
                                }}
                            >
                                SETTINGS
                            </button>
                            <button
                                onClick={() => setActiveTab('design')}
                                style={{
                                    flex: 1, padding: '16px', background: 'transparent', border: 'none',
                                    color: activeTab === 'design' ? 'var(--accent-gold)' : 'var(--text-secondary)',
                                    borderBottom: activeTab === 'design' ? '2px solid var(--accent-gold)' : '2px solid transparent',
                                    fontSize: '11px', fontWeight: 800, cursor: 'pointer',
                                    letterSpacing: '0.1em',
                                    transition: 'all 0.3s var(--ease-cinematic)'
                                }}
                            >
                                DESIGN
                            </button>
                        </div>

                        <div style={{ padding: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                <div style={{ padding: '6px', background: 'var(--accent-primary, #7c6dfa)', borderRadius: '4px' }}>
                                    <Settings size={14} color="#000" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '10px', color: '#a1a1aa', fontWeight: 700, textTransform: 'uppercase' }}>Configuring</div>
                                    <div style={{ fontSize: '13px', color: '#fff', fontWeight: 600 }}>{selectedNode.type}</div>
                                </div>
                            </div>

                            {activeTab === 'settings' ? (
                                // Tab 1: Props Settings
                                (() => {
                                    const ModuleEditor = MODULE_MAP[selectedNode.type];
                                    if (ModuleEditor) return <ModuleEditor nodeId={selectedNode.id} />;

                                    const entry = getRegistryEntry(selectedNode.type);
                                    if (entry?.propSchema) {
                                        return <GenericSchemaEditor nodeId={selectedNode.id} schema={entry.propSchema} />;
                                    }

                                    return (
                                        <div style={{ fontSize: '11px', color: '#52525b', padding: '1rem', textAlign: 'center', border: '1px dashed #27272a', borderRadius: '8px' }}>
                                            This component has no advanced properties defined in the Registry.
                                        </div>
                                    );
                                })()
                            ) : (
                                // Tab 2: Visual Design Settings
                                <StyleEditorPanel nodeId={selectedNode.id} />
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
