import React, { useState, useEffect, useCallback } from 'react';
import client from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { Plus, Edit3, Trash2, X, Image as ImageIcon, Package } from 'lucide-react';
import './SellerInventory.css';

interface Variant {
    label: string;
    stock: number;
    priceOverride?: number;
}

interface Product {
    _id: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    category: string;
    image: string;
    isBestseller?: boolean;
    showLowStockWarning?: boolean;
    variants?: Variant[];
}

const INITIAL_FORM_STATE: Omit<Product, '_id'> = {
    name: '',
    description: '',
    price: 0,
    stock: 0,
    category: '',
    image: '',
    isBestseller: false,
    showLowStockWarning: true,
    variants: []
};

export default function SellerInventory() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Omit<Product, '_id'>>(INITIAL_FORM_STATE);
    const { showToast } = useToast();

    const fetchInventory = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await client.get('/seller/inventory');
            if (data.success) setProducts(data.data);
        } catch (error) {
            showToast('Failed to load inventory', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchInventory();
    }, [fetchInventory]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await client.put(`/seller/inventory/${editingId}`, formData);
                showToast('Product updated successfully', 'success');
            } else {
                await client.post('/seller/inventory', formData);
                showToast('New product listed', 'success');
            }
            setIsModalOpen(false);
            setEditingId(null);
            setFormData(INITIAL_FORM_STATE);
            fetchInventory();
        } catch (error: any) {
            showToast(error.response?.data?.error || 'Operation failed', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to remove this product?')) return;
        try {
            await client.delete(`/seller/inventory/${id}`);
            showToast('Product removed', 'success');
            fetchInventory();
        } catch (error) {
            showToast('Deletion failed', 'error');
        }
    };

    const handleEdit = (product: Product) => {
        const { _id, ...rest } = product;
        setEditingId(_id);
        setFormData(rest);
        setIsModalOpen(true);
    };

    return (
        <div className="seller-inventory">
            <div className="section-header">
                <div>
                    <h2>INVENTORY MANAGER</h2>
                    <p>Manage your stock levels and product details</p>
                </div>
                <button className="btn-luxury-primary" onClick={() => { setEditingId(null); setFormData(INITIAL_FORM_STATE); setIsModalOpen(true); }}>
                    <Plus size={18} /> LIST NEW PRODUCT
                </button>
            </div>

            {loading ? (
                <div className="loading-state">Syncing inventory...</div>
            ) : (
                <div className="inventory-grid">
                    {products.length === 0 ? (
                        <div className="empty-state">
                            <Package size={48} />
                            <p>No products listed yet.</p>
                        </div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>PRODUCT</th>
                                    <th>PRICE</th>
                                    <th>STOCK</th>
                                    <th>STATUS</th>
                                    <th>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map(product => (
                                    <tr key={product._id}>
                                        <td>
                                            <div className="product-info">
                                                <img src={product.image} alt={product.name} />
                                                <div>
                                                    <div className="name">{product.name}</div>
                                                    <div className="category">{product.category}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>PKR {(product.price || 0).toLocaleString()}</td>
                                        <td>
                                            <span className={`stock ${product.stock < 5 ? 'low' : ''}`}>
                                                {product.stock} units
                                            </span>
                                        </td>
                                        <td>
                                            <span className="status-pill active">LIVE</span>
                                        </td>
                                        <td>
                                            <div className="actions">
                                                <button onClick={() => handleEdit(product)}><Edit3 size={16} /></button>
                                                <button onClick={() => handleDelete(product._id)} className="delete"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <header>
                            <h3>{editingId ? 'EDIT PRODUCT' : 'NEW LISTING'}</h3>
                            <button onClick={() => setIsModalOpen(false)}><X size={20} /></button>
                        </header>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>PRODUCT NAME</label>
                                <input
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>DESCRIPTION</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>PRICE (PKR)</label>
                                    <input
                                        type="number"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>STOCK QTY</label>
                                    <input
                                        type="number"
                                        value={formData.stock}
                                        onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>CATEGORY</label>
                                <input
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>IMAGE URL</label>
                                <input
                                    value={formData.image}
                                    onChange={e => setFormData({ ...formData, image: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group boosters-section">
                                <label>CONVERSION BOOSTERS</label>
                                <div className="booster-toggles">
                                    <label className="toggle-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.isBestseller}
                                            onChange={e => setFormData({ ...formData, isBestseller: e.target.checked })}
                                        />
                                        <span>Bestseller Badge</span>
                                    </label>
                                    <label className="toggle-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.showLowStockWarning}
                                            onChange={e => setFormData({ ...formData, showLowStockWarning: e.target.checked })}
                                        />
                                        <span>Show "Only X left" pulse</span>
                                    </label>
                                </div>
                            </div>

                            <div className="variants-editor">
                                <label>LEAN VARIANTS (Optional)</label>
                                <div className="variant-list">
                                    {(formData as any).variants?.map((v: any, i: number) => (
                                        <div key={i} className="variant-row">
                                            <input
                                                placeholder="e.g. Size: M"
                                                value={v.label}
                                                onChange={e => {
                                                    const newV = [...(formData as any).variants];
                                                    newV[i].label = e.target.value;
                                                    setFormData({ ...formData, variants: newV } as any);
                                                }}
                                            />
                                            <input
                                                type="number"
                                                placeholder="Stock"
                                                style={{ width: '80px' }}
                                                value={v.stock}
                                                onChange={e => {
                                                    const newV = [...(formData as any).variants];
                                                    newV[i].stock = Number(e.target.value);
                                                    setFormData({ ...formData, variants: newV } as any);
                                                }}
                                            />
                                            <button type="button" onClick={() => {
                                                const newV = (formData as any).variants.filter((_: any, idx: number) => idx !== i);
                                                setFormData({ ...formData, variants: newV } as any);
                                            }}><X size={14} /></button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        className="btn-add-variant"
                                        onClick={() => setFormData({ ...formData, variants: [...((formData as any).variants || []), { label: '', stock: 0 }] } as any)}
                                    >
                                        + Add Variant
                                    </button>
                                </div>
                            </div>

                            <footer>
                                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>CANCEL</button>
                                <button type="submit" className="btn-primary">SAVE PRODUCT</button>
                            </footer>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
