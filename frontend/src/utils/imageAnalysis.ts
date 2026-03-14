export type ImageAnalysisResult = {
    width: number;
    height: number;
    aspectRatio: number;
    sizeMB: number;
    format: string;
    isValid: boolean;
    warnings: string[];
    errors: string[];
};

export const analyzeImage = (file: File): Promise<ImageAnalysisResult> => {
    return new Promise((resolve) => {
        const result: ImageAnalysisResult = {
            width: 0,
            height: 0,
            aspectRatio: 0,
            sizeMB: parseFloat((file.size / (1024 * 1024)).toFixed(2)),
            format: file.type.split('/')[1]?.toUpperCase() || 'UNKNOWN',
            isValid: true,
            warnings: [],
            errors: [],
        };

        // 1. Size Validation (Hard block if > 10MB)
        if (file.size > 10 * 1024 * 1024) {
            result.isValid = false;
            result.errors.push('File exceeds 10MB limit.');
            return resolve(result);
        }

        // 2. MIME Type Validation
        const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            result.isValid = false;
            result.errors.push(`Invalid format: ${result.format}. Please use PNG, JPG, WebP, or SVG.`);
            return resolve(result);
        }

        // 3. Load image for dimension analysis
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                result.width = img.width;
                result.height = img.height;
                result.aspectRatio = img.width / img.height;

                // Dimension Check
                if (img.width < 256 || img.height < 256) {
                    result.warnings.push('Image resolution is low. 512x512 is recommended.');
                }

                // Aspect Ratio Check (Warn if > 4:1 or < 1:4)
                if (result.aspectRatio > 4 || result.aspectRatio < 0.25) {
                    result.warnings.push('Aspect ratio is extreme. Logo may appear stretched.');
                }

                resolve(result);
            };
            img.onerror = () => {
                result.isValid = false;
                result.errors.push('File header is corrupt or not a valid image.');
                resolve(result);
            };

            // If it's an SVG, we might need to handle it differently if it doesn't have intrinsic dimensions
            // but for now img.onload usually works for SVGs in browsers.
            img.src = e.target?.result as string;
        };
        reader.onerror = () => {
            result.isValid = false;
            result.errors.push('Failed to read file.');
            resolve(result);
        };
        reader.readAsDataURL(file);
    });
};
