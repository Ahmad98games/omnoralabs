import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import './Login.css';
import './RoleSelector.css';

const Login: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { login, loginWithGoogle, register, user, profile } = useAuth();

    const initialSignUp = (location.state as { isSignUp?: boolean })?.isSignUp ?? false;
    const [isSignUp, setIsSignUp] = useState<boolean>(initialSignUp);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
    });
    const [selectedRole, setSelectedRole] = useState<'customer' | 'seller'>('customer');
    const [error, setError] = useState<string>('');
    const [loadingState, setLoadingState] = useState(false);

    // OSTT FIX: React Context Propagation Listener
    // Wait for the AuthContext to fully hydrate 'user' and 'profile' BEFORE navigating.
    useEffect(() => {
        if (user && profile) {
            const role = profile.role || 'customer';
            console.log("[Login Guard] Identity established. Redirecting role:", role);
            
            if (role === 'admin' || role === 'super-admin') {
                navigate('/admin/dashboard');
            } else if (role === 'seller') {
                navigate('/seller/dashboard?tab=builder');
            } else {
                navigate('/');
            }
        }
    }, [user, profile, navigate]);

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
                // Note: We DO NOT navigate here anymore. The useEffect above handles it once the state is securely synced.
            } else {
                await login(formData.email, formData.password, selectedRole);
                // Note: We DO NOT navigate here anymore. The useEffect above handles it once the state is securely synced.
            }
        } catch (err: unknown) {
            console.error("Auth Error:", err);
            setError((err as Error).message || 'Access Denied. Verify Credentials.');
            setLoadingState(false); // Only set to false on error, let it stay loading on success until redirect
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        setLoadingState(true);
        try {
            localStorage.setItem('omnora_selected_role', selectedRole);
            await loginWithGoogle();
        } catch (err: unknown) {
            setError((err as Error).message || 'Google sign-in failed');
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
                                <label htmlFor="authName" className="text-[10px] font-black uppercase tracking-widest text-white/40">Identification Name</label>
                                <input
                                    id="authName"
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
                            <label htmlFor="authEmail" className="text-[10px] font-black uppercase tracking-widest text-white/40">Credential: Email</label>
                            <input
                                id="authEmail"
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
                            <label htmlFor="authPass" className="text-[10px] font-black uppercase tracking-widest text-white/40">Credential: Private Key</label>
                            <input
                                id="authPass"
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

                    <div className="relative py-4">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5" /></div>
                        <div className="relative flex justify-center text-[8px] uppercase tracking-[0.4em] text-white/20"><span className="bg-[#050505] px-4">Secure Social Link</span></div>
                    </div>

                    <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={loadingState}
                        className="w-full py-4 bg-transparent border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                        Link via Nexus Google
                    </button>
                </form>

                <footer className="text-center pt-4">
                    <button
                        type="button"
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