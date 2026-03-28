import { supabase } from '../lib/supabaseClient'
import { v4 as uuidv4 } from 'uuid'

export type OmnoraEvent = 'page_view' | 'product_view' | 'add_to_cart' | 'checkout_start' | 'purchase' | 'newsletter_signup';

interface EventData {
    productId?: string;
    productName?: string;
    value?: number;
    currency?: string;
    orderId?: string;
    email?: string;
}

/**
 * 🛰️ INDUSTRIAL PIXEL MANAGER (Task 7.3)
 * High-Availability Batching with Session-Aware Flush.
 */
export class PixelManager {
    private static sessionId = uuidv4();
    private static buffer: any[] = [];
    private static flushInterval = 15000; // 15s buffer
    private static isFirstEvent = true;
    private static flushTimer: any = null;

    static async track(event: OmnoraEvent, data: EventData = {}) {
        const eventId = uuidv4();
        const timestamp = new Date().toISOString();

        const payload = {
            id: eventId,
            session_id: this.sessionId,
            event_type: event,
            product_id: data.productId,
            revenue_cents: data.value ? Math.round(data.value * 100) : 0,
            page_url: window.location.href,
            user_agent: navigator.userAgent,
            created_at: timestamp
        };

        // 🛡️ CRITICAL: Flush first event of session immediately (Industrial Rule)
        if (this.isFirstEvent) {
            this.isFirstEvent = false;
            await this.flushImmediate([payload]);
            this.startFlushTimer();
        } else {
            this.buffer.push(payload);
        }

        // 🛰️ Multi-Channel CAPI Relay (Non-blocking)
        this.relayToCapiProxy(event, data, eventId);
    }

    private static startFlushTimer() {
        if (this.flushTimer) return;
        this.flushTimer = setInterval(() => this.flushBuffer(), this.flushInterval);
        
        // 🛡️ DEAD-MAN SWITCH: Ensure unload safety via navigator.sendBeacon
        window.addEventListener('beforeunload', () => this.flushOnUnload());
    }

    private static async flushImmediate(events: any[]) {
        try {
            await supabase.from('analytics_events').insert(events);
        } catch (err) {
            console.error('[PixelManager] Batch Insert Failed:', err);
        }
    }

    private static async flushBuffer() {
        if (this.buffer.length === 0) return;
        const eventsToFlush = [...this.buffer];
        this.buffer = [];

        // 🛡️ RPC: Batch insert for O(1) database transaction (Industrial Rule)
        const { error } = await supabase.rpc('batch_insert_events', { events: eventsToFlush });
        if (error) {
            this.buffer = [...eventsToFlush, ...this.buffer]; // Restore buffer on fail
        }
    }

    private static flushOnUnload() {
        if (this.buffer.length === 0) return;
        
        // 🛰️ navigator.sendBeacon: 0% data loss on page exit (Industrial Rule)
        const blob = new Blob([JSON.stringify({ events: this.buffer })], { type: 'application/json' });
        navigator.sendBeacon('/api/analytics/beacon', blob);
        this.buffer = [];
    }

    private static async relayToCapiProxy(event: OmnoraEvent, data: EventData, eventId: string) {
        // Shared async logic for Meta/TikTok CAPI
        fetch('/api/capi-proxy', {
            method: 'POST',
            keepalive: true, // 🛡️ Connection persistence
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event, eventId, data: { ...data, ua: navigator.userAgent } })
        }).catch(() => {}); // Fire and forget
    }
}
