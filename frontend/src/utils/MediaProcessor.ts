import imageCompression from 'browser-image-compression';

/**
 * MediaProcessor: Industrial Media Handling for Omnora OS
 * Enforcing Law 4 (High Contrast/Precision) via WebP Optimization.
 */
export class MediaProcessor {
    /**
     * Automates client-side image compression targeting bandwidth efficiency.
     * Enforces strict 1200px boundaries before payload hits Supabase.
     */
    static async compressForUpload(file: File): Promise<File> {
        const options = {
            maxSizeMB: 1, // Aggressive 1MB clamp for speed
            maxWidthOrHeight: 1200, // Bound strictly for Web Canvas
            useWebWorker: true,
            fileType: 'image/webp' // Native Next-Gen Format Injection
        };

        try {
            const compressed = await imageCompression(file, options);
            return compressed;
        } catch (error) {
            console.error('[MediaProcessor] Compression pipeline failed, reverting to original blob', error);
            return file; 
        }
    }

    /**
     * Intercepts a raw Supabase Storage Object URL and restructures it to 
     * utilize Supabase Storage's /render/ Edge caching engine.
     */
    static getOptimizedUrl(originalUrl: string, width: number = 800, height?: number, quality: number = 80): string {
        if (!originalUrl) return '';
        
        // Return original if not a Supabase storage URL (e.g., Unsplash fallback)
        if (!originalUrl.includes('/storage/v1/object/public/')) return originalUrl;

        try {
            const transformed = originalUrl.replace(
                '/storage/v1/object/public/', 
                '/storage/v1/render/image/public/'
            );
            
            const separator = transformed.includes('?') ? '&' : '?';
            let finalUrl = `${transformed}${separator}width=${width}&quality=${quality}&format=origin-webp`;
            
            if (height) {
                finalUrl += `&height=${height}&resize=cover`;
            }
            
            return finalUrl;
        } catch {
            // Using catch {} without a variable fixes the ESLint @typescript-eslint/no-unused-vars error
            return originalUrl;
        }
    }

    /**
     * Instantly computes a 20px ultra-blurred footprint layout for LCP optimization.
     */
    static getBlurPlaceholder(originalUrl: string): string {
        return this.getOptimizedUrl(originalUrl, 20, undefined, 10);
    }
}