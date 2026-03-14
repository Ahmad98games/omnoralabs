/**
 * SupabaseStorageClient: Production Cloud Storage Adapter
 *
 * Implements IStorageClient using Supabase Storage.
 * Bucket: 'media_assets' (must be created in Supabase Dashboard → Storage).
 * Files are organized by merchant: media_assets/{merchantId}/{timestamp}_{filename}
 *
 * DESIGN: Drop-in replacement for MockStorageClient.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { IStorageClient, UploadedAsset } from './StorageClient';

const BUCKET = 'media_assets';

export class SupabaseStorageClient implements IStorageClient {
    constructor(private sb: SupabaseClient) { }

    async uploadFile(file: File, merchantId: string): Promise<string> {
        // Validate file
        const MAX_SIZE = 5 * 1024 * 1024; // 5MB for production
        if (file.size > MAX_SIZE) {
            throw new Error(`File "${file.name}" exceeds the 5MB limit.`);
        }

        const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
        if (!allowed.includes(file.type)) {
            throw new Error(`File type "${file.type}" is not supported.`);
        }

        // Generate unique path: merchantId/timestamp_filename
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = `${merchantId}/${Date.now()}_${safeName}`;

        const { error } = await this.sb.storage
            .from(BUCKET)
            .upload(filePath, file, {
                cacheControl: '31536000',   // 1 year cache
                upsert: false,
            });

        if (error) throw new Error(`[SupabaseStorage] Upload failed: ${error.message}`);

        // Get public URL
        const { data: urlData } = this.sb.storage
            .from(BUCKET)
            .getPublicUrl(filePath);

        console.log(
            `%c[Omnora Storage] 📁 Uploaded: ${file.name} → ${filePath}`,
            'color: #34d399; font-weight: bold;'
        );

        return urlData.publicUrl;
    }

    async getFiles(merchantId: string): Promise<UploadedAsset[]> {
        const { data, error } = await this.sb.storage
            .from(BUCKET)
            .list(merchantId, {
                limit: 200,
                sortBy: { column: 'created_at', order: 'desc' },
            });

        if (error) throw new Error(`[SupabaseStorage] List failed: ${error.message}`);
        if (!data) return [];

        return data
            .filter((item: any) => !item.id.endsWith('/'))   // exclude folder markers
            .map((item: any) => {
                const fullPath = `${merchantId}/${item.name}`;
                const { data: urlData } = this.sb.storage
                    .from(BUCKET)
                    .getPublicUrl(fullPath);

                return {
                    url: urlData.publicUrl,
                    fileName: item.name,
                    size: item.metadata?.size || 0,
                    uploadedAt: item.created_at || new Date().toISOString(),
                };
            });
    }

    async deleteFile(url: string, merchantId: string): Promise<void> {
        // Extract the file path from the public URL
        const bucketPath = `${BUCKET}/`;
        const pathIndex = url.indexOf(bucketPath);
        if (pathIndex < 0) {
            throw new Error('[SupabaseStorage] Could not extract file path from URL.');
        }
        const filePath = url.substring(pathIndex + bucketPath.length);

        const { error } = await this.sb.storage
            .from(BUCKET)
            .remove([filePath]);

        if (error) throw new Error(`[SupabaseStorage] Delete failed: ${error.message}`);

        console.log(
            `%c[Omnora Storage] 🗑 Deleted: ${filePath}`,
            'color: #ff4d6a; font-weight: bold;'
        );
    }
}
