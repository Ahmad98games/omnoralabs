/**
 * StorageClient: Cloud File Storage Adapter
 *
 * IStorageClient interface for file upload/retrieval.
 * MockStorageClient uses localStorage + base64 for dev.
 * Swap with SupabaseStorageClient (Supabase Storage) for production.
 *
 * DESIGN: Same adapter pattern as DatabaseClient.
 */

// ─── Interface ────────────────────────────────────────────────────────────────

import { supabase } from '../../lib/supabaseClient';
import { SupabaseStorageClient } from './SupabaseStorageClient';

export interface UploadedAsset {
    url: string;
    fileName: string;
    size: number;
    uploadedAt: string;
}

export interface IStorageClient {
    /** Upload a file, returns the public URL */
    uploadFile(file: File, merchantId: string): Promise<string>;
    /** Get all previously uploaded file URLs for a merchant */
    getFiles(merchantId: string): Promise<UploadedAsset[]>;
    /** Delete a file by URL */
    deleteFile(url: string, merchantId: string): Promise<void>;
}

// ─── Validation ───────────────────────────────────────────────────────────────

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

function validateFile(file: File): void {
    if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File "${file.name}" exceeds the 2MB limit (${(file.size / 1024 / 1024).toFixed(1)}MB).`);
    }
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowed.includes(file.type)) {
        throw new Error(`File type "${file.type}" is not supported. Use JPEG, PNG, GIF, WebP, or SVG.`);
    }
}

// ─── Mock Implementation (localStorage + Base64) ──────────────────────────────

const STORAGE_KEY_PREFIX = 'omnora_media_';

function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

class MockStorageClient implements IStorageClient {

    async uploadFile(file: File, merchantId: string): Promise<string> {
        validateFile(file);

        // Simulate upload latency
        await new Promise(r => setTimeout(r, 500));

        const base64 = await fileToBase64(file);
        const assets = this.loadAssets(merchantId);

        const asset: UploadedAsset = {
            url: base64, // In production: public CDN URL
            fileName: file.name,
            size: file.size,
            uploadedAt: new Date().toISOString(),
        };

        assets.push(asset);
        this.saveAssets(merchantId, assets);

        console.log(
            `%c[Omnora Storage] 📁 File uploaded: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`,
            'color: #34d399; font-weight: bold;'
        );

        return base64;
    }

    async getFiles(merchantId: string): Promise<UploadedAsset[]> {
        await new Promise(r => setTimeout(r, 200));
        return this.loadAssets(merchantId);
    }

    async deleteFile(url: string, merchantId: string): Promise<void> {
        const assets = this.loadAssets(merchantId).filter(a => a.url !== url);
        this.saveAssets(merchantId, assets);
    }

    private loadAssets(merchantId: string): UploadedAsset[] {
        try { return JSON.parse(localStorage.getItem(`${STORAGE_KEY_PREFIX}${merchantId}`) || '[]'); }
        catch { return []; }
    }

    private saveAssets(merchantId: string, assets: UploadedAsset[]): void {
        try { localStorage.setItem(`${STORAGE_KEY_PREFIX}${merchantId}`, JSON.stringify(assets)); }
        catch { console.warn('[MockStorage] localStorage full — cleanup recommended.'); }
    }
}

// ─── Singleton Export (Environment-Aware DI) ──────────────────────────────────

function createStorageClient(): IStorageClient {
    const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || '';
    if (supabaseUrl) {
        console.log('%c[Omnora] ☁️ Using Supabase Cloud Storage', 'color: #7c6dfa; font-weight: bold;');
        return new SupabaseStorageClient(supabase);
    }
    console.log('%c[Omnora] 💾 Using Mock Storage (localStorage)', 'color: #f59e0b; font-weight: bold;');
    return new MockStorageClient();
}

export const storageClient: IStorageClient = createStorageClient();

