/**
 * OrderStore: Singleton Order Management System
 *
 * Simulates backend order processing with localStorage persistence.
 * Publisher-Subscriber pattern (mirrors CartStore/NodeStore).
 */

const ORDER_STORAGE_KEY = 'omnora_orders_v1';
const ORDER_COUNTER_KEY = 'omnora_order_counter_v1';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface OrderCustomer {
    name: string;
    email: string;
    address: string;
    city?: string;
    zip?: string;
    phone?: string;
}

export interface OrderLineItem {
    id: string;
    variantId?: string;
    title: string;
    price: number;
    quantity: number;
    image: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
    id: string;
    customer: OrderCustomer;
    items: OrderLineItem[];
    subtotal: number;
    tax: number;
    total: number;
    status: OrderStatus;
    createdAt: string;
    currency: string;
}

// ─── localStorage Helpers ─────────────────────────────────────────────────────

function loadOrders(): Order[] {
    try {
        const raw = localStorage.getItem(ORDER_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveOrders(orders: Order[]): void {
    try {
        localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orders));
    } catch { /* storage full — fail silently */ }
}

function loadCounter(): number {
    try {
        const raw = localStorage.getItem(ORDER_COUNTER_KEY);
        return raw ? parseInt(raw, 10) || 1000 : 1000;
    } catch {
        return 1000;
    }
}

function saveCounter(n: number): void {
    try {
        localStorage.setItem(ORDER_COUNTER_KEY, String(n));
    } catch { /* fail silently */ }
}

// ─── Store ────────────────────────────────────────────────────────────────────

type OrderListener = () => void;

class OrderStoreImpl {
    private orders: Order[];
    private counter: number;
    private listeners = new Set<OrderListener>();
    private version = 0;

    constructor() {
        this.orders = loadOrders();
        this.counter = loadCounter();
    }

    // ── Getters ──────────────────────────────────────────────────────────────

    getOrders(): Order[] {
        return this.orders;
    }

    getAllOrders(): Order[] {
        return [...this.orders].reverse(); // newest first
    }

    getOrderById(id: string): Order | undefined {
        return this.orders.find(o => o.id === id);
    }

    getLatestOrder(): Order | undefined {
        return this.orders[this.orders.length - 1];
    }

    getOrderCount(): number {
        return this.orders.length;
    }

    getTotalRevenue(): number {
        return Math.round(this.orders.reduce((sum, o) => sum + o.total, 0) * 100) / 100;
    }

    getOrdersByStatus(status: OrderStatus): Order[] {
        return this.orders.filter(o => o.status === status);
    }

    getRecentOrders(limit: number = 5): Order[] {
        return [...this.orders].reverse().slice(0, limit);
    }

    getVersion(): number {
        return this.version;
    }

    // ── Subscription ─────────────────────────────────────────────────────────

    subscribe(listener: OrderListener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notify(): void {
        this.version++;
        this.listeners.forEach(fn => fn());
    }

    // ── Actions ──────────────────────────────────────────────────────────────

    placeOrder(
        customer: OrderCustomer,
        items: OrderLineItem[],
        subtotal: number,
        currency: string = 'USD',
    ): string {
        this.counter++;
        const orderId = `OMN-${this.counter}`;
        const tax = Math.round(subtotal * 0.08 * 100) / 100;

        const order: Order = {
            id: orderId,
            customer,
            items,
            subtotal,
            tax,
            total: Math.round((subtotal + tax) * 100) / 100,
            status: 'confirmed',
            createdAt: new Date().toISOString(),
            currency,
        };

        this.orders = [...this.orders, order];
        saveOrders(this.orders);
        saveCounter(this.counter);
        this.notify();
        return orderId;
    }

    updateStatus(id: string, status: OrderStatus): void {
        this.orders = this.orders.map(o =>
            o.id === id ? { ...o, status } : o
        );
        saveOrders(this.orders);
        this.notify();
    }

    updateOrderStatus(id: string, status: OrderStatus): void {
        this.updateStatus(id, status);
    }

    deleteOrder(id: string): void {
        this.orders = this.orders.filter(o => o.id !== id);
        saveOrders(this.orders);
        this.notify();
    }
}

// ─── Singleton Export ─────────────────────────────────────────────────────────

export const orderStore = new OrderStoreImpl();
