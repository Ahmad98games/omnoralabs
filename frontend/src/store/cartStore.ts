import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartProduct {
    id: string;
    name: string;
    price: number;
    image: string;
    compareAtPrice?: number;
}

export interface CartItem {
    product: CartProduct;
    quantity: number;
    selectedVariant?: string;
}

interface CartState {
    cartItems: CartItem[];
    isCartOpen: boolean;
    
    // Actions
    addItem: (product: CartProduct, variant?: string, qty?: number) => void;
    removeItem: (productId: string, variant?: string) => void;
    updateQuantity: (productId: string, qty: number, variant?: string) => void;
    clearCart: () => void;
    setCartOpen: (open: boolean) => void;
    
    // Selectors (derived state)
    getCartTotal: () => number;
    getItemCount: () => number;
    
    // Internal Persistence Flag
    _hasHydrated: boolean;
    setHasHydrated: (state: boolean) => void;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            cartItems: [],
            isCartOpen: false,
            _hasHydrated: false,

            addItem: (product, variant, qty = 1) => {
                set((state) => {
                    const existing = state.cartItems.find(
                        (item) => item.product.id === product.id && item.selectedVariant === variant
                    );

                    if (existing) {
                        return {
                            cartItems: state.cartItems.map((item) =>
                                item === existing ? { ...item, quantity: item.quantity + qty } : item
                            ),
                            isCartOpen: true,
                        };
                    }

                    return {
                        cartItems: [...state.cartItems, { product, quantity: qty, selectedVariant: variant }],
                        isCartOpen: true,
                    };
                });
            },

            removeItem: (productId, variant) => {
                set((state) => ({
                    cartItems: state.cartItems.filter(
                        (item) => !(item.product.id === productId && item.selectedVariant === variant)
                    ),
                }));
            },

            updateQuantity: (productId, qty, variant) => {
                if (qty <= 0) {
                    get().removeItem(productId, variant);
                    return;
                }

                set((state) => ({
                    cartItems: state.cartItems.map((item) =>
                        item.product.id === productId && item.selectedVariant === variant
                            ? { ...item, quantity: qty }
                            : item
                    ),
                }));
            },

            clearCart: () => set({ cartItems: [] }),

            setCartOpen: (open) => set({ isCartOpen: open }),

            getCartTotal: () => {
                return get().cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
            },

            getItemCount: () => {
                return get().cartItems.reduce((acc, item) => acc + item.quantity, 0);
            },

            setHasHydrated: (state) => set({ _hasHydrated: state }),
        }),
        {
            name: 'omnora-cart-vault',
            version: 1,
            migrate: (persistedState: any, version: number) => {
                if (version === 0) {
                    // Example migration from older schema if needed
                }
                return persistedState as CartState;
            },
            onRehydrateStorage: (state) => {
                return () => {
                    state?.setHasHydrated(true);
                }
            }
        }
    )
);
