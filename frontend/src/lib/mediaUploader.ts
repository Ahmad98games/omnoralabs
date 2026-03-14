/**
 * mediaUploader.ts — Supabase Storage Upload Utility
 *
 * Strict MIME validation, file size enforcement, and tenant-scoped
 * upload paths. Designed for zero-trust media ingestion.
 *
 * INVARIANTS:
 *  - Max file size: 2MB (2_097_152 bytes)
 *  - Allowed MIME types: image/jpeg, image/png, image/webp
 *  - Upload path: products/{merchantId}/{timestamp}_{sanitizedName}
 *  - Returns a deterministic public URL on success
 */

import { supabase } from '../lib/supabaseClient';

// ─── Constants ──────────────────────────────────────────────────────────────

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const BUCKET_NAME = 'product-images';

// ─── Validation Types ───────────────────────────────────────────────────────

export interface UploadValidationError {
    readonly type: 'INVALID_MIME' | 'FILE_TOO_LARGE' | 'UPLOAD_FAILED';
    readonly message: string;
    readonly details?: string;
}

export type UploadResult =
    | { success: true; publicUrl: string; path: string }
    | { success: false; error: UploadValidationError };

// ─── Pre-Upload Validation (Client-Side Gate) ───────────────────────────────

export function validateMediaFile(file: File): UploadValidationError | null {
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
        return {
            type: 'INVALID_MIME',
            message: `Invalid file type: ${file.type}. Allowed: JPEG, PNG, WebP.`,
        };
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        return {
            type: 'FILE_TOO_LARGE',
            message: `File size (${sizeMB}MB) exceeds the 2MB limit.`,
        };
    }

    return null; // Valid
}

// ─── Sanitization ───────────────────────────────────────────────────────────

function sanitizeFileName(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9.\-_]/g, '_')
        .replace(/_{2,}/g, '_')
        .slice(0, 100);
}

// ─── Upload Executor ────────────────────────────────────────────────────────

export async function uploadProductMedia(
    file: File,
    merchantId: string
): Promise<UploadResult> {
    // Layer 1: Client-side validation (redundant guard even if caller validated)
    const validationError = validateMediaFile(file);
    if (validationError) {
        return { success: false, error: validationError };
    }

    // Layer 2: Construct tenant-scoped path
    const timestamp = Date.now();
    const sanitized = sanitizeFileName(file.name);
    const filePath = `products/${merchantId}/${timestamp}_${sanitized}`;

    try {
        // Layer 3: Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, file, {
                cacheControl: '31536000', // 1 year CDN cache
                contentType: file.type,
                upsert: false,
            });

        if (error || !data) {
            return {
                success: false,
                error: {
                    type: 'UPLOAD_FAILED',
                    message: 'Supabase Storage rejected the upload.',
                    details: error?.message ?? 'No data returned',
                },
            };
        }

        // Layer 4: Generate public URL
        const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(data.path);

        return {
            success: true,
            publicUrl: urlData.publicUrl,
            path: data.path,
        };
    } catch (err) {
        return {
            success: false,
            error: {
                type: 'UPLOAD_FAILED',
                message: 'Network error during upload.',
                details: err instanceof Error ? err.message : 'Unknown error',
            },
        };
    }
}
