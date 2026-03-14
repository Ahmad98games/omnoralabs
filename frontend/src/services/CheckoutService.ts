import client from '../api/client';

export interface CheckoutLineItem {
    id: string;
    title: string;
    price: number;
    quantity: number;
    image: string;
    variantId?: string;
}

export class CheckoutService {
    /**
     * processCheckout: formulated checkout payload and redirect
     */
    static async processCheckout(items: CheckoutLineItem[], merchantId: string): Promise<string> {
        if (!items || items.length === 0) {
            throw new Error('Cart is empty');
        }

        try {
            // Call the real backend endpoint
            const response = await client.post('/payment/checkout/create-session', {
                items: items.map(item => ({
                    id: item.id,
                    quantity: item.quantity,
                    variantId: item.variantId
                })),
                tenantId: merchantId
            });

            if (response.data?.success && response.data?.url) {
                return response.data.url;
            } else {
                throw new Error(response.data?.error || 'Failed to create checkout session');
            }
        } catch (err: any) {
            console.error('Checkout API Error:', err);
            // Re-throw specific errors for the UI to handle
            if (err.response?.data?.error === 'MERCHANT_NO_GATEWAY') {
                throw new Error('MERCHANT_NO_GATEWAY');
            }
            throw new Error(err.response?.data?.error || 'Unable to initiate checkout. Please try again.');
        }
    }
}
