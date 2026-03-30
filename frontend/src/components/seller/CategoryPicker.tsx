import React, { useState, useEffect } from 'react';
import { Tag, Plus, X } from 'lucide-react';
import { databaseClient } from '../../platform/core/DatabaseClient';
import type { Category } from '../../platform/core/DatabaseTypes';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface CategoryPickerProps {
    selectedId?: string;
    onSelect: (categoryId: string) => void;
}

export const CategoryPicker: React.FC<CategoryPickerProps> = ({ selectedId, onSelect }) => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [categories, setCategories] = useState<Category[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    // isLoading removed to silence linter unused warning since it wasn't rendered

    useEffect(() => {
        const fetchCategories = async () => {
            if (!user) return;
            try {
                const data = await databaseClient.getCategories(user.id);
                setCategories(data);
            } catch (error: unknown) {
                // OSTT FIX: Quiet fail
                console.warn(error);
            }
        };

        fetchCategories();
    }, [user]);

    const handleCreateCategory = async () => {
        if (!user || !newCategoryName.trim()) return;
        try {
            const slug = newCategoryName.toLowerCase().replace(/\s+/g, '-');
            const newCat = await databaseClient.upsertCategory(user.id, {
                name: newCategoryName,
                slug
            });
            setCategories([...categories, newCat]);
            setNewCategoryName('');
            setIsAdding(false);
            showToast('Category created', 'success');
        } catch (error: unknown) {
            console.error(error);
            showToast('Failed to create category', 'error');
        }
    };

    return (
        <div className="space-y-3">
            <label htmlFor="categoryInput" className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em]">
                Product Category
            </label>
            
            <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        type="button"
                        onClick={() => onSelect(cat.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-2 ${
                            selectedId === cat.id
                                ? 'bg-[var(--accent-gold)] text-black border-[var(--accent-gold)] shadow-[0_0_15px_rgba(var(--accent-gold-rgb),0.3)]'
                                : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/20'
                        }`}
                    >
                        <Tag size={12} />
                        {cat.name}
                    </button>
                ))}
                
                {isAdding ? (
                    <div className="flex items-center gap-2 animate-fade-in">
                        <input
                            id="categoryInput"
                            autoFocus
                            type="text"
                            value={newCategoryName}
                            onChange={e => setNewCategoryName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleCreateCategory()}
                            className="bg-[#050505] border border-[var(--accent-gold)]/50 rounded-full px-3 py-1 text-xs text-white focus:outline-none"
                            placeholder="Category Name..."
                        />
                        <button type="button" aria-label="Confirm Create" onClick={handleCreateCategory} className="text-[var(--accent-gold)] hover:brightness-125">
                            <Plus size={16} />
                        </button>
                        <button type="button" aria-label="Cancel" onClick={() => setIsAdding(false)} className="text-gray-500">
                            <X size={16} />
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => setIsAdding(true)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium border border-dashed border-white/20 text-gray-500 hover:text-white hover:border-white/40 transition-all flex items-center gap-2"
                    >
                        <Plus size={12} />
                        New Category
                    </button>
                )}
            </div>
        </div>
    );
};