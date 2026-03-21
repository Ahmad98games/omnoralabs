import imageCompression from 'browser-image-compression';

export class MediaProcessor {
    /**
     * Automates client-side image compression specifically targeting 
     * bandwidth restrictions before the payload even hits Supabase Storage.
     * Enforces strict 1200px boundaries.
     */
    static async compressForUpload(file: File): Promise<File> {
        const options = {
            maxSizeMB: 1, // Aggressive 1MB clamp
            maxWidthOrHeight: 1200, // Bound strictly for Web
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
     * Intercepts a raw Supabase Storage Object URL and dynamically restructures 
     * it to utilize Supabase Storage's built-in /render/ Edge caching engine.
     * Specifically forces 'format=origin-webp' natively.
     */
    static getOptimizedUrl(originalUrl: string, width: number = 800, height?: number, quality: number = 80): string {
        if (!originalUrl) return '';
        // If it's not a Supabase storage URL (e.g. Unsplash fallback), return as is
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
        } catch (e) {
            return originalUrl;
        }
    }

    /**
     * Instantly computes a 10px ultra-blurred footprint layout.
     */
    static getBlurPlaceholder(originalUrl: string): string {
        return this.getOptimizedUrl(originalUrl, 20, undefined, 10);
    }
}
