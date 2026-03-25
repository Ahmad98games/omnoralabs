import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import client from '../../api/client';
import { 
    Store, AlertTriangle, Loader2, Upload, Globe, CreditCard, 
    RefreshCw, CheckCircle2, DollarSign, Languages 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DomainSettings } from '../../components/seller/DomainSettings';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { RadixSelect } from '../../components/ui/RadixSelect';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export default function SellerProfile() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const { settings, loading, saving, loadSettings, updateSettings } = useSettingsStore();

    // ─── Buffered Local State ────────────────────────────────────────────────
    const [storeName, setStoreName] = useState('');
    const [storeDesc, setStoreDesc] = useState('');
    const [category, setCategory] = useState('');
    const [ownerName, setOwnerName] = useState('');
    const [phone, setPhone] = useState('');

    const [currency, setCurrency] = useState('USD');
    const [locale, setLocale] = useState('en-US');
    const [logo, setLogo] = useState<string | null>(null);
    const [favicon, setFavicon] = useState<string | null>(null);

    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingFavicon, setUploadingFavicon] = useState(false);

    // 1. Initial Load Sync
    useEffect(() => {
        if (user?.id && !settings) {
            loadSettings(user.id);
        }
    }, [user?.id, loadSettings, settings]);

    // 2. Hydration from Store (Optimistic support buffer)
    useEffect(() => {
        if (settings) {
            const meta = settings.metadata || {};
            setStoreName(meta.store_name || '');
            setStoreDesc(meta.store_description || '');
            setCategory(meta.store_category || 'Fashion');
            setOwnerName(settings.display_name || '');
            setPhone(meta.phone_number || '');
            
            setCurrency(meta.currency || 'USD');
            setLocale(meta.locale || 'en-US');
            setLogo(meta.logo || null);
            setFavicon(meta.favicon || null);
        }
    }, [settings]);

    const handleImageUpload = async (file: File, type: 'logo' | 'favicon') => {
        if (type === 'logo') setUploadingLogo(true);
        else setUploadingFavicon(true);

        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await client.post('/media/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success && res.data.asset?.url) {
                showToast(`${type === 'logo' ? 'Logo' : 'Favicon'} uploaded successfully!`, 'success');
                if (type === 'logo') setLogo(res.data.asset.url);
                else setFavicon(res.data.asset.url);
            } else {
                throw new Error('Upload failed');
            }
        } catch (err: any) {
            showToast(err.message || 'Upload failed due to network conflict', 'error');
        } finally {
            if (type === 'logo') setUploadingLogo(false);
            else setUploadingFavicon(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        const success = await updateSettings(user.id, {
            display_name: ownerName,
            metadata: {
                store_name: storeName,
                store_description: storeDesc,
                store_category: category,
                phone_number: phone,
                currency,
                locale,
                logo,
                favicon
            }
        });

        if (success) {
            showToast('Store settings updated!', 'success');
        } else {
            showToast('Update failed!', 'error');
        }
    };

    if (loading && !settings) return (
        <div className="seller-profile-view space-y-8 max-w-4xl mx-auto p-8 font-sans text-white h-full overflow-y-auto relative custom-scrollbar">
            <div className="mb-8">
                <Skeleton height={32} width={220} baseColor="#0a0a0d" highlightColor="#16161c" borderRadius={8} />
                <Skeleton height={14} width={340} className="mt-2" baseColor="#0a0a0d" highlightColor="#16161c" />
            </div>

            {/* Skeleton Card 1 */}
            <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                    <Skeleton circle width={30} height={30} baseColor="#0a0a0a" highlightColor="#222" />
                    <Skeleton width={120} height={20} baseColor="#0a0a0a" highlightColor="#222" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Skeleton height={42} borderRadius={12} baseColor="#0e0e0e" highlightColor="#1a1a1a" /></div>
                    <div><Skeleton height={42} borderRadius={12} baseColor="#0e0e0e" highlightColor="#1a1a1a" /></div>
                </div>
                <div><Skeleton height={80} borderRadius={12} baseColor="#0e0e0e" highlightColor="#1a1a1a" /></div>
            </div>

            {/* Skeleton Card 2 */}
            <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 space-y-4">
                <Skeleton width={180} height={20} baseColor="#0a0a0a" highlightColor="#222" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Skeleton height={42} borderRadius={12} baseColor="#0e0e0e" highlightColor="#1a1a1a" /></div>
                    <div><Skeleton height={42} borderRadius={12} baseColor="#0e0e0e" highlightColor="#1a1a1a" /></div>
                </div>
            </div>
        </div>
    );


    return (
        <div className="seller-profile-view space-y-8 max-w-4xl mx-auto p-8 font-sans text-white h-full overflow-y-auto relative custom-scrollbar">
            
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black mb-1 tracking-tight">Store Settings</h2>
                    <p className="text-gray-400 text-sm">Industrialize your commerce workflows and brand assets.</p>
                </div>
            </div>

            {/* ─── 1. CORE IDENTITY ────────────────────────────────────────────────── */}
            <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                        <Store size={18} />
                    </div>
                    <h3 className="text-base font-bold tracking-tight">Vitals & Identity</h3>
                </div>

                <form onSubmit={handleSave} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 font-mono">Store Name</label>
                            <input
                                type="text"
                                value={storeName}
                                onChange={e => setStoreName(e.target.value)}
                                className="w-full p-3 bg-white/5 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                                required
                            />
                        </div>
                        <RadixSelect 
                            label="Store Category" 
                            value={category} 
                            onChange={setCategory} 
                            options={[
                                { value: 'Fashion', label: 'Fashion & Apparel' },
                                { value: 'Electronics', label: 'Electronics & Gadgets' },
                                { value: 'Home', label: 'Home & Decor' },
                                { value: 'Beauty', label: 'Beauty & Cosmetics' },
                                { value: 'Other', label: 'General Store' }
                            ]}
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 font-mono">Store Description</label>
                        <textarea
                            value={storeDesc}
                            onChange={e => setStoreDesc(e.target.value)}
                            rows={3}
                            placeholder="Describe your brand for search indexes..."
                            className="w-full p-3 bg-white/5 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 font-mono">Owner Full Name</label>
                            <input
                                type="text"
                                value={ownerName}
                                onChange={e => setOwnerName(e.target.value)}
                                className="w-full p-3 bg-white/5 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 font-mono">Contact Phone Number</label>
                            <input
                                type="text"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                className="w-full p-3 bg-white/5 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button 
                            type="submit" 
                            disabled={saving}
                            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-xl flex items-center gap-2"
                        >
                            {saving ? <RefreshCw className="animate-spin" size={14} /> : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>

            {/* ─── 2. LOCALIZATION & CURRENCY ─────────────────────────────────────── */}
            <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                        <DollarSign size={18} />
                    </div>
                    <h3 className="text-base font-bold tracking-tight">Localization & Regional</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <RadixSelect 
                        label="Store Currency" 
                        value={currency} 
                        onChange={setCurrency} 
                        icon={DollarSign}
                        options={[
                            { value: 'USD', label: 'USD - United States Dollar' },
                            { value: 'EUR', label: 'EUR - Euro' },
                            { value: 'GBP', label: 'GBP - British Pound' },
                            { value: 'PKR', label: 'PKR - Pakistani Rupee' },
                            { value: 'INR', label: 'INR - Indian Rupee' }
                        ]}
                    />
                    <RadixSelect 
                        label="Language / Locale" 
                        value={locale} 
                        onChange={setLocale} 
                        icon={Languages}
                        options={[
                            { value: 'en-US', label: 'English (US)' },
                            { value: 'es-ES', label: 'Español' },
                            { value: 'ur-PK', label: 'Urdu' }
                        ]}
                    />
                </div>
            </div>

            {/* ─── 3. BRAND ASSETS ─────────────────────────────────────────────────── */}
            <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
                        <Upload size={18} />
                    </div>
                    <h3 className="text-base font-bold tracking-tight">Identity Assets (Logo & Favicon)</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Logo */}
                    <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 font-mono">Store Front Logo</label>
                        <div className="border border-dashed border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center relative hover:border-white/20 transition-colors">
                            {logo ? (
                                <img src={logo} alt="Store Logo" className="max-h-24 max-w-full object-contain mb-4 rounded-lg" />
                            ) : (
                                <div className="text-gray-600 p-4"><svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 002-2H4a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>
                            )}
                            <input 
                                type="file" 
                                accept="image/*" 
                                className="absolute inset-0 opacity-0 cursor-pointer" 
                                onChange={e => { if (e.target.files?.[0]) handleImageUpload(e.target.files[0], 'logo'); }} 
                            />
                            <div className="text-xs text-indigo-400 font-bold flex items-center gap-1">
                                {uploadingLogo ? <RefreshCw className="animate-spin" size={12} /> : <Upload size={12} />}
                                {uploadingLogo ? 'Transmitting...' : logo ? 'Replace Asset' : 'Inject Logo'}
                            </div>
                        </div>
                    </div>

                    {/* Favicon */}
                    <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 font-mono">Browser Favicon (16x16 / 32x32)</label>
                        <div className="border border-dashed border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center relative hover:border-white/20 transition-colors">
                            {favicon ? (
                                <img src={favicon} alt="Store Favicon" className="w-8 h-8 object-contain mb-4 rounded" />
                            ) : (
                                <div className="text-gray-600 p-4"><svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 002-2H4a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>
                            )}
                            <input 
                                type="file" 
                                accept="image/x-icon,image/png,image/svg+xml" 
                                className="absolute inset-0 opacity-0 cursor-pointer" 
                                onChange={e => { if (e.target.files?.[0]) handleImageUpload(e.target.files[0], 'favicon'); }} 
                            />
                            <div className="text-xs text-indigo-400 font-bold flex items-center gap-1">
                                {uploadingFavicon ? <RefreshCw className="animate-spin" size={12} /> : <Upload size={12} />}
                                {uploadingFavicon ? 'Transmitting...' : favicon ? 'Replace Asset' : 'Inject Favicon'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── 4. CUSTOM DOMAIN (Composition) ─────────────────────────────────── */}
            <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl relative">
                <DomainSettings />
            </div>

            {/* ─── 5. DANGER ZONE ─────────────────────────────────────────────────── */}
            <div className="bg-red-900/10 border border-red-500/20 rounded-2xl p-6 space-y-4">
                <div className="flex items-center space-x-3">
                    <AlertTriangle className="text-red-500" size={20} />
                    <div>
                        <h3 className="font-bold text-red-500 text-sm">Danger Zone</h3>
                        <p className="text-[11px] text-red-300 opacity-80">Irreversible actions on your digital storefront property.</p>
                    </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-red-500/10">
                    <div>
                        <p className="text-xs font-bold text-white">Delete Entire Sub-Store</p>
                        <p className="text-[10px] text-gray-500">All configs and absolute records wipes clean.</p>
                    </div>
                    <button className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all">
                        DELETE STORE
                    </button>
                </div>
            </div>
        </div>
    );
}
