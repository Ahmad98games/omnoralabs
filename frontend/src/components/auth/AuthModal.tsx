import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { X, Mail, Lock, User as UserIcon, Loader2, Zap } from 'lucide-react';

export const AuthModal: React.FC = () => {
    const { isAuthModalOpen, authModalMode, setAuthModalOpen, login, register: signUp } = useAuth();
    const navigate = useNavigate();
    
    const [isLogin, setIsLogin] = useState(authModalMode === 'login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Sync mode when modal opens
    useEffect(() => {
        if (isAuthModalOpen) {
            setIsLogin(authModalMode === 'login');
            setError('');
        }
    }, [isAuthModalOpen, authModalMode]);

    if (!isAuthModalOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            let authenticatedUser;
            if (isLogin) {
                authenticatedUser = await login(email, password);
            } else {
                authenticatedUser = await signUp(name, email, password, 'seller'); 
            }
            
            setAuthModalOpen(false);

            // Precision Post-Login Redirection based on Role
            if (authenticatedUser?.role === 'admin' || authenticatedUser?.role === 'super-admin') {
                navigate('/admin/dashboard');
            } else if (authenticatedUser?.role === 'seller') {
                navigate('/seller/dashboard?tab=builder');
            } else {
                navigate('/');
            }

        } catch (err: any) {
            setError(err.message || 'Authentication failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop Blur overlay */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity"
                onClick={() => setAuthModalOpen(false)}
            />
            
            {/* Glassmorphic Modal */}
            <div className="relative w-full max-w-md bg-[#0a0a0f]/90 border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(124,109,250,0.15)] overflow-hidden">
                {/* Ethereal Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-[#7c6dfa] to-transparent" />
                
                <button 
                    onClick={() => setAuthModalOpen(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="p-8">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-white/10 mb-4 text-[#7c6dfa]">
                            <Zap size={24} className={loading ? 'animate-pulse' : ''} />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                            {isLogin ? 'Welcome Back' : 'Create Your Engine'}
                        </h2>
                        <p className="text-sm text-gray-400">
                            {isLogin ? 'Enter your credentials to access the builder.' : 'Start building your next-gen store for free.'}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4 text-white">
                        {!isLogin && (
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <UserIcon size={18} className="text-gray-500" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Full Name"
                                    className="block w-full pl-10 pr-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7c6dfa] focus:border-transparent transition-all sm:text-sm"
                                />
                            </div>
                        )}

                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail size={18} className="text-gray-500" />
                            </div>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email Address"
                                className="block w-full pl-10 pr-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7c6dfa] focus:border-transparent transition-all sm:text-sm"
                            />
                        </div>

                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock size={18} className="text-gray-500" />
                            </div>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                className="block w-full pl-10 pr-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7c6dfa] focus:border-transparent transition-all sm:text-sm"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-gradient-to-r from-[#7c6dfa] to-[#9b8aff] hover:from-[#6b5ded] hover:to-[#8a79ef] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7c6dfa] focus:ring-offset-[#0a0a0f] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : (isLogin ? 'Sign In' : 'Start Building')}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            type="button"
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError('');
                            }}
                            className="text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
