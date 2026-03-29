/**
 * PixelManager: One-Click Meta & TikTok Pixel Integration
 */

interface PixelEventParams {
    content_name?: string;
    content_ids?: string[];
    content_type?: string;
    value?: number;
    currency?: string;
    eventID?: string;
    [key: string]: any;
}

export type StandardEvent = 
    | 'PageView'
    | 'ViewContent'
    | 'AddToCart'
    | 'InitiateCheckout'
    | 'Purchase';

const CURRENCY = 'USD'; // Modify or fetch dynamically if multi-currency

export const PixelManager = {
    /**
     * Safely inject script tags for Pixels if they don't already exist.
     */
    init: (fbPixelId?: string | null, ttPixelId?: string | null) => {
        if (typeof window === 'undefined') return;

        // --- Facebook Pixel ---
        if (fbPixelId && !(window as any).fbq) {
            !function(f:any,b:any,e:any,v:any,n?:any,t?:any,s?:any)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            
            (window as any).fbq('init', fbPixelId);
            PixelManager.trackEvent('PageView');
        }

        // --- TikTok Pixel ---
        if (ttPixelId && !(window as any).ttq) {
            !function (w:any, d:any, t:any) {
              w.TiktokAnalyticsObject=t;const ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];ttq.setAndDefer=function(t:any,e:any){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(let i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t:any){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e:any,n:any){const i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};const o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;const a=document.getElementsByTagName("script")[0];a.parentNode?.insertBefore(o,a)};
              ttq.load(ttPixelId);
              ttq.page();
            }(window, document, 'ttq');
        }
    },

    /**
     * Safely fire events if the pixels are initialized
     */
    trackEvent: (eventName: StandardEvent, params?: PixelEventParams) => {
        if (typeof window === 'undefined') return;

        const p = { currency: CURRENCY, ...params };

        // FB
        if ((window as any).fbq) {
            const eventConfig = p.eventID ? { eventID: p.eventID } : undefined;
            if (eventName === 'PageView') {
                (window as any).fbq('track', 'PageView', p, eventConfig);
            } else {
                (window as any).fbq('track', eventName, p, eventConfig);
            }
        } else {
            console.warn('[PixelManager] fbq not found, event skipped:', eventName);
        }

        // TikTok
        if ((window as any).ttq) {
            if (eventName === 'PageView') {
                // TikTok 'page' is usually called on init, but can be recalled
                (window as any).ttq.page();
            } else {
                (window as any).ttq.track(eventName, p);
            }
        } else {
            console.warn('[PixelManager] ttq not found, event skipped:', eventName);
        }
    }
};
