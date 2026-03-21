/**
 * Dynamic OG-Image Generator Utility
 * 
 * Generates URL parameters for the Supabase Edge Function to generate an OG image dynamically.
 */

interface OgImageParams {
    title: string;
    price?: number;
    currency?: string;
    imageUrl?: string;
    merchantName?: string;
}

export const getDynamicOgUrl = (params: OgImageParams): string => {
    // Determine the base URL for the Supabase Edge Function
    // Fallback to local or dev URL if process.env isn't set
    const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/og-image`;

    const searchParams = new URLSearchParams();
    searchParams.set('title', params.title);
    
    if (params.price) {
        searchParams.set('price', params.price.toString());
    }
    if (params.currency) {
        searchParams.set('currency', params.currency);
    }
    if (params.imageUrl) {
        searchParams.set('image', params.imageUrl);
    }
    if (params.merchantName) {
        searchParams.set('merchant', params.merchantName);
    }

    return `${edgeFunctionUrl}?${searchParams.toString()}`;
};
