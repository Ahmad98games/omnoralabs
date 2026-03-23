import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Store, User, Shield, AlertTriangle, Loader2 } from 'lucide-react';

export default function SellerProfile() {
    const { user, profile, loadProfile } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form States
    const [storeName, setStoreName] = useState('');
    const [storeDesc, setStoreDesc] = useState('');
    const [category, setCategory] = useState('');
    const [ownerName, setOwnerName] = useState('');
    const [phone, setPhone] = useState('');
    
    // Security
    const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });

    useEffect(() => {
        if (profile) {
            setStoreName(profile.store_name || '');
            setStoreDesc(profile.description || '');
            setCategory(profile.category || 'Fashion');
            setOwnerName(profile.display_name || '');
            setPhone(profile.phone || '');
            setLoading(false);
        } else if (user) {
            loadProfile(user.id).finally(() => setLoading(false));
        }
    }, [profile, user, loadProfile]);

    const handleUpdateStore = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSaving(true);

        try {
            const { error } = await supabase
                .from('merchants')
                .update({
                    store_name: storeName,
                    description: storeDesc,
                    category: category,
                    display_name: ownerName,
                    phone: phone,
                })
                .eq('id', user.id);

            if (error) throw error;
            showToast('Store settings updated!', 'success');
            await loadProfile(user.id); // Reload to sync dashboard greeting
        } catch (err: any) {
            showToast(err.message || 'Update failed', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.new !== passwordData.confirm) {
            showToast('Passwords do not match', 'error');
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: passwordData.new });
            if (error) throw error;
            showToast('Security protocols updated', 'success');
            setPasswordData({ current: '', new: '', confirm: '' });
        } catch (err: any) {
            showToast(err.message || 'Password update failed', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="animate-spin text-white/40" size={32} />
        </div>
    );

    return (
        <div className="seller-profile-view space-y-8 max-w-4xl animate-fade-in">
            <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-[#7c6dfa] to-[#a78bfa] rounded-xl">
                    <Store size={20} className="text-white" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">Store Identity</h2>
                    <p className="text-xs text-gray-400">Manage your business settings and branding profile.</p>
                </div>
            </div>

            {/* 1. STORE IDENTITY */}
            <form onSubmit={handleUpdateStore} className="bg-[#0a0a0f] border border-white/5 rounded-2xl p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Store Name</label>
                        <input
                            type="text"
                            value={storeName}
                            onChange={e => setStoreName(e.target.value)}
                            className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#7c6dfa] text-sm"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Store Category</label>
                        <select
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                            className="w-full p-3 bg-[#0f0f15] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#7c6dfa] text-sm"
                        >
                            <option value="Fashion">Fashion & Apparel</option>
                            <option value="Electronics">Electronics & Gadgets</option>
                            <option value="Home">Home & Decor</option>
                            <option value="Beauty">Beauty & Cosmetics</option>
                            <option value="Other">General Store</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Store Description</label>
                    <textarea
                        value={storeDesc}
                        onChange={e => setStoreDesc(e.target.value)}
                        rows={3}
                        placeholder="Tell your clients what makes your atelier unique..."
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#7c6dfa] text-sm"
                    />
                </div>

                <div className="border-t border-white/5 pt-4">
                    <h3 className="text-sm font-bold text-white mb-3">Owner Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Full Name</label>
                            <input
                                type="text"
                                value={ownerName}
                                onChange={e => setOwnerName(e.target.value)}
                                className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#7c6dfa] text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Contact Phone</label>
                            <input
                                type="text"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#7c6dfa] text-sm"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button 
                        type="submit" 
                        disabled={saving}
                        className="px-6 py-2.5 bg-gradient-to-r from-[#7c6dfa] to-[#a78bfa] hover:from-[#6b5ded] hover:to-[#9b8aff] text-white font-medium text-sm rounded-xl transition-all shadow-lg flex items-center"
                    >
                        {saving ? 'Syncing...' : 'Save Changes'}
                    </button>
                </div>
            </form>

            {/* 2. ACCOUNT SECURITY */}
            <div className="flex items-center space-x-3 mt-8">
                <div className="p-2 bg-white/5 rounded-xl border border-white/10">
                    <Shield size={18} className="text-gray-400" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">Security Settings</h2>
                    <p className="text-xs text-gray-400">Manage credentials and login sessions.</p>
                </div>
            </div>

            <form onSubmit={handlePasswordChange} className="bg-[#0a0a0f] border border-white/5 rounded-2xl p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">New Password</label>
                        <input
                            type="password"
                            value={passwordData.new}
                            onChange={e => setPasswordData({ ...passwordData, new: e.target.value })}
                            className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#7c6dfa] text-sm"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Confirm New Password</label>
                        <input
                            type="password"
                            value={passwordData.confirm}
                            onChange={e => setPasswordData({ ...passwordData, confirm: e.target.value })}
                            className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#7c6dfa] text-sm"
                            required
                        />
                    </div>
                </div>
                <div className="flex justify-end">
                    <button 
                        type="submit" 
                        disabled={saving}
                        className="px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/5 text-white text-sm font-medium rounded-xl transition-all"
                    >
                        Change Password
                    </button>
                </div>
            </form>

            {/* 3. DANGER ZONE */}
            <div className="bg-red-900/10 border border-red-500/20 rounded-2xl p-6 space-y-4">
                <div className="flex items-center space-x-3">
                    <AlertTriangle className="text-red-500" size={24} />
                    <div>
                        <h3 className="font-bold text-red-500">Danger Zone</h3>
                        <p className="text-xs text-red-400/80">Irreversible actions on your digital storefront property.</p>
                    </div>
                </div>
                <div className="flex justify-between items-center pt-2">
                    <div>
                        <p className="text-sm font-medium text-white">Delete Entire Sub-Store</p>
                        <p className="text-xs text-gray-500">Once deleted, records and canvas configs absolute wipe.</p>
                    </div>
                    <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all">
                        DELETE STORE
                    </button>
                </div>
            </div>
        </div>
    );
}
