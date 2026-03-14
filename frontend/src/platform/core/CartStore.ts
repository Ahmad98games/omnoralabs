/**
 * CartStore v2: Singleton Cart State Machine + localStorage Persistence
 * 
 * Phase 5 Upgrade: Hydrates from localStorage on init, auto-saves on change.
 * Publisher-Subscriber architecture (mirrors NodeStore pattern).
 * Fully decoupled from React.
 *
 * DESIGN: No React Context API. Pure external store for maximum performance.
 */

const STORAGE_KEY = 'omnora_cart_v1';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface CartItem {
    id: string;
    variantId?: string;
    title: string;
    price: number;
    compareAtPrice?: number;
    quantity: number;
    image: string;
    handle?: string;
}

export interface AppliedDiscount {
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
}

export interface CartState {
    items: CartItem[];
    isOpen: boolean;
    totalAmount: number;        // subtotal (before discount)
    totalItems: number;
    appliedDiscount: AppliedDiscount | null;
    discountAmount: number;     // dollars saved
    finalTotal: number;         // totalAmount - discountAmount
}

// ─── localStorage Helpers ─────────────────────────────────────────────────────

function loadFromStorage(): CartItem[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        // Validate each item has required fields
        return parsed.filter(
            (item: any) =>
                item && typeof item.id === 'string' &&
                typeof item.title === 'string' &&
                typeof item.price === 'number' &&
                typeof item.quantity === 'number'
        );
    } catch {
        // Corrupted storage — fail silently, start fresh
        return [];
    }
}

function saveToStorage(items: CartItem[]): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
        // Storage full or unavailable — fail silently
    }
}

// ─── Cart Store ───────────────────────────────────────────────────────────────

type CartListener = () => void;

class CartStoreImpl {
    private state: CartState;
    private listeners = new Set<CartListener>();
    private version = 0;

    constructor() {
        // Hydrate from localStorage
        const savedItems = loadFromStorage();
        const totals = this.recalcTotals(savedItems, null);
        this.state = {
            items: savedItems,
            isOpen: false,
            appliedDiscount: null,
            ...totals,
        };
    }

    // ── Getters ────────────────────────────────────────────────────────────────

    getState(): CartState {
        return this.state;
    }

    getVersion(): number {
        return this.version;
    }

    // ── Subscription ───────────────────────────────────────────────────────────

    subscribe(listener: CartListener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notify(): void {
        this.version++;
        this.listeners.forEach(fn => fn());
    }

    /** Persist items to localStorage after state change */
    private persist(): void {
        saveToStorage(this.state.items);
    }

    private recalcTotals(items: CartItem[], discount: AppliedDiscount | null): Pick<CartState, 'totalAmount' | 'totalItems' | 'discountAmount' | 'finalTotal'> {
        const subtotalCents = items.reduce((sum, item) => sum + Math.round(item.price * 100) * item.quantity, 0);
        const subtotal = subtotalCents / 100;
        const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

        let discountCents = 0;
        if (discount) {
            if (discount.type === 'percentage') {
                discountCents = Math.round(subtotalCents * discount.value / 100);
            } else {
                discountCents = Math.round(discount.value * 100);
            }
            // Never discount more than the subtotal
            discountCents = Math.min(discountCents, subtotalCents);
        }

        return {
            totalAmount: subtotal,
            totalItems,
            discountAmount: discountCents / 100,
            finalTotal: (subtotalCents - discountCents) / 100,
        };
    }

    // ── Mutations ──────────────────────────────────────────────────────────────

    addItem(product: {
        id: string;
        variantId?: string;
        title: string;
        price: number;
        compareAtPrice?: number;
        image: string;
        handle?: string;
    }): void {
        const existingIndex = this.state.items.findIndex(
            item => item.id === product.id && item.variantId === product.variantId
        );

        let nextItems: CartItem[];

        if (existingIndex >= 0) {
            nextItems = this.state.items.map((item, i) =>
                i === existingIndex
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            );
        } else {
            nextItems = [
                ...this.state.items,
                {
                    id: product.id,
                    variantId: product.variantId,
                    title: product.title,
                    price: product.price,
                    compareAtPrice: product.compareAtPrice,
                    quantity: 1,
                    image: product.image,
                    handle: product.handle,
                },
            ];
        }

        this.state = {
            ...this.state,
            items: nextItems,
            ...this.recalcTotals(nextItems, this.state.appliedDiscount),
        };
        this.persist();
        this.notify();
    }

    removeItem(id: string, variantId?: string): void {
        const nextItems = this.state.items.filter(
            item => !(item.id === id && item.variantId === (variantId ?? item.variantId))
        );

        this.state = {
            ...this.state,
            items: nextItems,
            ...this.recalcTotals(nextItems, this.state.appliedDiscount),
        };
        this.persist();
        this.notify();
    }

    updateQuantity(id: string, quantity: number, variantId?: string): void {
        if (quantity <= 0) {
            this.removeItem(id, variantId);
            return;
        }

        const nextItems = this.state.items.map(item =>
            item.id === id && item.variantId === (variantId ?? item.variantId)
                ? { ...item, quantity }
                : item
        );

        this.state = {
            ...this.state,
            items: nextItems,
            ...this.recalcTotals(nextItems, this.state.appliedDiscount),
        };
        this.persist();
        this.notify();
    }

    openCart(): void {
        if (this.state.isOpen) return;
        this.state = { ...this.state, isOpen: true };
        this.notify();
    }

    closeCart(): void {
        if (!this.state.isOpen) return;
        this.state = { ...this.state, isOpen: false };
        this.notify();
    }

    toggleCart(): void {
        this.state = { ...this.state, isOpen: !this.state.isOpen };
        this.notify();
    }

    clearCart(): void {
        this.state = {
            items: [],
            isOpen: this.state.isOpen,
            totalAmount: 0,
            totalItems: 0,
            appliedDiscount: null,
            discountAmount: 0,
            finalTotal: 0,
        };
        this.persist();
        this.notify();
    }

    applyDiscount(discount: AppliedDiscount): void {
        this.state = {
            ...this.state,
            appliedDiscount: discount,
            ...this.recalcTotals(this.state.items, discount),
        };
        this.notify();
    }

    clearDiscount(): void {
        this.state = {
            ...this.state,
            appliedDiscount: null,
            ...this.recalcTotals(this.state.items, null),
        };
        this.notify();
    }
}

// ─── Singleton Export ─────────────────────────────────────────────────────────

export const cartStore = new CartStoreImpl();
