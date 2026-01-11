import React, { useState, useEffect, useCallback } from 'react';
import client from '../api/client';
import { useToast } from '../context/ToastContext';
import { Plus, Edit3, Trash2, X, Image as ImageIcon, Search } from 'lucide-react';
import './AdminProducts.css';

interface Product {
    _id: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    category: string;
    image: string;
    isFeatured?: boolean;
    isNew?: boolean;
}

const INITIAL_FORM_STATE: Omit<Product, '_id'> = {
    name: '',
    description: '',
    price: 0,
    stock: 0,
    category: '',
    image: '',
    isFeatured: false,
    isNew: false
};

const AdminProducts: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Omit<Product, '_id'>>(INITIAL_FORM_STATE);
    const { showToast } = useToast();

    const fetchProducts = useCallback(async () => {
        try {
            const { data } = await client.get('/products?limit=100');
            if (data.success) setProducts(data.data);
        } catch (error) {
            showToast('Failed to load inventory', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleEdit = (product: Product) => {
        setEditingId(product._id);
        const { _id, ...rest } = product;
        setFormData(rest);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Confirm Deletion Protocol?')) return;
        try {
            await client.delete(`/products/${id}`);
            showToast('Product removed from database', 'success');
            setProducts(prev => prev.filter(p => p._id !== id));
        } catch (error) {
            showToast('Deletion failed', 'error');
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData(INITIAL_FORM_STATE);
        setIsModalOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await client.put(`/products/${editingId}`, formData);
                showToast('Product specs updated', 'success');
            } else {
                await client.post('/products', formData);
                showToast('New asset created', 'success');
            }
            resetForm();
            fetchProducts();
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Operation failed';
            showToast(msg, 'error');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : (type === 'number' ? parseFloat(value) : value)
        }));
    };

    return (
        <div className="admin-products animate-fade-in">
            <div className="page-header">
                <h2>INVENTORY DATABASE</h2>
                <button className="add-btn" onClick={() => { setEditingId(null); setFormData(INITIAL_FORM_STATE); setIsModalOpen(true); }}>
                    <Plus size={18} />
                    <span>NEW ASSET</span>
                </button>
            </div>

            <div className="products-table-container">
                <table className="products-table">
                    <thead>
                        <tr>
                            <th>ASSET</th>
                            <th>CATEGORY</th>
                            <th>VALUE</th>
                            <th>STOCK</th>
                            <th className="text-right">CONTROLS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(product => (
                            <tr key={product._id}>
                                <td>
                                    <div className="product-cell">
                                        <div className="img-wrapper">
                                            {product.image ? (
                                                <img src={product.image} alt={product.name} className="product-thumb" />
                                            ) : (
                                                <ImageIcon size={20} className="placeholder-icon" />
                                            )}
                                        </div>
                                        <div className="product-info">
                                            <div className="product-name">{product.name}</div>
                                            <div className="badges">
                                                {product.isFeatured && <span className="status-badge featured">FEATURED</span>}
                                                {product.isNew && <span className="status-badge new">NEW</span>}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="category-cell">{product.category}</td>
                                <td className="price-cell">PKR {product.price.toLocaleString()}</td>
                                <td>
                                    <span className={`stock-badge ${product.stock < 10 ? 'low' : 'good'}`}>
                                        {product.stock}
                                    </span>
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <button className="icon-btn edit-btn" onClick={() => handleEdit(product)}>
                                            <Edit3 size={16} />
                                        </button>
                                        <button className="icon-btn delete-btn" onClick={() => handleDelete(product._id)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content animate-scale-up">
                        <div className="modal-header">
                            <h3>{editingId ? 'MODIFY ASSET' : 'CREATE ASSET'}</h3>
                            <button className="close-modal" onClick={resetForm}><X size={20} /></button>
                        </div>
                        <form className="product-form" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>ASSET NAME</label>
                                <input name="name" value={formData.name} onChange={handleChange} required className="glass-input" />
                            </div>
                            
                            <div className="form-group">
                                <label>DESCRIPTION</label>
                                <textarea name="description" value={formData.description} onChange={handleChange} required rows={3} className="glass-input" />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>VALUE (PKR)</label>
                                    <input type="number" name="price" value={formData.price} onChange={handleChange} required min={0} className="glass-input" />
                                </div>
                                <div className="form-group">
                                    <label>STOCK LEVEL</label>
                                    <input type="number" name="stock" value={formData.stock} onChange={handleChange} required min={0} className="glass-input" />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>CATEGORY_ID</label>
                                <input name="category" value={formData.category} onChange={handleChange} required className="glass-input" />
                            </div>

                            <div className="form-group">
                                <label>IMAGE SOURCE</label>
                                <input name="image" value={formData.image} onChange={handleChange} required className="glass-input" />
                            </div>

                            <div className="checkbox-row">
                                <label className="checkbox-label">
                                    <input type="checkbox" name="isFeatured" checked={!!formData.isFeatured} onChange={handleChange} />
                                    <span>FEATURED ASSET</span>
                                </label>
                                <label className="checkbox-label">
                                    <input type="checkbox" name="isNew" checked={!!formData.isNew} onChange={handleChange} />
                                    <span>NEW ARRIVAL</span>
                                </label>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={resetForm}>CANCEL</button>
                                <button type="submit" className="btn-primary">CONFIRM</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminProducts;