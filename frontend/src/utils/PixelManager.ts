/**
 * PixelManager: One-Click Meta & TikTok Pixel Integration
 */

export interface PixelEventParams {
    content_name?: string;
    content_ids?: string[];
    content_type?: string;
    value?: number;
    currency?: string;
    eventID?: string;
    [key: string]: unknown;
}

// ─── Industrial Interface Extensions ─────────────────────────────────────────────
export interface FacebookPixel {
    (...args: unknown[]): void;
    push: (...args: unknown[]) => void;
    loaded: boolean;
    version: string;
    queue: unknown[];
    callMethod?: (...args: unknown[]) => void;
}

export interface TikTokPixel {
    page: () => void;
    track: (eventName: string, params?: Record<string, unknown>) => void;
    load: (pixelId: string, options?: Record<string, unknown>) => void;
    methods: string[];
    setAndDefer: (target: Record<string, unknown>, method: string) => void;
    instance: (instanceName: string) => Record<string, unknown>;
    _i?: Record<string, unknown[][]>;
    _t?: Record<string, number>;
    _o?: Record<string, Record<string, unknown>>;
}

declare global {
    interface Window {
        fbq?: (command: string, eventName: string, params?: Record<string, unknown>, config?: Record<string, unknown>) => void;
        _fbq?: FacebookPixel;
        ttq?: TikTokPixel;
        TiktokAnalyticsObject?: string;
    }
}

export type StandardEvent = 
    | 'PageView'
    | 'ViewContent'
    | 'AddToCart'
    | 'InitiateCheckout'
    | 'Purchase';

const CURRENCY = 'USD';

export const PixelManager = {
    /**
     * Safely inject script tags for Pixels if they don't already exist.
     */
    init: (fbPixelId?: string | null, ttPixelId?: string | null) => {
        if (typeof window === 'undefined') return;

        // --- Facebook Pixel ---
        if (fbPixelId && !window.fbq) {
            (function(f: Window, b: Document, e: string, v: string) {
                if (f.fbq) return;
                const n = (f.fbq = function(...args: unknown[]) {
                    if (n.callMethod) {
                        n.callMethod(...args);
                    } else {
                        n.queue.push(args);
                    }
                }) as unknown as FacebookPixel;
                
                if (!f._fbq) f._fbq = n;
                n.push = n;
                n.loaded = true;
                n.version = '2.0';
                n.queue = [];
                const t = b.createElement(e) as HTMLScriptElement;
                t.async = true;
                t.src = v;
                const s = b.getElementsByTagName(e)[0];
                s?.parentNode?.insertBefore(t, s);
            })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
            
            window.fbq?.('init', fbPixelId);
            PixelManager.trackEvent('PageView');
        }

        // --- TikTok Pixel ---
        if (ttPixelId && !window.ttq) {
            (function (w: Window, d: Document, t: 'ttq') {
                w.TiktokAnalyticsObject = t;
                const ttq = (w[t] = w[t] || {
                    page: () => {},
                    track: () => {},
                    load: () => {},
                    methods: [],
                    setAndDefer: () => {},
                    instance: () => ({}),
                }) as TikTokPixel;

                ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie"];
                
                ttq.setAndDefer = function(target: Record<string, unknown>, method: string) {
                    target[method] = function(...args: unknown[]) {
                        const queue = (target.push as unknown as unknown[][]) || [];
                        queue.push([method].concat(args));
                    };
                };

                for (let i = 0; i < ttq.methods.length; i++) {
                    ttq.setAndDefer(ttq as unknown as Record<string, unknown>, ttq.methods[i]);
                }

                ttq.instance = function(instanceName: string) {
                    const inst = (ttq._i?.[instanceName] || []) as unknown as Record<string, unknown>;
                    for (let n = 0; n < ttq.methods.length; n++) {
                        ttq.setAndDefer(inst, ttq.methods[n]);
                    }
                    return inst;
                };

                ttq.load = function(pixelId: string, options?: Record<string, unknown>) {
                    const source = "https://analytics.tiktok.com/i18n/pixel/events.js";
                    ttq._i = ttq._i || {};
                    ttq._i[pixelId] = [];
                    (ttq._i[pixelId] as unknown as { _u: string })._u = source;
                    ttq._t = ttq._t || {};
                    ttq._t[pixelId] = Date.now();
                    ttq._o = ttq._o || {};
                    ttq._o[pixelId] = options || {};
                    const script = d.createElement("script");
                    script.type = "text/javascript";
                    script.async = true;
                    script.src = source + "?sdkid=" + pixelId + "&lib=" + t;
                    const firstScript = d.getElementsByTagName("script")[0];
                    firstScript?.parentNode?.insertBefore(script, firstScript);
                };

                ttq.load(ttPixelId);
                ttq.page();
            })(window, document, 'ttq');
        }
    },

    /**
     * Safely fire events if the pixels are initialized
     */
    trackEvent: (eventName: StandardEvent, params?: PixelEventParams) => {
        if (typeof window === 'undefined') return;

        const p = { currency: CURRENCY, ...params };

        // FB
        if (window.fbq) {
            const eventConfig = p.eventID ? { eventID: p.eventID } : undefined;
            window.fbq('track', eventName, p as Record<string, unknown>, eventConfig as Record<string, unknown>);
        } else {
            console.warn('[PixelManager] fbq not found, event skipped:', eventName);
        }

        // TikTok
        if (window.ttq) {
            if (eventName === 'PageView') {
                window.ttq.page();
            } else {
                window.ttq.track(eventName, p as Record<string, unknown>);
            }
        } else {
            console.warn('[PixelManager] ttq not found, event skipped:', eventName);
        }
    }
};