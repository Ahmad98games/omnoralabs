import React, { useState } from 'react';
import { useCartStore } from '../../store/cartStore';
import { useToast } from '../../context/ToastContext';
import { X, Trash2, Plus, Minus, Loader2, ShoppingBag, CreditCard } from 'lucide-react';
import { CheckoutService } from '../../services/CheckoutService';
import { useStorefront } from '../../hooks/useStorefront';
import { useStoreHydration } from '../../hooks/useStoreHydration';
import { motion, AnimatePresence } from 'framer-motion';

export const CartDrawer: React.FC = () => {
    const cartStore = useCartStore();
    const { 
        isCartOpen, 
        setCartOpen, 
        cartItems, 
        updateQuantity, 
        removeItem, 
        getCartTotal,
        getItemCount 
    } = cartStore;
    
    const isHydrated = useStoreHydration(useCartStore);
    const { showToast } = useToast();
    const { content } = useStorefront();
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    const handleCheckout = async () => {
        if (cartItems.length === 0 || isCheckingOut) return;
        
        setIsCheckingOut(true);
        try {
            const merchantId = content?.seller || 'default_merchant';
            
            // This service will eventually call our new backend endpoint
            const checkoutUrl = await CheckoutService.processCheckout(
                cartItems.map(item => ({
                    id: item.product.id,
                    title: item.product.name,
                    price: item.product.price,
                    quantity: item.quantity,
                    image: item.product.image || '',
                    variantId: item.selectedVariant
                })),
                merchantId
            );

            showToast('Redirecting to secure checkout...', 'success');
            window.location.href = checkoutUrl;
        } catch (err: any) {
            console.error('Checkout Handoff Failed:', err);
            if (err.message === 'MERCHANT_NO_GATEWAY') {
                showToast('Merchant has not configured a payment gateway.', 'error');
            } else {
                showToast('Unable to initiate checkout. Please try again.', 'error');
            }
            setIsCheckingOut(false);
        }
    };

    const cartTotal = getCartTotal();
    const itemCount = getItemCount();

    return (
        <AnimatePresence>
            {isCartOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[99990]"
                        onClick={() => setCartOpen(false)}
                    />

                    {/* Sliding Drawer */}
                    <motion.div 
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-full w-full sm:w-[480px] bg-[#0A0A0A] border-l border-white/10 z-[99991] flex flex-col shadow-[0_0_100px_rgba(0,0,0,1)]"
                    >
                        {/* Glassmorphic Header */}
                        <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-white/[0.02] backdrop-blur-xl">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                                    <ShoppingBag size={22} className="text-indigo-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white tracking-tight">Vault</h2>
                                    <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mt-0.5">Secure Shopping Cart</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setCartOpen(false)}
                                className="p-3 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-all border border-transparent hover:border-white/10"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Cart Items Area */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
                            {!isHydrated ? (
                                // THE MATRIX HYDRATION SKELETON
                                <div className="space-y-6">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex gap-6 p-5 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse">
                                            <div className="w-24 h-32 rounded-xl bg-white/5" />
                                            <div className="flex-1 space-y-4 py-2">
                                                <div className="h-4 bg-white/5 rounded w-3/4" />
                                                <div className="h-3 bg-white/5 rounded w-1/4" />
                                                <div className="flex justify-between items-center pt-4">
                                                    <div className="h-8 bg-white/5 rounded w-20" />
                                                    <div className="h-6 bg-white/5 rounded w-16" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : cartItems.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center">
                                    <div className="w-24 h-24 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center mb-6">
                                        <ShoppingBag size={40} className="text-neutral-700" />
                                    </div>
                                    <p className="text-white font-bold text-xl tracking-tight">The vault is empty</p>
                                    <p className="text-gray-500 text-sm mt-2 max-w-[240px] leading-relaxed">Your curated selection will appear here once you add them to your collection.</p>
                                    <motion.button 
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setCartOpen(false)}
                                        className="mt-8 px-8 py-3 bg-white text-black rounded-xl text-sm font-black uppercase tracking-tighter hover:bg-neutral-200 transition-colors"
                                    >
                                        Explore Collection
                                    </motion.button>
                                </div>
                            ) : (
                                cartItems.map((item, index) => (
                                    <motion.div 
                                        key={`${item.product.id}-${index}`}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="flex gap-6 p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all group relative overflow-hidden"
                                    >
                                        {/* Background Glow */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                        {/* Thumbnail */}
                                        <div className="w-24 h-32 rounded-xl bg-neutral-900 overflow-hidden flex-shrink-0 relative border border-white/10 group-hover:border-white/20 transition-colors">
                                            <img 
                                                src={item.product.image || 'https://via.placeholder.com/150'} 
                                                alt={item.product.name} 
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                        </div>

                                        {/* Details */}
                                        <div className="flex flex-col flex-1 justify-between py-1 relative z-10">
                                            <div className="flex justify-between items-start">
                                                <div className="max-w-[180px]">
                                                    <h3 className="text-sm font-bold text-white leading-snug group-hover:text-indigo-300 transition-colors">{item.product.name}</h3>
                                                    {item.selectedVariant && (
                                                        <span className="inline-block px-2 py-0.5 mt-2 bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-400 rounded-md uppercase tracking-wide">
                                                            {item.selectedVariant}
                                                        </span>
                                                    )}
                                                </div>
                                                <button 
                                                    onClick={() => removeItem(item.product.id, item.selectedVariant)}
                                                    className="text-neutral-600 hover:text-red-400 p-2 hover:bg-red-400/10 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>

                                            <div className="flex items-center justify-between mt-4">
                                                {/* Qty Controls */}
                                                <div className="flex items-center gap-4 bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 shadow-inner">
                                                    <button 
                                                        onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.selectedVariant)}
                                                        className="text-gray-500 hover:text-white disabled:opacity-20 p-1"
                                                        disabled={item.quantity <= 1}
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <span className="text-sm font-black text-white w-4 text-center tabular-nums">{item.quantity}</span>
                                                    <button 
                                                        onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.selectedVariant)}
                                                        className="text-gray-500 hover:text-white p-1"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                                
                                                {/* Price */}
                                                <div className="text-right">
                                                    <p className="text-lg font-bold text-white tracking-tighter tabular-nums">${item.product.price.toFixed(2)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {/* Premium Footer Area */}
                        {cartItems.length > 0 && (
                            <div className="p-8 bg-black/40 border-t border-white/10 backdrop-blur-3xl">
                                <div className="space-y-4 mb-8">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500 font-bold text-xs uppercase tracking-widest">Subtotal</span>
                                        <span className="text-white font-bold tabular-nums">${cartTotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500 font-bold text-xs uppercase tracking-widest">Estimated Tax</span>
                                        <span className="text-gray-400 font-bold tabular-nums">Calculated at next step</span>
                                    </div>
                                    <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                                        <span className="text-white font-black text-sm uppercase tracking-widest">Total</span>
                                        <span className="text-2xl font-black text-white tracking-tighter tabular-nums">
                                            ${cartTotal.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                                
                                <button 
                                    onClick={handleCheckout}
                                    disabled={isCheckingOut}
                                    className="relative w-full group overflow-hidden"
                                >
                                    <motion.div 
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        className="relative flex items-center justify-center gap-3 bg-white text-black rounded-2xl px-8 py-5 transition-all"
                                    >
                                        {isCheckingOut ? (
                                            <Loader2 className="animate-spin" size={20} />
                                        ) : (
                                            <>
                                                <CreditCard size={18} />
                                                <span className="font-black uppercase tracking-tighter text-base">Secure Checkout</span>
                                            </>
                                        )}
                                    </motion.div>
                                    
                                    {/* Animated border/glow */}
                                    <div className="absolute inset-0 rounded-2xl border border-white/20 pointer-events-none" />
                                </button>
                                
                                <div className="mt-6 flex items-center justify-center gap-2 opacity-30 grayscale blur-[0.2px]">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Verified Security by Omnora Vault</span>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
