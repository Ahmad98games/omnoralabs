import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ArrowRight, Zap, Target, ShieldCheck, Box, ChevronRight, Store } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export const LandingPage: React.FC = () => {
    const { setAuthModalOpen } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Check if we were redirected here because we need auth
    useEffect(() => {
        const state = location.state as { requireAuth?: boolean };
        if (state?.requireAuth) {
            setAuthModalOpen(true);
        }
    }, [location, setAuthModalOpen]);

    const handleStartBuilding = () => {
        setAuthModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white selection:bg-[#3b82f6]/30 selection:text-white font-sans overflow-x-hidden relative">
            {/* Global Nav for the SaaS Landing */}
            <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5">
                <div className="flex items-center gap-3">
                    <img src="/images/omnora store.png" alt="Omnora OS" className="h-8" />
                    <span className="font-bold text-lg tracking-tight">Omnora OS</span>
                </div>
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate('/store/demo')} className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                        View Demo Store
                    </button>
                    <button 
                        onClick={() => setAuthModalOpen(true)}
                        className="text-sm font-medium text-white hover:text-[#3b82f6] transition-colors"
                    >
                        Sign In
                    </button>
                    <button 
                        onClick={handleStartBuilding}
                        className="px-5 py-2 rounded-full bg-white text-black text-sm font-bold tracking-wide hover:bg-gray-200 transition-colors"
                    >
                        Start Free
                    </button>
                </div>
            </nav>

            {/* --- HERO SECTION ---  */}
            <header className="relative w-full min-h-screen flex items-center justify-center overflow-hidden pt-20">
                {/* Immersive Cyberpunk Grid Background */}
                <div className="absolute inset-0 z-0 flex items-center justify-center opacity-30">
                    <div className="absolute w-[800px] h-[800px] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen" />
                    <div className="absolute w-[600px] h-[600px] bg-violet-600/20 rounded-full blur-[100px] mix-blend-screen translate-x-1/2 -translate-y-1/4" />
                </div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay z-0" />

                <div className="relative z-10 container mx-auto px-6 md:px-12 flex flex-col items-center text-center mt-10">
                    <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8 animate-fade-in-up">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-xs uppercase tracking-[0.2em] text-gray-300 font-medium pt-0.5">Omnora OS Version 4.0</span>
                    </div>

                    <h1 className="text-6xl md:text-8xl font-black text-white mb-6 leading-[1.1] tracking-tighter drop-shadow-2xl animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                        Build Your Next-Gen <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400">Store with AI.</span>
                    </h1>
                    
                    <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-12 font-light leading-relaxed animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                        The ultimate intelligent commerce platform. Launch a lightning-fast, high-converting storefront in minutes with an integrated AI builder. No coding required.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-6 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                        <button 
                            onClick={handleStartBuilding}
                            className="group relative px-10 py-4 bg-white text-black font-extrabold tracking-[0.05em] rounded-full overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.2)]"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                Start Building for Free <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </span>
                        </button>
                        
                        <button 
                            onClick={() => navigate('/store/demo')}
                            className="group flex items-center justify-center gap-3 px-10 py-4 rounded-full border border-white/20 text-white font-bold tracking-wide transition-all hover:bg-white/5 hover:border-white/40"
                        >
                            <Store size={18} className="text-gray-400 group-hover:text-white transition-colors" />
                            Explore Demo Store
                        </button>
                    </div>

                    {/* Step-by-Step Tour Visual */}
                    <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl text-left animate-fade-in-up" style={{ animationDelay: '500ms' }}>
                        <div className="bg-white/5 border border-white/10 p-8 rounded-2xl backdrop-blur-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Zap size={64} /></div>
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-6 border border-blue-500/20">
                                01
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Sign up as Seller</h3>
                            <p className="text-sm text-gray-400 leading-relaxed">Create your Omnora merchant account instantly to provision your isolated store territory.</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-8 rounded-2xl backdrop-blur-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Target size={64} /></div>
                            <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 mb-6 border border-violet-500/20">
                                02
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Use AI to Design</h3>
                            <p className="text-sm text-gray-400 leading-relaxed">Enter our visual Live Canvas. Hit generating prompts to construct your layout and color palette.</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-8 rounded-2xl backdrop-blur-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Box size={64} /></div>
                            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6 border border-indigo-500/20">
                                03
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Start Selling</h3>
                            <p className="text-sm text-gray-400 leading-relaxed">Connect your payment gateway, add products in the admin, and deploy your sovereign web app.</p>
                        </div>
                    </div>
                </div>
            </header>
        </div>
    );
};
