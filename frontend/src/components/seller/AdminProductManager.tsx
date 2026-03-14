import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Package, Search, Image as ImageIcon, Loader2, X, Lock } from 'lucide-react';
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

    const fetchProducts = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const data = await databaseClient.getProductsByMerchant(user.id);
            setProducts(data);
        } catch (error: any) {
            showToast(error.message || 'Failed to fetch products', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [user]);

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
                category_id: (product as any).category_id || '',
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
                    vendor: (user as any)?.name || (user as any)?.displayName || 'Vendor',
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
        } catch (error: any) {
            showToast(error.message || 'Failed to save product', 'error');
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
        } catch (error: any) {
            showToast(error.message || 'Failed to delete product', 'error');
        }
    };

    const filteredProducts = products.filter(p => 
        p.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in text-white" style={{ fontFamily: 'var(--font-sans)' }}>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                        <Package className="text-[var(--accent-gold)]" />
                        Inventory
                    </h1>
                    <p className="text-gray-400 mt-2 text-sm max-w-xl">
                        Manage your products, descriptions, and pricing. These sync directly to your active storefront.
                    </p>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[var(--accent-gold)]/50 focus:ring-1 focus:ring-[var(--accent-gold)]/50 w-64 transition-all"
                        />
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        disabled={!isPro && products.length >= FREE_PRODUCT_LIMIT}
                        className="bg-[var(--accent-gold)] hover:brightness-110 text-black px-5 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(var(--accent-gold-rgb),0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                        title={!isPro && products.length >= FREE_PRODUCT_LIMIT ? `Free plan limit: ${FREE_PRODUCT_LIMIT} products` : 'Add a new product'}
                    >
                        {!isPro && products.length >= FREE_PRODUCT_LIMIT ? (
                            <><Lock size={16} /> Limit Reached</>
                        ) : (
                            <><Plus size={16} /> Add Product</>
                        )}
                    </button>
                </div>
            </div>

            {/* Data Grid */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-2xl overflow-hidden shadow-2xl relative">
                {/* Cinematic accent line */}
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--accent-gold)]/30 to-transparent" />
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[var(--bg-surface)] border-b border-[var(--border-primary)] text-[var(--text-secondary)]">
                            <tr>
                                <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Product Info</th>
                                <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Status</th>
                                <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Unit Price</th>
                                <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {isLoading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <tr key={i} className="bg-[#050505]">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <Skeleton baseColor="#111" highlightColor="#222" width={48} height={48} borderRadius={8} />
                                                <div className="space-y-2">
                                                    <Skeleton baseColor="#111" highlightColor="#222" width={150} height={14} />
                                                    <Skeleton baseColor="#111" highlightColor="#222" width={100} height={10} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4"><Skeleton baseColor="#111" highlightColor="#222" width={60} height={20} borderRadius={10} /></td>
                                        <td className="px-6 py-4"><Skeleton baseColor="#111" highlightColor="#222" width={50} height={14} /></td>
                                        <td className="px-6 py-4 text-right"><Skeleton baseColor="#111" highlightColor="#222" width={70} height={32} borderRadius={6} /></td>
                                    </tr>
                                ))
                            ) : filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-16 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <Package size={48} className="text-white/10" />
                                            <p className="text-lg font-medium text-gray-300">No products found</p>
                                            <p className="text-sm">Get started by adding your first product.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map(product => (
                                    <tr key={product.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                {product.featured_image ? (
                                                    <img src={product.featured_image} alt={product.title} className="w-12 h-12 rounded-lg object-cover bg-gray-900 border border-white/10" />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-lg bg-gray-900 border border-white/10 flex items-center justify-center text-gray-600">
                                                        <ImageIcon size={20} />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-bold text-white group-hover:text-[var(--accent-gold)] transition-colors tracking-tight">{product.title}</p>
                                                    <p className="text-[10px] text-[var(--text-secondary)] line-clamp-1 max-w-xs mt-0.5 uppercase tracking-wide">{product.description || 'No description'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                Active
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-300">
                                            ${product.price.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleOpenModal(product)}
                                                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                                    title="Edit Product"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product.id)}
                                                    className="p-2 text-red-500/70 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    title="Delete Product"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Glassmorphism Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={handleCloseModal} />
                    
                    <div className="relative bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-3xl w-full max-w-lg shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden animate-fade-in-up" style={{ fontFamily: 'var(--font-sans)' }}>
                        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-white">
                                {editingProduct ? 'Edit Product' : 'Add New Product'}
                            </h2>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Product Name</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                    placeholder="e.g., Cyberpunk Leather Jacket"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Price (USD)</label>
                                <input
                                    required
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                    className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-2">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    className="w-full bg-[var(--bg-background)] border border-[var(--border-primary)] rounded-xl p-4 text-sm text-white focus:outline-none focus:border-[var(--accent-gold)] focus:ring-1 focus:ring-[var(--accent-gold)] transition-all resize-none"
                                    placeholder="A cinematic description..."
                                />
                            </div>

                            <div>
                                <CategoryPicker 
                                    selectedId={formData.category_id} 
                                    onSelect={(id) => setFormData({ ...formData, category_id: id })} 
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em]">Product Gallery</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {formData.images.map((img, idx) => (
                                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-white/5 border border-white/10 group/img">
                                            <img src={img.src} alt="" className="w-full h-full object-cover" />
                                            <button 
                                                type="button"
                                                onClick={() => setFormData({ ...formData, images: formData.images.filter((_, i) => i !== idx) })}
                                                className="absolute top-1 right-1 p-1 bg-black/60 rounded-md text-white opacity-0 group-hover/img:opacity-100 transition-opacity"
                                            >
                                                <X size={10} />
                                            </button>
                                        </div>
                                    ))}
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            const url = window.prompt("Enter Image URL:");
                                            if (url) setFormData({ 
                                                ...formData, 
                                                images: [...formData.images, { id: Date.now().toString(), src: url, alt: '' }],
                                                featured_image: formData.featured_image || url
                                            });
                                        }}
                                        className="aspect-square rounded-lg border border-dashed border-white/20 flex flex-col items-center justify-center text-gray-500 hover:text-white hover:border-white/40 transition-all gap-1"
                                    >
                                        <Plus size={16} />
                                        <span className="text-[8px] uppercase tracking-widest font-bold">Add Image</span>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em]">Variants</label>
                                    <button 
                                        type="button"
                                        onClick={() => setFormData({ 
                                            ...formData, 
                                            variants: [...formData.variants, { 
                                                id: `var_${Date.now()}`, 
                                                title: 'New Variant', 
                                                price: parseFloat(formData.price) || 0, 
                                                available: true, 
                                                options: {} 
                                            }] 
                                        })}
                                        className="text-[10px] text-[var(--accent-gold)] font-bold uppercase tracking-widest hover:brightness-125"
                                    >
                                        Add Variant
                                    </button>
                                </div>
                                {formData.variants.length > 0 && (
                                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                        {formData.variants.map((v, idx) => (
                                            <div key={idx} className="flex items-center gap-2 p-2 bg-white/5 border border-white/10 rounded-lg">
                                                <input 
                                                    className="flex-1 bg-transparent border-none text-xs text-white focus:outline-none"
                                                    value={v.title}
                                                    onChange={(e) => {
                                                        const newVars = [...formData.variants];
                                                        newVars[idx].title = e.target.value;
                                                        setFormData({ ...formData, variants: newVars });
                                                    }}
                                                />
                                                <input 
                                                    className="w-20 bg-transparent border-none text-xs text-white text-right focus:outline-none"
                                                    type="number"
                                                    value={v.price}
                                                    onChange={(e) => {
                                                        const newVars = [...formData.variants];
                                                        newVars[idx].price = parseFloat(e.target.value);
                                                        setFormData({ ...formData, variants: newVars });
                                                    }}
                                                />
                                                <button 
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, variants: formData.variants.filter((_, i) => i !== idx) })}
                                                    className="text-gray-500 hover:text-red-400"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-white/5 mt-6">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-[var(--accent-gold)] hover:brightness-110 text-black px-6 py-2 rounded-xl text-sm font-black tracking-widest uppercase shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                                    {editingProduct ? 'Save Entity' : 'Create Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
