import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { User, Package, MapPin, Key, LogOut, Loader2, ChevronRight, Plus, Trash2 } from 'lucide-react';
import './CustomerProfile.css';

interface Address {
    id: string;
    street_address: string;
    city: string;
    state: string;
    postal_code: string;
    is_default: boolean;
}

interface OrderItem {
    id: string;
    product_name: string;
    quantity: number;
    price_cents: number;
}

interface Order {
    id: string;
    total_cents: number;
    status: string;
    created_at: string;
    order_items: OrderItem[];
}

interface CustomerProfile {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string | null;
    created_at: string;
    default_address?: Address | null;
}

export default function CustomerProfile() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<CustomerProfile | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [activeTab, setActiveTab] = useState<'account' | 'orders' | 'addresses' | 'security'>('account');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form States
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
    
    // Address Form
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [newAddress, setNewAddress] = useState({ street: '', city: '', state: '', zip: '' });

    useEffect(() => {
        const loadCustomerProfile = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/login');
                return;
            }

            try {
                const { data: profileData, error: profileError } = await supabase
                    .from('customers')
                    .select(`
                        *,
                        addresses (*),
                        orders (
                            id,
                            total_cents,
                            status,
                            created_at,
                            order_items (
                                id,
                                product_name,
                                quantity,
                                price_cents
                            )
                        )
                    `)
                    .eq('id', user.id)
                    .single();

                if (profileError) throw profileError;

                setProfile(profileData);
                setFullName(profileData?.full_name || '');
                setPhone(profileData?.phone || '');
                setOrders(profileData?.orders || []);
                setAddresses(profileData?.addresses || []);

            } catch (err) {
                console.error('[loadCustomerProfile Fail]', err);
            } finally {
                setLoading(false);
            }
        };

        loadCustomerProfile();
    }, [navigate]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile) return;
        setSaving(true);

        try {
            const { error } = await supabase
                .from('customers')
                .update({
                    full_name: fullName,
                    phone: phone,
                })
                .eq('id', profile.id);

            if (error) throw error;
            alert('Profile updated successfully!');
        } catch (err: any) {
            alert(err.message || 'Update failed');
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.new !== passwordData.confirm) {
            alert('Passwords do not match');
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: passwordData.new });
            if (error) throw error;
            alert('Password updated successfully');
            setPasswordData({ current: '', new: '', confirm: '' });
        } catch (err: any) {
            alert(err.message || 'Password update failed');
        } finally {
            setSaving(false);
        }
    };

    const getInitials = (name?: string) => {
        if (!name) return 'US';
        const parts = name.split(' ');
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return name.substring(0, 2).toUpperCase();
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-black text-white">
            <Loader2 className="animate-spin" size={32} />
        </div>
    );

    return (
        <div className="customer-profile-page bg-black text-white min-h-screen">
            <div className="max-w-6xl mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    
                    {/* Sidebar */}
                    <aside className="md:col-span-1 space-y-6">
                        <div className="flex flex-col items-center p-6 bg-[#0a0a0f] border border-white/5 rounded-2xl">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[#7c6dfa] to-[#a78bfa] flex items-center justify-center text-2xl font-bold mb-4">
                                {getInitials(profile?.full_name)}
                            </div>
                            <h3 className="text-xl font-bold">{profile?.full_name || 'Guest'}</h3>
                            <p className="text-sm text-gray-400">{profile?.email}</p>
                            <p className="text-xs text-gray-500 mt-1">
                                Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('default', { month: 'long', year: 'numeric' }) : 'Join Date'}
                            </p>
                        </div>

                        <nav className="flex flex-col space-y-2">
                            {[
                                { id: 'account', label: 'Account Settings', icon: User },
                                { id: 'orders', label: 'Order History', icon: Package },
                                { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
                                { id: 'security', label: 'Security', icon: Key }
                            ].map(tab => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`flex items-center space-x-3 p-3 rounded-xl transition-all ${activeTab === tab.id ? 'bg-white/10 text-white font-medium' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                                    >
                                        <Icon size={18} />
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </nav>
                        
                        <button 
                            onClick={async () => { await supabase.auth.signOut(); navigate('/login'); }}
                            className="flex items-center space-x-3 p-3 text-red-400 hover:bg-red-500/10 rounded-xl w-full transition-all"
                        >
                            <LogOut size={18} />
                            <span>Sign Out</span>
                        </button>
                    </aside>

                    {/* Main Content */}
                    <main className="md:col-span-3">
                        <div className="bg-[#0a0a0f] border border-white/5 rounded-2xl p-8">
                            
                            {/* ACCOUNT TAB */}
                            {activeTab === 'account' && (
                                <div>
                                    <h2 className="text-2xl font-bold mb-6">Account Settings</h2>
                                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                                        <div>
                                            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Full Name</label>
                                            <input
                                                type="text"
                                                value={fullName}
                                                onChange={e => setFullName(e.target.value)}
                                                className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#7c6dfa]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Email</label>
                                            <input
                                                type="email"
                                                defaultValue={profile?.email}
                                                disabled
                                                className="w-full p-3 bg-white/5 border border-white/5 rounded-xl text-gray-500 cursor-not-allowed"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Phone Number</label>
                                            <input
                                                type="text"
                                                value={phone}
                                                onChange={e => setPhone(e.target.value)}
                                                className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#7c6dfa]"
                                            />
                                        </div>
                                        <button 
                                            type="submit" 
                                            disabled={saving}
                                            className="px-6 py-3 bg-[#7c6dfa] hover:bg-[#6b5ded] text-white font-medium rounded-xl transition-all flex items-center"
                                        >
                                            {saving ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </form>
                                </div>
                            )}

                            {/* ORDERS TAB */}
                            {activeTab === 'orders' && (
                                <div>
                                    <h2 className="text-2xl font-bold mb-6">Order History</h2>
                                    {orders.length === 0 ? (
                                        <div className="text-center py-12 text-gray-500">
                                            <Package size={48} className="mx-auto mb-4 opacity-30" />
                                            <p>No orders yet. Start shopping to see your orders here.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {orders.map(order => {
                                                const statusColors: any = {
                                                    pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
                                                    shipped: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
                                                    delivered: 'bg-green-500/10 text-green-500 border-green-500/20',
                                                    cancelled: 'bg-red-500/10 text-red-500 border-red-500/20'
                                                };
                                                const statusStyle = statusColors[order.status.toLowerCase()] || 'bg-gray-500/10 text-gray-500 border-gray-500/20';

                                                return (
                                                    <div key={order.id} className="p-4 border border-white/5 rounded-xl flex items-center justify-between hover:border-white/10 transition-all">
                                                        <div>
                                                            <p className="font-bold text-sm">Order #{order.id.substring(0, 8).toUpperCase()}</p>
                                                            <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                                                        </div>
                                                        <div className="flex items-center space-x-4">
                                                            <span className={`px-3 py-1 text-xs font-medium border rounded-full ${statusStyle}`}>
                                                                {order.status.toUpperCase()}
                                                            </span>
                                                            <button className="p-2 text-gray-400 hover:text-white"><ChevronRight size={16} /></button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ADDRESSES TAB */}
                            {activeTab === 'addresses' && (
                                <div>
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-2xl font-bold">Saved Addresses</h2>
                                        <button 
                                            onClick={() => setShowAddressForm(!showAddressForm)}
                                            className="flex items-center space-x-2 text-xs font-medium text-[#7c6dfa] hover:text-[#6b5ded]"
                                        >
                                            <Plus size={14} /> <span>Add New</span>
                                        </button>
                                    </div>

                                    {showAddressForm && (
                                        <form className="mb-6 p-4 border border-white/10 rounded-xl space-y-3">
                                            <input type="text" placeholder="Street Address" className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-sm" />
                                            <div className="grid grid-cols-2 gap-2">
                                                <input type="text" placeholder="City" className="p-2 bg-white/5 border border-white/10 rounded-lg text-sm" />
                                                <input type="text" placeholder="State" className="p-2 bg-white/5 border border-white/10 rounded-lg text-sm" />
                                            </div>
                                            <button className="w-full py-2 bg-[#7c6dfa] rounded-lg text-sm font-medium">Save Address</button>
                                        </form>
                                    )}

                                    {addresses.length === 0 ? (
                                        <div className="text-center py-12 text-gray-500">
                                            <MapPin size={48} className="mx-auto mb-4 opacity-30" />
                                            <p>No saved addresses. Add one for faster checkout.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {addresses.map(addr => (
                                                <div key={addr.id} className="p-4 border border-white/5 rounded-xl flex items-center justify-between">
                                                    <div>
                                                        <p className="font-medium">{addr.street_address}</p>
                                                        <p className="text-xs text-gray-400">{addr.city}, {addr.state} {addr.postal_code}</p>
                                                        {addr.is_default && <span className="inline-block mt-1 px-2 py-0.5 text-[10px] bg-[#7c6dfa]/20 text-[#7c6dfa] rounded-full">DEFAULT</span>}
                                                    </div>
                                                    <div className="flex space-x-2">
                                                        <button className="p-2 text-gray-400 hover:text-red-400"><Trash2 size={16} /></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* SECURITY TAB */}
                            {activeTab === 'security' && (
                                <div>
                                    <h2 className="text-2xl font-bold mb-6">Security (Change Password)</h2>
                                    <form onSubmit={handlePasswordChange} className="space-y-4">
                                        <div>
                                            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">New Password</label>
                                            <input
                                                type="password"
                                                value={passwordData.new}
                                                onChange={e => setPasswordData({ ...passwordData, new: e.target.value })}
                                                className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#7c6dfa]"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Confirm New Password</label>
                                            <input
                                                type="password"
                                                value={passwordData.confirm}
                                                onChange={e => setPasswordData({ ...passwordData, confirm: e.target.value })}
                                                className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#7c6dfa]"
                                                required
                                            />
                                        </div>
                                        <button 
                                            type="submit" 
                                            disabled={saving}
                                            className="px-6 py-3 bg-[#7c6dfa] hover:bg-[#6b5ded] text-white font-medium rounded-xl transition-all"
                                        >
                                            {saving ? 'Updating...' : 'Update Password'}
                                        </button>
                                    </form>
                                </div>
                            )}

                        </div>
                    </main>

                </div>
            </div>
        </div>
    );
}
