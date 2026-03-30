import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Image as ImageIcon, Loader2, X, Lock } from 'lucide-react';
import { databaseClient } from '../../platform/core/DatabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Product, ProductImage, ProductVariant } from '../../context/StorefrontContext';
import { CategoryPicker } from './CategoryPicker';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export const AdminProductManager = () => {
    const { user } = useAuth();
    const isPro = user?.plan === 'pro';
    const FREE_PRODUCT_LIMIT = 5;
    const { showToast } = useToast();
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        featured_image: '',
        category_id: '',
        images: [] as ProductImage[],
        variants: [] as ProductVariant[]
    });

    const fetchProducts = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const data = await databaseClient.getProductsByMerchant(user.id);
            setProducts(data);
        } catch (error: unknown) {
            const err = error as Error;
            showToast(err.message || 'Failed to fetch products', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [user, showToast]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleOpenModal = (product?: Product) => {
        // Guardrail 3: Free-tier product limit
        if (!product && !isPro && products.length >= FREE_PRODUCT_LIMIT) {
            showToast(`You've reached the Free plan limit (${FREE_PRODUCT_LIMIT} products). Upgrade to Pro for unlimited products.`, 'error');
            return;
        }
        if (product) {
            setEditingProduct(product);
            setFormData({
                title: product.title,
                description: product.description,
                price: product.price.toString(),
                featured_image: product.featured_image,
                category_id: (product as Product & { category_id?: string }).category_id || '',
                images: product.images || [],
                variants: product.variants || []
            });
        } else {
            setEditingProduct(null);
            setFormData({ 
                title: '', 
                description: '', 
                price: '', 
                featured_image: '',
                category_id: '',
                images: [],
                variants: []
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
        setFormData({ 
            title: '', 
            description: '', 
            price: '', 
            featured_image: '',
            category_id: '',
            images: [],
            variants: []
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        const priceNum = parseFloat(formData.price);
        if (isNaN(priceNum) || priceNum < 0) {
            showToast('Price must be a valid positive number', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingProduct) {
                // UPDATE
                await databaseClient.updateProduct(editingProduct.id, {
                    title: formData.title,
                    description: formData.description,
                    price: priceNum,
                    featured_image: formData.featured_image,
                    images: formData.images,
                    variants: formData.variants,
                    handle: formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
                });
                showToast('Product updated successfully', 'success');
            } else {
                // CREATE
                const generatedHandle = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                await databaseClient.createProduct(user.id, {
                    title: formData.title,
                    handle: generatedHandle,
                    description: formData.description,
                    price: priceNum,
                    compareAtPrice: undefined,
                    currency: 'USD',
                    featured_image: formData.featured_image,
                    images: formData.images,
                    vendor: (user as { name?: string }).name || (user as { displayName?: string }).displayName || 'Vendor',
                    type: 'Standard',
                    tags: [],
                    available: true,
                    options: [],
                    variants: formData.variants
                });
                showToast('Product created successfully', 'success');
            }
            await fetchProducts();
            handleCloseModal();
        } catch (error: unknown) {
            const err = error as Error;
            showToast(err.message || 'Failed to save product', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (productId: string) => {
        if (!user || !window.confirm('Are you sure you want to delete this product?')) return;
        
        try {
            await databaseClient.deleteProduct(user.id, productId);
            setProducts(products.filter(p => p.id !== productId));
            showToast('Product deleted successfully', 'success');
        } catch (error: unknown) {
            const err = error as Error;
            showToast(err.message || 'Failed to delete product', 'error');
        }
    };

    const filteredProducts = products.filter(p => 
        p.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '-0.04em', color: '#fff', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        Inventory / <span style={{ opacity: 0.4 }}>Vault</span>
                    </h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-ghost)', marginTop: '8px' }}>Direct oversight of the store&apos;s physical and digital manifests.</p>
                </div>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-ghost)' }} />
                        <input
                            type="text"
                            placeholder="Filter Manifest..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                background: 'var(--surface-low)',
                                border: '1px solid var(--border-low)',
                                borderRadius: '8px',
                                padding: '10px 16px 10px 36px',
                                fontSize: '12px',
                                color: '#fff',
                                width: '240px',
                                outline: 'none'
                            }}
                        />
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        disabled={!isPro && products.length >= FREE_PRODUCT_LIMIT}
                        style={{
                            background: '#fff',
                            color: '#000',
                            padding: '10px 20px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 900,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            border: 'none',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}
                    >
                        {(!isPro && products.length >= FREE_PRODUCT_LIMIT) ? <Lock size={14} /> : <Plus size={14} />}
                        {(!isPro && products.length >= FREE_PRODUCT_LIMIT) ? 'Limit Reached' : 'Materialize New'}
                    </button>
                </div>
            </div>

            {/* Data Grid */}
            <div className="table-container">
                <div className="table-header">
                    <h3>Manifest Ledger</h3>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Identity</th>
                            <th>Status</th>
                            <th>Unit Value</th>
                            <th style={{ textAlign: 'right' }}>Controls</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <Skeleton baseColor="var(--surface-high)" highlightColor="var(--surface-mid)" width={40} height={40} borderRadius={8} />
                                            <Skeleton baseColor="var(--surface-high)" highlightColor="var(--surface-mid)" width={200} height={14} />
                                        </div>
                                    </td>
                                    <td><Skeleton baseColor="var(--surface-high)" highlightColor="var(--surface-mid)" width={60} height={20} borderRadius={4} /></td>
                                    <td><Skeleton baseColor="var(--surface-high)" highlightColor="var(--surface-mid)" width={60} height={14} /></td>
                                    <td style={{ textAlign: 'right' }}><Skeleton baseColor="var(--surface-high)" highlightColor="var(--surface-mid)" width={80} height={32} borderRadius={6} /></td>
                                </tr>
                            ))
                        ) : filteredProducts.length === 0 ? (
                            <tr>
                                <td colSpan={4} style={{ textAlign: 'center', padding: '100px', color: 'var(--text-ghost)', fontStyle: 'italic' }}>No manifests detected in this sector.</td>
                            </tr>
                        ) : (
                            filteredProducts.map(product => (
                                <tr key={product.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-low)', background: 'var(--surface-low)' }}>
                                                {product.featured_image ? <img src={product.featured_image} style={{ width: '100%', height: '100%', objectCover: 'cover' }} alt="" /> : <ImageIcon size={16} style={{ margin: '12px', opacity: 0.2 }} />}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 800, fontSize: '13px' }}>{product.title}</div>
                                                <div style={{ fontSize: '10px', color: 'var(--text-ghost)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ID: {product.id.slice(-8).toUpperCase()}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td><span className="pill pill-success">Active</span></td>
                                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '12px' }}>${product.price.toFixed(2)}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button onClick={() => handleOpenModal(product)} style={{ background: 'var(--surface-high)', border: '1px solid var(--border-low)', borderRadius: '6px', color: '#fff', padding: '6px 12px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>Edit</button>
                                            <button onClick={() => handleDelete(product.id)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', color: '#ef4444', padding: '6px 12px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>Erase</button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Obsidian Modal */}
            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)' }} onClick={handleCloseModal} />
                    
                    <div style={{ position: 'relative', background: 'var(--surface-low)', border: '1px solid var(--border-mid)', borderRadius: '24px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-low)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#fff' }}>{editingProduct ? 'Edit Manifest' : 'Materialize Entity'}</h2>
                            <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', color: 'var(--text-ghost)', cursor: 'pointer' }}><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ padding: '32px', overflowY: 'auto', flex: 1 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '24px', marginBottom: '24px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 900, color: 'var(--text-ghost)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Identity / Title</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        style={{ width: '100%', background: 'var(--surface-high)', border: '1px solid var(--border-low)', borderRadius: '8px', padding: '12px', fontSize: '13px', color: '#fff', outline: 'none' }}
                                        placeholder="Product Name"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 900, color: 'var(--text-ghost)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Value (USD)</label>
                                    <input
                                        required
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                        style={{ width: '100%', background: 'var(--surface-high)', border: '1px solid var(--border-low)', borderRadius: '8px', padding: '12px', fontSize: '13px', color: '#fff', outline: 'none', fontFamily: 'var(--font-mono)' }}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '10px', fontWeight: 900, color: 'var(--text-ghost)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Log / Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    style={{ width: '100%', background: 'var(--surface-high)', border: '1px solid var(--border-low)', borderRadius: '8px', padding: '12px', fontSize: '13px', color: '#fff', outline: 'none', resize: 'none' }}
                                    placeholder="Entity characteristics..."
                                />
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <CategoryPicker 
                                    selectedId={formData.category_id} 
                                    onSelect={(id) => setFormData({ ...formData, category_id: id })} 
                                />
                            </div>

                            <div style={{ marginBottom: '32px' }}>
                                <label style={{ display: 'block', fontSize: '10px', fontWeight: 900, color: 'var(--text-ghost)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>Gallery / Visual Data</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                                    {formData.images.map((img, idx) => (
                                        <div key={idx} style={{ position: 'relative', aspectRatio: '1', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-low)', background: 'var(--surface-high)' }}>
                                            <img src={img.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            <button 
                                                type="button"
                                                onClick={() => setFormData({ ...formData, images: formData.images.filter((_, i) => i !== idx) })}
                                                style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '4px', color: '#fff', padding: '4px', cursor: 'pointer' }}
                                            >
                                                <X size={10} />
                                            </button>
                                        </div>
                                    ))}
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            const url = window.prompt("Visual Resource URL:");
                                            if (url) setFormData({ 
                                                ...formData, 
                                                images: [...formData.images, { id: Date.now().toString(), src: url, alt: '' }],
                                                featured_image: formData.featured_image || url
                                            });
                                        }}
                                        style={{ aspectRatio: '1', border: '1px dashed var(--border-low)', borderRadius: '8px', background: 'none', color: 'var(--text-ghost)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                    >
                                        <Plus size={16} />
                                        <span style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase' }}>Ingest</span>
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '24px', borderTop: '1px solid var(--border-low)' }}>
                                <button type="button" onClick={handleCloseModal} style={{ background: 'none', border: 'none', color: 'var(--text-ghost)', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    style={{ background: '#fff', color: '#000', border: 'none', borderRadius: '8px', padding: '12px 24px', fontSize: '13px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase' }}
                                >
                                    {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                                    {editingProduct ? 'Commit Changes' : 'Execute Creation'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
