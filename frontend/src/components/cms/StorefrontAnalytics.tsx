import React, { useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useStorefront } from '../../context/StorefrontContext';
import { databaseClient } from '../../platform/core/DatabaseClient';

/**
 * StorefrontAnalytics Component
 * 
 * Automatically tracks page views and product views based on routing.
 * Injected into the OmnoraRenderer or HostnameInterceptor.
 */
export const StorefrontAnalytics: React.FC = () => {
    const { state } = useStorefront();
    const location = useLocation();
    const params = useParams();
    const merchantId = state.merchantId;

    useEffect(() => {
        if (!merchantId || merchantId === 'default_merchant') return;

        const trackPageView = async () => {
            const isProductPage = location.pathname.includes('/product/');
            const productId = isProductPage ? params.id : undefined;

            try {
                await databaseClient.trackInteraction(merchantId, {
                    eventType: isProductPage ? 'product_view' : 'page_view',
                    productId,
                    metadata: {
                        path: location.pathname,
                        referrer: document.referrer,
                        userAgent: navigator.userAgent
                    }
                });
            } catch (err) {
                console.error('[Analytics] Failed to track interaction:', err);
            }
        };

        trackPageView();
    }, [location.pathname, merchantId, params.id]);

    return null; // Purely functional
};
