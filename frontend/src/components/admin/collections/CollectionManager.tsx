import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Layers, Plus, Search, Filter, Trash2, ArrowUpDown, CheckCircle, Settings, ChevronRight } from 'lucide-react';

export const CollectionManager: React.FC = () => {
    const [collections, setCollections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newCollection, setNewCollection] = useState({
        title: '', description: '', type: 'manual', slug: '', conditions: []
    });

    useEffect(() => {
        fetchCollections();
    }, []);

    const fetchCollections = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('collections')
            .select('*')
            .order('created_at', { ascending: false });
        if (!error) setCollections(data || []);
        setLoading(false);
    };

    const handleCreate = async () => {
        const slug = newCollection.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
        const { error } = await supabase
            .from('collections')
            .insert({ ...newCollection, slug });
        if (!error) {
            setIsCreating(false);
            fetchCollections();
        }
    };

    const InputStyle = { 
        width: '100%', padding: '10px 12px', background: '#09090b', border: '1px solid #27272a', 
        borderRadius: 8, color: '#fff', fontSize: '13px', outline: 'none' 
    };

    const CollectionTypeCard = ({ type, label, active }: any) => (
        <button 
            onClick={() => setNewCollection({...newCollection, type})}
            style={{ 
                flex: 1, padding: 20, background: active ? 'rgba(255, 107, 53, 0.1)' : '#09090b',
                border: active ? '1px solid #FF6B35' : '1px solid #27272a', borderRadius: 12,
                color: active ? '#FF6B35' : '#71717a', cursor: 'pointer', textAlign: 'left'
            }}
        >
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 11 }}>{type === 'manual' ? 'Add products one by one' : 'Automatically include products based on conditions'}</div>
        </button>
    );

    return (
        <div style={{ padding: 24 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Collections</h1>
                    <p style={{ fontSize: 13, color: '#71717a' }}>Group products to organize your store</p>
                </div>
                {!isCreating && (
                    <button onClick={() => setIsCreating(true)} style={{ padding: '10px 20px', background: '#FF6B35', color: '#fff', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Plus size={18} /> Create Collection
                    </button>
                )}
            </div>

            {isCreating && (
                <div style={{ background: '#131316', border: '1px solid #27272a', borderRadius: 12, padding: 32, marginBottom: 32 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 24 }}>New Collection</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32 }}>
                        <div>
                            <div style={{ marginBottom: 20 }}>
                                <label style={{ fontSize: 12, color: '#a1a1aa', fontWeight: 600, display: 'block', marginBottom: 8 }}>Title</label>
                                <input placeholder="e.g. Summer Collection" value={newCollection.title} onChange={e => setNewCollection({...newCollection, title: e.target.value})} style={InputStyle} />
                            </div>
                            <div style={{ marginBottom: 24 }}>
                                <label style={{ fontSize: 12, color: '#a1a1aa', fontWeight: 600, display: 'block', marginBottom: 8 }}>Description</label>
                                <textarea rows={4} value={newCollection.description} onChange={e => setNewCollection({...newCollection, description: e.target.value})} style={{...InputStyle, resize: 'none'}} />
                            </div>
                            
                            <label style={{ fontSize: 12, color: '#a1a1aa', fontWeight: 600, display: 'block', marginBottom: 12 }}>Collection Type</label>
                            <div style={{ display: 'flex', gap: 16 }}>
                                <CollectionTypeCard type="manual" label="Manual" active={newCollection.type === 'manual'} />
                                <CollectionTypeCard type="smart" label="Automated (Smart)" active={newCollection.type === 'smart'} />
                            </div>

                            {newCollection.type === 'smart' && (
                                <div style={{ marginTop: 24, padding: 20, background: '#09090b', border: '1px dashed #27272a', borderRadius: 12 }}>
                                    <div style={{ display: 'flex', items: 'center', gap: 8, marginBottom: 16 }}>
                                        <Filter size={14} color="#FF6B35" />
                                        <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Conditions Builder</span>
                                    </div>
                                    <p style={{ fontSize: 12, color: '#71717a' }}>Products must match: Title contains "Summer"</p>
                                    <button style={{ marginTop: 12, fontSize: 12, color: '#FF6B35', background: 'transparent', border: 'none', fontWeight: 600, cursor: 'pointer' }}>+ Add Condition</button>
                                </div>
                            )}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 40, justifyContent: 'flex-end', borderTop: '1px solid #27272a', paddingTop: 24 }}>
                        <button onClick={() => setIsCreating(false)} style={{ padding: '10px 20px', background: 'transparent', color: '#71717a', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                        <button onClick={handleCreate} style={{ padding: '10px 24px', background: '#FF6B35', color: '#fff', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer' }}>Save Collection</button>
                    </div>
                </div>
            )}

            {/* List */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                {loading ? (
                    <div style={{ color: '#71717a' }}>Loading collections...</div>
                ) : collections.map(c => (
                    <div key={c.id} style={{ background: '#131316', border: '1px solid #27272a', borderRadius: 16, overflow: 'hidden', cursor: 'pointer' }}>
                        <div style={{ height: 120, background: '#1c1c22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {c.image_url ? <img src={c.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Layers size={40} color="#27272a" />}
                        </div>
                        <div style={{ padding: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{c.title}</h3>
                                <ChevronRight size={16} color="#71717a" />
                            </div>
                            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                <span style={{ fontSize: 11, color: '#71717a' }}>{c.product_count || 0} Products</span>
                                <span style={{ width: 4, height: 4, borderRadius: 2, background: '#27272a' }}></span>
                                <span style={{ fontSize: 10, color: '#a1a1aa', fontWeight: 800, textTransform: 'uppercase' }}>{c.type}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
