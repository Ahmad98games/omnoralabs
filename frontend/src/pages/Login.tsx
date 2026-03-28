
import React, { useEffect, useState } from 'react';

import { useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import client from '../api/client';

import './Login.css';
import './RoleSelector.css';



// Canvas animation is handled globally via script in index.html or can be re-initialized here if needed.

const Login: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { login, loginWithGoogle, register } = useAuth();

    const initialSignUp = (location.state as any)?.isSignUp ?? false;
    const [isSignUp, setIsSignUp] = useState<boolean>(initialSignUp);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
    });
    const [selectedRole, setSelectedRole] = useState<'customer' | 'seller'>('customer');
    const [error, setError] = useState<string>('');
    const [loadingState, setLoadingState] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoadingState(true);

        try {
            if (isSignUp) {
                await register(formData.name, formData.email, formData.password, selectedRole);
                if (selectedRole === 'seller') navigate('/seller/dashboard?tab=builder');
                else navigate('/');
            } else {
                const loggedUser = await login(formData.email, formData.password);
                if (loggedUser) {
                    const role = loggedUser.role || 'customer';
                    if (role === 'admin' || role === 'super-admin') navigate('/admin/dashboard');
                    else if (role === 'seller') navigate('/seller/dashboard?tab=builder');
                    else navigate('/');
                }
            }
        } catch (err: any) {
            console.error("Auth Error:", err);
            setError(err.message || 'Access Denied. Verify Credentials.');
        } finally {
            setLoadingState(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        setLoadingState(true);
        try {
            localStorage.setItem('omnora_selected_role', selectedRole);
            await loginWithGoogle();
        } catch (err: any) {
            setError(err.message || 'Google sign-in failed');
        } finally {
            setLoadingState(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#000000] text-white flex items-center justify-center p-6 selection:bg-white/20 selection:text-black">
            {/* 🛡️ BACKGROUND TEXTURE */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/[0.02] rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
            </div>

            <div className="w-full max-w-[440px] relative z-10 space-y-12">
                {/* 🏷️ BRANDING */}
                <header className="text-center space-y-4">
                    <span className="text-[10px] font-black tracking-[0.5em] uppercase text-white/40 block">Omnora Security</span>
                    <h1 className="text-4xl font-black tracking-tighter uppercase">{isSignUp ? 'Create Identity' : 'Secure Entry'}</h1>
                    <p className="text-white/20 text-xs font-medium italic tracking-tight uppercase">Authorized Personnel Only</p>
                </header>

                {/* 📂 ROLE TOGGLE (Lead Industrial Design) */}
                <div className="grid grid-cols-2 p-1 bg-white/[0.03] border border-white/10 rounded-sm">
                    <button
                        type="button"
                        onClick={() => setSelectedRole('customer')}
                        className={`py-3 text-[10px] font-black tracking-widest uppercase transition-all duration-300 ${selectedRole === 'customer' ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
                    >
                        Customer
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedRole('seller')}
                        className={`py-3 text-[10px] font-black tracking-widest uppercase transition-all duration-300 ${selectedRole === 'seller' ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
                    >
                        Atelier Access
                    </button>
                </div>

                <div className="space-y-8 bg-[#050505] p-10 border border-white/5 shadow-2xl">
                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] font-bold uppercase tracking-widest">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {isSignUp && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Identification Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full bg-black border border-white/10 p-4 text-sm font-bold tracking-tight focus:border-white/40 transition-colors outline-none"
                                    placeholder="Enter Full Name"
                                    required
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Credential: Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full bg-black border border-white/10 p-4 text-sm font-bold tracking-tight focus:border-white/40 transition-colors outline-none"
                                placeholder="name@domain.com"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Credential: Private Key</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full bg-black border border-white/10 p-4 text-sm font-bold tracking-tight focus:border-white/40 transition-colors outline-none"
                                placeholder="••••••••••••"
                                required
                            />
                        </div>

                    <button
                        type="submit"
                        disabled={loadingState}
                        className="w-full py-5 bg-white text-black text-xs font-black uppercase tracking-[0.3em] hover:bg-white/90 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                        {loadingState ? 'Verifying...' : isSignUp ? 'Initialize Profile' : 'Gain Access'}
                    </button>
                </form>

                <footer className="text-center pt-4">
                    <button
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-[9px] font-black uppercase tracking-widest text-white/30 hover:text-white transition-colors"
                    >
                        {isSignUp ? 'Already authorized? Gain Access' : 'New operator? Initialize identity'}
                    </button>
                </footer>
            </div>
        </div>
    </div>
);
};

export default Login;