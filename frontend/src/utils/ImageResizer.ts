/**
 * ImageResizer: Dynamic URL Proxy Append Utility
 * * Appends width, height, and quality parameters to leading image CDN URLs
 * (Unsplash, Cloudinary) to avoid loading overweight assets flawlessly.
 * Ensures Law 4 (Precision) via Auto-Format (WebP) injection.
 */

export function resizeImage(url: string, width: number, height?: number, quality = 80): string {
    if (!url) return '';

    try {
        const urlObj = new URL(url);

        // 1. Unsplash Handler (Query-based)
        if (urlObj.hostname.includes('unsplash.com')) {
            urlObj.searchParams.set('w', String(width));
            if (height) urlObj.searchParams.set('h', String(height));
            urlObj.searchParams.set('q', String(quality));
            urlObj.searchParams.set('auto', 'format'); // Forces WebP/AVIF if supported
            urlObj.searchParams.set('fit', 'crop');
            return urlObj.toString();
        }

        // 2. Cloudinary Handler (Path-based)
        if (urlObj.hostname.includes('cloudinary.com')) {
            // Cloudinary uses path-based transformations e.g., /upload/v1234/image.jpg
            const segments = urlObj.pathname.split('/');
            const uploadIndex = segments.indexOf('upload');
            
            if (uploadIndex !== -1) {
                const heightParam = height ? `,h_${height}` : '';
                // f_auto: Automatic format selection (WebP/AVIF)
                // c_fill: Crop to fill dimensions
                const transform = `w_${width}${heightParam},q_${quality},f_auto,c_fill`;
                
                // Insert transform parameters after /upload/
                segments.splice(uploadIndex + 1, 0, transform);
                urlObj.pathname = segments.join('/');
                return urlObj.toString();
            }
        }

        // 3. Generic/Self-hosted (Fallbacks)
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}w=${width}&q=${quality}`;

    } catch {
        // Omitting the variable (e) fixes the ESLint @typescript-eslint/no-unused-vars error
        // Not a valid URL (e.g., Data URI or relative path), return original
        return url;
    }
}