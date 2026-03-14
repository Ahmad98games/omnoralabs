/**
 * useCart: React subscription hook for CartStore.
 * 
 * Uses useSyncExternalStore for Level 3 Render Isolation —
 * components only re-render when the cart state reference changes.
 * No React Context overhead.
 */
import { useSyncExternalStore, useCallback } from 'react';
import { cartStore, CartState } from '../platform/core/CartStore';

/**
 * Full cart state subscription.
 * Use in CartDrawer, header badge, checkout page.
 */
export function useCart(): CartState {
    const subscribe = useCallback(
        (onStoreChange: () => void) => cartStore.subscribe(onStoreChange),
        []
    );
    return useSyncExternalStore(subscribe, () => cartStore.getState());
}

/**
 * Selective cart subscription — only re-renders when selector output changes.
 * Use for surgical subscriptions (e.g., just totalItems for a badge).
 */
export function useCartSelector<T>(selector: (state: CartState) => T): T {
    const subscribe = useCallback(
        (onStoreChange: () => void) => cartStore.subscribe(onStoreChange),
        []
    );
    return useSyncExternalStore(subscribe, () => selector(cartStore.getState()));
}

/**
 * Cart actions — stable references, never cause re-renders.
 */
export const cartActions = {
    addItem: cartStore.addItem.bind(cartStore),
    removeItem: cartStore.removeItem.bind(cartStore),
    updateQuantity: cartStore.updateQuantity.bind(cartStore),
    openCart: cartStore.openCart.bind(cartStore),
    closeCart: cartStore.closeCart.bind(cartStore),
    toggleCart: cartStore.toggleCart.bind(cartStore),
    clearCart: cartStore.clearCart.bind(cartStore),
    applyDiscount: cartStore.applyDiscount.bind(cartStore),
    clearDiscount: cartStore.clearDiscount.bind(cartStore),
} as const;
