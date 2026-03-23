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
import { PropertyPanel } from './properties/PropertyPanel'; // 🛡️ Load advanced Property Engine
import { PROP_CONFIGS } from './properties/propConfigurations';

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
        width: '100%', padding: '10px 12px',
        background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)',
        borderRadius: 8, color: 'var(--text-primary)', fontSize: '13px',
        fontFamily: 'inherit', outline: 'none',
        transition: 'border-color 0.15s',
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
                                    background: value ? 'var(--accent-subtle)' : 'var(--surface-overlay)',
                                    borderColor: value ? 'var(--accent-primary)' : 'var(--border-subtle)',
                                    color: value ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                    transition: 'all 0.15s',
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
import { NavigatorPanel } from './NavigatorPanel'; // 🛡️ Load Layers Tree

export const SmartSidebar: React.FC = () => {
    const {
        selectedNodeId, viewport, setViewport, mode, setMode
    } = useBuilder();

    const [activeTab, setActiveTab] = useState<'settings' | 'design'>('settings');
    const [emptyTab, setEmptyTab] = useState<'settings' | 'layers'>('layers'); // 🛡️ Default to layers tree

    // Only re-renders when selection changes
    const selectedNode = useNodeSelector(selectedNodeId || '', (n) => ({ id: n.id, type: n.type }));

    return (
        <div className="smart-sidebar" style={{ 
            width: window.innerWidth < 768 ? '100%' : '320px', 
            background: 'var(--surface-base)',
            height: '100vh', 
            borderLeft: '1px solid var(--border-subtle)', 
            display: 'flex', 
            flexDirection: 'column',
            zIndex: 40 
        }}>
            {/* Properties Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-overlay)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ padding: '6px', background: 'var(--accent-primary)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Settings size={14} color="#FFF" />
                    </div>
                    <div>
                        <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            {selectedNode ? 'Configuring Block' : 'Document'}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>
                            {selectedNode ? (selectedNode.type.replace(/_/g, ' ')) : 'Page Settings'}
                        </div>
                    </div>
                </div>
            </div>

            {selectedNode && (
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-overlay)' }}>
                    <button
                        onClick={() => setActiveTab('settings')}
                        style={{
                            flex: 1, padding: '14px', background: 'transparent', border: 'none',
                            color: activeTab === 'settings' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                            borderBottom: activeTab === 'settings' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                            fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                            transition: 'all 0.1s'
                        }}
                    >
                        Content
                    </button>
                    <button
                        onClick={() => setActiveTab('design')}
                        style={{
                            flex: 1, padding: '14px', background: 'transparent', border: 'none',
                            color: activeTab === 'design' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                            borderBottom: activeTab === 'design' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                            fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                            transition: 'all 0.1s'
                        }}
                    >
                        Style
                    </button>
                </div>
            )}

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                {!selectedNode ? (
                    <PageSettingsPanel />
                ) : (
                    activeTab === 'settings' ? (
                        (() => {
                            const { resolveComponentType } = require('./ComponentRegistry');
                            const realType = resolveComponentType(selectedNode.type);
                            
                            if (PROP_CONFIGS[realType]) return <PropertyPanel nodeId={selectedNode.id} />;
                            const ModuleEditor = MODULE_MAP[realType];
                            if (ModuleEditor) return <ModuleEditor nodeId={selectedNode.id} />;
                            const entry = getRegistryEntry(selectedNode.type); // entry can use original if it supports it, or realType. keeping is fine.
                            if (entry?.propSchema) return <GenericSchemaEditor nodeId={selectedNode.id} schema={entry.propSchema} />;
                            return (
                                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', padding: '16px', textAlign: 'center', border: '1px dashed var(--border-subtle)', borderRadius: '8px' }}>
                                    This component has no editable properties.
                                </div>
                            );
                        })()
                    ) : (
                        <StyleEditorPanel nodeId={selectedNode.id} />
                    )
                )}
            </div>
        </div>
    );
};
