/**
 * ImageResizer: Dynamic URL Proxy Append Utility
 * 
 * Appends width, height, and quality parameters to leading image CDN URLs
 * (Unsplash, Cloudinary) to avoid loading overweight assets flawlessly.
 */

export function resizeImage(url: string, width: number, height?: number, quality = 80): string {
    if (!url) return '';

    try {
        const urlObj = new URL(url);

        // 1. Unsplash Handler
        if (urlObj.hostname.includes('unsplash.com')) {
            urlObj.searchParams.set('w', String(width));
            if (height) urlObj.searchParams.set('h', String(height));
            urlObj.searchParams.set('q', String(quality));
            urlObj.searchParams.set('auto', 'format'); // Forces WebP/AVIF if supported
            urlObj.searchParams.set('fit', 'crop');
            return urlObj.toString();
        }

        // 2. Cloudinary Handler
        if (urlObj.hostname.includes('cloudinary.com')) {
            // Cloudinary uses path-based transformations e.g., /upload/v1234/image.jpg
            // We insert transform parameters before /v: /upload/w_300,q_80,f_auto/v1234/image.jpg
            const segments = urlObj.pathname.split('/');
            const uploadIndex = segments.indexOf('upload');
            if (uploadIndex !== -1) {
                const heightParam = height ? `,h_${height}` : '';
                const transform = `w_${width}${heightParam},q_${quality},f_auto,c_fill`;
                segments.splice(uploadIndex + 1, 0, transform);
                urlObj.pathname = segments.join('/');
                return urlObj.toString();
            }
        }

        // 3. Generic/Self-hosted (Fallbacks)
        // Standard parameters sometimes picked up by CDNs
        if (url.includes('?')) return `${url}&w=${width}&q=${quality}`;
        return `${url}?w=${width}&q=${quality}`;

    } catch (e) {
        // Not a valid URL (e.g., Data URI or relative path)
        return url;
    }
}
