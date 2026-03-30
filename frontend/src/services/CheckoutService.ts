import client from '../api/client';
import { AxiosError } from 'axios';

export interface CheckoutLineItem {
    id: string;
    title: string;
    price: number;
    quantity: number;
    image: string;
    variantId?: string;
}

/**
 * Logic: Created an interface for the expected API response to avoid 'any'.
 */
interface CheckoutResponse {
    success: boolean;
    url?: string;
    error?: string;
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
            const response = await client.post<CheckoutResponse>('/payment/checkout/create-session', {
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
        } catch (err) {
            // FIX: Using AxiosError type guard instead of 'any'
            const axiosError = err as AxiosError<{ error?: string }>;
            console.error('Checkout API Error:', axiosError);

            if (axiosError.response?.data?.error === 'MERCHANT_NO_GATEWAY') {
                throw new Error('MERCHANT_NO_GATEWAY');
            }
            
            throw new Error(axiosError.response?.data?.error || 'Unable to initiate checkout. Please try again.');
        }
    }
}