import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Save, Copy, Image as ImageIcon, Trash2, Plus, ArrowLeft, Globe, ChevronDown, List } from 'lucide-react';

interface Option {
    name: string;
    values: string[];
}

interface Variant {
    id?: string;
    title: string;
    option1: string | null;
    option2: string | null;
    option3: string | null;
    price: number;
    compare_price?: number;
    sku?: string;
    inventory_count: number;
}

export const ProductEditor: React.FC<{ productId?: string; onBack: () => void }> = ({ productId, onBack }) => {
    const [product, setProduct] = useState<any>({
        title: '', description: '', price: 0, compare_price: 0,
        status: 'draft', images: [], slug: '', seo_title: '', seo_description: ''
    });
    const [options, setOptions] = useState<Option[]>([]);
    const [variants, setVariants] = useState<Variant[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (productId) fetchProductData();
    }, [productId]);

    const fetchProductData = async () => {
        setLoading(true);
        const { data: prod } = await supabase.from('products').select('*').eq('id', productId).single();
        const { data: opts } = await supabase.from('product_options').select('*').eq('product_id', productId).order('position');
        const { data: vars } = await supabase.from('product_variants').select('*').eq('product_id', productId).order('position');
        
        if (prod) setProduct(prod);
        if (opts) setOptions(opts.map(o => ({ name: o.name, values: o.values })));
        if (vars) setVariants(vars);
        setLoading(false);
    };

    // --- Variant Matrix Generator (Industrial Grade) ---
    const generateVariants = () => {
        if (options.length === 0) return;

        const cartesian = (...args: any[][]) => args.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())));
        const combinations = options.length === 1 
            ? options[0].values.map(v => [v]) 
            : cartesian(...options.map(o => o.values));

        const newVariants = combinations.map((combo: string[]) => {
            const title = combo.join(' / ');
            const o1 = combo[0] || null;
            const o2 = combo[1] || null;
            const o3 = combo[2] || null;

            // PRESERVATION LOGIC: Match existing variant to keep data
            const existing = variants.find(v => v.option1 === o1 && v.option2 === o2 && v.option3 === o3);
            
            return existing || {
                title,
                option1: o1, option2: o2, option3: o3,
                price: product.price,
                inventory_count: 0
            };
        });

        setVariants(newVariants);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // 1. Upsert Product
            const { data: savedProd, error: pError } = await supabase.from('products').upsert({
                ...product,
                updated_at: new Date().toISOString()
            }).select().single();
            if (pError) throw pError;

            const pid = savedProd.id;

            // 2. Sync Options (Delete & Re-insert)
            await supabase.from('product_options').delete().eq('product_id', pid);
            await supabase.from('product_options').insert(options.map((o, i) => ({
                product_id: pid, name: o.name, values: o.values, position: i
            })));

            // 3. Sync Variants
            await supabase.from('product_variants').delete().eq('product_id', pid);
            await supabase.from('product_variants').insert(variants.map((v, i) => ({
                ...v, product_id: pid, position: i
            })));

            onBack();
        } catch (err) {
            console.error('[Product Engine] Save Failed:', err);
        } finally {
            setSaving(false);
        }
    };

    const addOption = () => setOptions([...options, { name: 'New Option', values: [] }]);
    const removeOption = (idx: number) => setOptions(options.filter((_, i) => i !== idx));

    if (loading) return <div>Loading Engine...</div>;

    const InputStyle = { 
        width: '100%', padding: '12px', background: '#09090b', border: '1px solid #27272a', 
        borderRadius: 8, color: '#fff', fontSize: '13px', outline: 'none' 
    };

    const SectionStyle = { background: '#131316', border: '1px solid #27272a', borderRadius: 12, padding: 24, marginBottom: 24 };

    return (
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 20px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer' }}><ArrowLeft /></button>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>{productId ? 'Edit Product' : 'New Product'}</h1>
                </div>
                <button onClick={handleSave} disabled={saving} style={{ padding: '10px 24px', background: '#FF6B35', color: '#fff', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer' }}>
                    {saving ? 'Saving...' : 'Save Product'}
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
                {/* Left Column */}
                <div>
                    {/* Basic Info */}
                    <div style={SectionStyle}>
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ fontSize: 12, color: '#a1a1aa', fontWeight: 600, display: 'block', marginBottom: 8 }}>Title</label>
                            <input value={product.title} onChange={e => setProduct({...product, title: e.target.value})} style={InputStyle} />
                        </div>
                        <div>
                            <label style={{ fontSize: 12, color: '#a1a1aa', fontWeight: 600, display: 'block', marginBottom: 8 }}>Description</label>
                            <textarea rows={6} value={product.description} onChange={e => setProduct({...product, description: e.target.value})} style={{...InputStyle, resize: 'vertical'}} />
                        </div>
                    </div>

                    {/* Options (Variants) */}
                    <div style={SectionStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>Variants</h3>
                            <button onClick={addOption} style={{ fontSize: 12, color: '#FF6B35', background: 'transparent', border: 'none', fontWeight: 600, cursor: 'pointer' }}>+ Add Option</button>
                        </div>

                        {options.map((opt, oIdx) => (
                            <div key={oIdx} style={{ marginBottom: 20, padding: 16, background: '#09090b', borderRadius: 10 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <input value={opt.name} onChange={e => {
                                        const next = [...options]; next[oIdx].name = e.target.value; setOptions(next);
                                    }} style={{ ...InputStyle, width: '40%' }} />
                                    <button onClick={() => removeOption(oIdx)} style={{ background: 'transparent', border: 'none', color: '#ef4444' }}><Trash2 size={16} /></button>
                                </div>
                                <input 
                                    placeholder="Enter values (comma separated)..."
                                    value={opt.values.join(', ')} 
                                    onChange={e => {
                                        const next = [...options]; 
                                        next[oIdx].values = e.target.value.split(',').map(v => v.trim()).filter(Boolean); 
                                        setOptions(next);
                                    }} 
                                    onBlur={generateVariants}
                                    style={InputStyle} 
                                />
                            </div>
                        ))}

                        {/* Variant Table */}
                        {variants.length > 0 && (
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 24 }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid #27272a' }}>
                                        <th style={{ padding: '12px 0', fontSize: 11, color: '#71717a' }}>VARIANT</th>
                                        <th style={{ padding: '12px 0', fontSize: 11, color: '#71717a' }}>PRICE</th>
                                        <th style={{ padding: '12px 0', fontSize: 11, color: '#71717a' }}>SKU</th>
                                        <th style={{ padding: '12px 0', fontSize: 11, color: '#71717a' }}>STOCK</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {variants.map((v, vIdx) => (
                                        <tr key={vIdx} style={{ borderBottom: '1px solid #1c1c22' }}>
                                            <td style={{ padding: '12px 0', fontSize: 13, color: '#fff' }}>{v.title}</td>
                                            <td style={{ padding: '12px 4px' }}><input type="number" value={v.price} onChange={e => {
                                                const next = [...variants]; next[vIdx].price = Number(e.target.value); setVariants(next);
                                            }} style={{ ...InputStyle, padding: '6px' }} /></td>
                                            <td style={{ padding: '12px 4px' }}><input value={v.sku} onChange={e => {
                                                const next = [...variants]; next[vIdx].sku = e.target.value; setVariants(next);
                                            }} style={{ ...InputStyle, padding: '6px' }} /></td>
                                            <td style={{ padding: '12px 4px' }}><input type="number" value={v.inventory_count} onChange={e => {
                                                const next = [...variants]; next[vIdx].inventory_count = Number(e.target.value); setVariants(next);
                                            }} style={{ ...InputStyle, padding: '6px' }} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* SEO Preview */}
                    <div style={SectionStyle}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                            <Globe size={18} color="#FF6B35" />
                            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>Search Engine Listing Preview</h3>
                        </div>
                        <div style={{ padding: 20, background: '#fff', borderRadius: 8, color: '#000' }}>
                            <div style={{ fontSize: 18, color: '#1a0dab', marginBottom: 4 }}>{product.seo_title || product.title}</div>
                            <div style={{ fontSize: 14, color: '#006621', marginBottom: 4 }}>omnora.com/products/{product.slug || 'slug'}</div>
                            <div style={{ fontSize: 13, color: '#3c4043' }}>{product.seo_description || 'Add an SEO description to see how your product appears in Search.'}</div>
                        </div>
                        <div style={{ marginTop: 24 }}>
                             <label style={{ fontSize: 12, color: '#a1a1aa', fontWeight: 600, display: 'block', marginBottom: 8 }}>Page Title</label>
                             <input value={product.seo_title} onChange={e => setProduct({...product, seo_title: e.target.value})} style={InputStyle} />
                        </div>
                         <div style={{ marginTop: 16 }}>
                             <label style={{ fontSize: 12, color: '#a1a1aa', fontWeight: 600, display: 'block', marginBottom: 8 }}>Meta Description</label>
                             <textarea value={product.seo_description} onChange={e => setProduct({...product, seo_description: e.target.value})} style={InputStyle} />
                        </div>
                    </div>
                </div>

                {/* Right Column (Meta) */}
                <div>
                    <div style={SectionStyle}>
                         <label style={{ fontSize: 12, color: '#a1a1aa', fontWeight: 600, display: 'block', marginBottom: 8 }}>Status</label>
                         <select value={product.status} onChange={e => setProduct({...product, status: e.target.value})} style={InputStyle}>
                            <option value="draft">Draft</option>
                            <option value="active">Active</option>
                            <option value="archived">Archived</option>
                         </select>
                    </div>

                    <div style={SectionStyle}>
                         <label style={{ fontSize: 12, color: '#a1a1aa', fontWeight: 600, display: 'block', marginBottom: 8 }}>Pricing</label>
                         <div style={{ marginBottom: 12 }}>
                            <label style={{ fontSize: 11, color: '#71717a' }}>Base Price</label>
                            <input type="number" value={product.price} onChange={e => setProduct({...product, price: Number(e.target.value)})} style={InputStyle} />
                         </div>
                         <div>
                            <label style={{ fontSize: 11, color: '#71717a' }}>Compare at Price</label>
                            <input type="number" value={product.compare_price} onChange={e => setProduct({...product, compare_price: Number(e.target.value)})} style={InputStyle} />
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
