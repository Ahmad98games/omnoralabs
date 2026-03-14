/**
 * ProductEditor.tsx — Merchant Product Creation / Editing Module
 *
 * Cyberpunk/Dark aesthetic. Powered by Zustand atomic state.
 * Drag-and-drop media upload with strict MIME/size validation.
 *
 * INVARIANTS:
 *  - All DB writes include `merchant_id` via Zustand store hydration.
 *  - Media validated client-side BEFORE touching Supabase Storage.
 *  - Component is lazy-loaded via React.lazy() from SellerDashboard.
 */

import React, { useCallback, useRef, useMemo, useState } from 'react';
import {
    Upload, X, Plus, Trash2, ImagePlus, DollarSign,
    Tag, Layers, Save, Loader2, AlertCircle, GripVertical,
} from 'lucide-react';
import { useProductDraftStore, type MediaQueueItem } from '../../stores/useProductDraftStore';
import { validateMediaFile, uploadProductMedia } from '../../lib/mediaUploader';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { databaseClient } from '../../platform/core/DatabaseClient';

// ─── Unique ID Generator ────────────────────────────────────────────────────

const uid = (): string =>
    `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

// ─── Section Wrapper Component ──────────────────────────────────────────────

const EditorSection: React.FC<{
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}> = ({ title, icon, children }) => (
    <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 space-y-5 ring-1 ring-white/[0.03]">
        <div className="flex items-center gap-3 text-white">
            {icon}
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">{title}</h3>
        </div>
        {children}
    </div>
);

// ─── Styled Input Component ─────────────────────────────────────────────────

const EditorInput: React.FC<{
    label: string;
    value: string | number;
    onChange: (val: string) => void;
    type?: string;
    placeholder?: string;
    prefix?: string;
    required?: boolean;
}> = ({ label, value, onChange, type = 'text', placeholder, prefix, required }) => (
    <div className="space-y-2">
        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500">
            {label} {required && <span className="text-red-400">*</span>}
        </label>
        <div className="relative flex items-center">
            {prefix && (
                <span className="absolute left-4 text-gray-500 text-sm font-mono pointer-events-none">
                    {prefix}
                </span>
            )}
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`w-full bg-[#050505] border border-white/10 rounded-xl py-3 text-sm text-white placeholder-gray-600 font-mono
                    focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50
                    focus:shadow-[0_0_15px_rgba(99,102,241,0.15)] transition-all
                    ${prefix ? 'pl-10 pr-4' : 'px-4'}`}
            />
        </div>
    </div>
);

// ─── Main Component ─────────────────────────────────────────────────────────

const ProductEditorInner: React.FC = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    // Zustand atomic selectors — prevent unnecessary re-renders
    const title = useProductDraftStore((s) => s.title);
    const description = useProductDraftStore((s) => s.description);
    const basePrice = useProductDraftStore((s) => s.basePrice);
    const compareAtPrice = useProductDraftStore((s) => s.compareAtPrice);
    const tags = useProductDraftStore((s) => s.tags);
    const vendor = useProductDraftStore((s) => s.vendor);
    const productType = useProductDraftStore((s) => s.productType);
    const mediaQueue = useProductDraftStore((s) => s.mediaQueue);
    const featuredImageUrl = useProductDraftStore((s) => s.featuredImageUrl);
    const variants = useProductDraftStore((s) => s.variants);
    const isDirty = useProductDraftStore((s) => s.isDirty);
    const setField = useProductDraftStore((s) => s.setField);
    const addToMediaQueue = useProductDraftStore((s) => s.addToMediaQueue);
    const updateMediaStatus = useProductDraftStore((s) => s.updateMediaStatus);
    const removeFromMediaQueue = useProductDraftStore((s) => s.removeFromMediaQueue);
    const setFeaturedImage = useProductDraftStore((s) => s.setFeaturedImage);
    const addVariant = useProductDraftStore((s) => s.addVariant);
    const updateVariant = useProductDraftStore((s) => s.updateVariant);
    const removeVariant = useProductDraftStore((s) => s.removeVariant);
    const resetDraft = useProductDraftStore((s) => s.resetDraft);
    const markClean = useProductDraftStore((s) => s.markClean);
    const setMerchantId = useProductDraftStore((s) => s.setMerchantId);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragOver, setIsDragOver] = useState(false);

    // Hydrate merchant ID
    React.useEffect(() => {
        if (user?.id) setMerchantId(user.id);
    }, [user?.id, setMerchantId]);

    // ── Media Handlers ──────────────────────────────────────────────────

    const processFiles = useCallback(
        async (files: FileList | File[]) => {
            const fileArray = Array.from(files);
            for (const file of fileArray) {
                const validationError = validateMediaFile(file);
                if (validationError) {
                    showToast(validationError.message, 'error');
                    continue;
                }

                const itemId = uid();
                const previewUrl = URL.createObjectURL(file);
                const queueItem: MediaQueueItem = {
                    id: itemId,
                    file,
                    previewUrl,
                    status: 'pending',
                };
                addToMediaQueue(queueItem);

                // Async upload
                if (!user?.id) continue;
                updateMediaStatus(itemId, 'uploading');

                const result = await uploadProductMedia(file, user.id);
                if (result.success) {
                    updateMediaStatus(itemId, 'done', result.publicUrl);
                    // Auto-set first image as featured
                    if (!featuredImageUrl) {
                        setFeaturedImage(result.publicUrl);
                    }
                } else {
                    updateMediaStatus(itemId, 'error', undefined, result.error.message);
                    showToast(result.error.message, 'error');
                }
            }
        },
        [user?.id, featuredImageUrl, addToMediaQueue, updateMediaStatus, setFeaturedImage, showToast]
    );

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragOver(false);
            if (e.dataTransfer.files.length) {
                processFiles(e.dataTransfer.files);
            }
        },
        [processFiles]
    );

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback(() => setIsDragOver(false), []);

    // ── Save Handler ────────────────────────────────────────────────────

    const handleSave = useCallback(async () => {
        if (!user?.id) {
            showToast('Authentication required.', 'error');
            return;
        }
        if (!title.trim()) {
            showToast('Product title is required.', 'error');
            return;
        }
        if (basePrice <= 0) {
            showToast('Base price must be greater than 0.', 'error');
            return;
        }

        setIsSaving(true);
        try {
            const uploadedImages = mediaQueue
                .filter((m) => m.status === 'done' && m.publicUrl)
                .map((m) => m.publicUrl!);

            const productPayload = {
                title: title.trim(),
                description: description.trim(),
                price: basePrice,
                compareAtPrice: compareAtPrice > 0 ? compareAtPrice : undefined,
                featured_image: featuredImageUrl || uploadedImages[0] || '',
                images: uploadedImages,
                tags: tags
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean),
                vendor: vendor.trim(),
                type: productType.trim(),
                variants: variants.map((v) => ({
                    optionName: v.optionName,
                    optionValue: v.optionValue,
                    price: v.price,
                    compareAtPrice: v.compareAtPrice,
                    sku: v.sku,
                    available: v.available,
                })),
                merchant_id: user.id,
            };

            await databaseClient.createProduct(user.id, productPayload as any);
            showToast('Product created successfully!', 'success');
            resetDraft();
        } catch (err: any) {
            showToast(err.message || 'Failed to save product.', 'error');
        } finally {
            setIsSaving(false);
        }
    }, [
        user?.id, title, description, basePrice, compareAtPrice,
        featuredImageUrl, mediaQueue, tags, vendor, productType,
        variants, showToast, resetDraft,
    ]);

    // ── Computed State ──────────────────────────────────────────────────

    const uploadedCount = useMemo(
        () => mediaQueue.filter((m) => m.status === 'done').length,
        [mediaQueue]
    );

    const hasDiscount = compareAtPrice > 0 && compareAtPrice > basePrice;
    const discountPercent = hasDiscount
        ? Math.round(((compareAtPrice - basePrice) / compareAtPrice) * 100)
        : 0;

    // ─── RENDER ─────────────────────────────────────────────────────────

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 animate-fade-in font-sans text-white">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Layers className="text-indigo-500" />
                        Product Editor
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Craft a new product for your storefront. All fields persist until submission.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {isDirty && (
                        <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest flex items-center gap-1.5 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                            <AlertCircle size={12} /> Unsaved Changes
                        </span>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !title.trim()}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]"
                    >
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {isSaving ? 'Saving...' : 'Publish Product'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Core Fields */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Info */}
                    <EditorSection title="Basic Information" icon={<Tag size={16} className="text-indigo-400" />}>
                        <EditorInput
                            label="Product Title"
                            value={title}
                            onChange={(v) => setField('title', v)}
                            placeholder="e.g. Premium Silk Kurta"
                            required
                        />
                        <div className="space-y-2">
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                Description
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setField('description', e.target.value)}
                                rows={4}
                                placeholder="Describe your product in detail..."
                                className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 font-mono
                                    focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50
                                    focus:shadow-[0_0_15px_rgba(99,102,241,0.15)] transition-all resize-none"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <EditorInput
                                label="Vendor / Brand"
                                value={vendor}
                                onChange={(v) => setField('vendor', v)}
                                placeholder="e.g. Omnora Labs"
                            />
                            <EditorInput
                                label="Product Type"
                                value={productType}
                                onChange={(v) => setField('productType', v)}
                                placeholder="e.g. Apparel"
                            />
                        </div>
                        <EditorInput
                            label="Tags (comma separated)"
                            value={tags}
                            onChange={(v) => setField('tags', v)}
                            placeholder="e.g. luxury, silk, eid-collection"
                        />
                    </EditorSection>

                    {/* Media Upload Zone */}
                    <EditorSection title="Media Gallery" icon={<ImagePlus size={16} className="text-indigo-400" />}>
                        <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onClick={() => fileInputRef.current?.click()}
                            className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300
                                ${isDragOver
                                    ? 'border-indigo-500 bg-indigo-500/5 shadow-[0_0_30px_rgba(99,102,241,0.15)]'
                                    : 'border-white/10 hover:border-white/20 bg-[#050505]'
                                }`}
                        >
                            <Upload
                                size={32}
                                className={`mx-auto mb-3 transition-colors ${isDragOver ? 'text-indigo-400' : 'text-gray-600'}`}
                            />
                            <p className="text-sm font-semibold text-gray-400">
                                Drop images here or <span className="text-indigo-400 underline">browse</span>
                            </p>
                            <p className="text-[10px] text-gray-600 mt-1.5 font-mono">
                                JPEG, PNG, WebP • Max 2MB per file
                            </p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/jpeg,image/png,image/webp"
                                onChange={(e) => e.target.files && processFiles(e.target.files)}
                                className="hidden"
                            />
                        </div>

                        {/* Media Preview Grid */}
                        {mediaQueue.length > 0 && (
                            <div className="grid grid-cols-4 gap-3 mt-4">
                                {mediaQueue.map((item) => (
                                    <div
                                        key={item.id}
                                        className={`relative group rounded-xl overflow-hidden border transition-all aspect-square
                                            ${item.publicUrl === featuredImageUrl
                                                ? 'border-indigo-500 ring-2 ring-indigo-500/30'
                                                : 'border-white/10'
                                            }
                                            ${item.status === 'error' ? 'border-red-500/50' : ''}`}
                                    >
                                        <img
                                            src={item.previewUrl}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />

                                        {/* Uploading Overlay */}
                                        {item.status === 'uploading' && (
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                <Loader2 size={20} className="animate-spin text-indigo-400" />
                                            </div>
                                        )}

                                        {/* Error Overlay */}
                                        {item.status === 'error' && (
                                            <div className="absolute inset-0 bg-red-900/60 flex items-center justify-center">
                                                <AlertCircle size={20} className="text-red-400" />
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {item.status === 'done' && item.publicUrl && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setFeaturedImage(item.publicUrl!);
                                                    }}
                                                    className="bg-indigo-600/80 hover:bg-indigo-500 text-white p-1 rounded-md text-[8px] font-bold"
                                                    title="Set as featured"
                                                >
                                                    ★
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeFromMediaQueue(item.id);
                                                }}
                                                className="bg-red-600/80 hover:bg-red-500 text-white p-1 rounded-md"
                                                title="Remove"
                                            >
                                                <X size={10} />
                                            </button>
                                        </div>

                                        {/* Featured Badge */}
                                        {item.publicUrl === featuredImageUrl && (
                                            <div className="absolute bottom-1 left-1 bg-indigo-600/90 text-[8px] text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">
                                                Featured
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {uploadedCount > 0 && (
                            <p className="text-[10px] text-gray-500 mt-2 font-mono">
                                {uploadedCount} image{uploadedCount !== 1 ? 's' : ''} uploaded to Supabase Storage
                            </p>
                        )}
                    </EditorSection>

                    {/* Variants */}
                    <EditorSection title="Variants" icon={<GripVertical size={16} className="text-indigo-400" />}>
                        {variants.length === 0 ? (
                            <p className="text-gray-600 text-xs italic">No variants configured. Add variants for size, color, etc.</p>
                        ) : (
                            <div className="space-y-3">
                                {variants.map((v, i) => (
                                    <div
                                        key={v.id}
                                        className="bg-[#050505] border border-white/5 rounded-xl p-4 grid grid-cols-12 gap-3 items-end group"
                                    >
                                        <div className="col-span-3">
                                            <label className="block text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-1">Option</label>
                                            <input
                                                value={v.optionName}
                                                onChange={(e) => updateVariant(v.id, { optionName: e.target.value })}
                                                placeholder="e.g. Size"
                                                className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-all font-mono"
                                            />
                                        </div>
                                        <div className="col-span-3">
                                            <label className="block text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-1">Value</label>
                                            <input
                                                value={v.optionValue}
                                                onChange={(e) => updateVariant(v.id, { optionValue: e.target.value })}
                                                placeholder="e.g. Medium"
                                                className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-all font-mono"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-1">Price</label>
                                            <input
                                                type="number"
                                                value={v.price}
                                                onChange={(e) => updateVariant(v.id, { price: Number(e.target.value) })}
                                                className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50 transition-all font-mono"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-1">SKU</label>
                                            <input
                                                value={v.sku}
                                                onChange={(e) => updateVariant(v.id, { sku: e.target.value })}
                                                placeholder="SKU-001"
                                                className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-all font-mono"
                                            />
                                        </div>
                                        <div className="col-span-2 flex items-center justify-end gap-2">
                                            <label className="flex items-center gap-1.5 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={v.available}
                                                    onChange={(e) => updateVariant(v.id, { available: e.target.checked })}
                                                    className="accent-indigo-500 w-3 h-3"
                                                />
                                                <span className="text-[9px] text-gray-500 uppercase">In Stock</span>
                                            </label>
                                            <button
                                                onClick={() => removeVariant(v.id)}
                                                className="text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                                title="Remove variant"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <button
                            onClick={addVariant}
                            className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-xs font-bold uppercase tracking-widest transition-colors mt-2"
                        >
                            <Plus size={14} /> Add Variant
                        </button>
                    </EditorSection>
                </div>

                {/* Right Column: Pricing & Summary */}
                <div className="space-y-6">
                    {/* Pricing */}
                    <EditorSection title="Pricing" icon={<DollarSign size={16} className="text-emerald-400" />}>
                        <EditorInput
                            label="Base Price"
                            value={basePrice}
                            onChange={(v) => setField('basePrice', Number(v) || 0)}
                            type="number"
                            placeholder="0.00"
                            prefix="PKR"
                            required
                        />
                        <EditorInput
                            label="Compare-at Price"
                            value={compareAtPrice}
                            onChange={(v) => setField('compareAtPrice', Number(v) || 0)}
                            type="number"
                            placeholder="Original price for discount display"
                            prefix="PKR"
                        />
                        {hasDiscount && (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 flex items-center gap-2">
                                <span className="text-emerald-400 font-bold text-xs">
                                    {discountPercent}% OFF
                                </span>
                                <span className="text-gray-500 text-[10px]">
                                    Savings: PKR {(compareAtPrice - basePrice).toLocaleString()}
                                </span>
                            </div>
                        )}
                    </EditorSection>

                    {/* Live Preview Card */}
                    <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl overflow-hidden ring-1 ring-white/[0.03]">
                        <div className="aspect-square bg-[#050505] relative">
                            {featuredImageUrl ? (
                                <img src={featuredImageUrl} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <ImagePlus size={48} className="text-gray-800" />
                                </div>
                            )}
                            {hasDiscount && (
                                <div className="absolute top-3 right-3 bg-red-600 text-white text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-widest">
                                    -{discountPercent}%
                                </div>
                            )}
                        </div>
                        <div className="p-4 space-y-2">
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                                {vendor || 'Brand'}
                            </p>
                            <h4 className="text-sm font-bold text-white truncate">
                                {title || 'Product Title'}
                            </h4>
                            <div className="flex items-baseline gap-2">
                                <span className="text-lg font-bold text-white">
                                    PKR {basePrice.toLocaleString()}
                                </span>
                                {hasDiscount && (
                                    <span className="text-xs text-gray-500 line-through">
                                        PKR {compareAtPrice.toLocaleString()}
                                    </span>
                                )}
                            </div>
                            {variants.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {variants.slice(0, 5).map((v) => (
                                        <span
                                            key={v.id}
                                            className="bg-white/5 border border-white/10 rounded-md px-2 py-0.5 text-[9px] text-gray-400 font-mono"
                                        >
                                            {v.optionValue || '—'}
                                        </span>
                                    ))}
                                    {variants.length > 5 && (
                                        <span className="text-[9px] text-gray-600 font-mono">
                                            +{variants.length - 5} more
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Lazy-Loadable Export ───────────────────────────────────────────────────

export default ProductEditorInner;
