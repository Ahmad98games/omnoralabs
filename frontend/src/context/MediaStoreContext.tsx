import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import axios from 'axios';

interface ImageAsset {
    _id: string;
    originalName: string;
    fileName: string;
    url: string;
    size: number;
    mimeType: string;
    uploadedAt: string;
}

interface MediaStoreState {
    assets: ImageAsset[];
    loading: boolean;
    error: string | null;
    pagination: {
        total: number;
        page: number;
        pages: number;
    };
    fetchGallery: (page?: number) => Promise<void>;
    uploadImage: (file: File) => Promise<ImageAsset | null>;
    resolveAssetUrl: (assetId: string | undefined) => string;
}

const MediaStoreContext = createContext<MediaStoreState | undefined>(undefined);

export const MediaStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [assets, setAssets] = useState<ImageAsset[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });

    // ─── FETCH GALLERY ─────────────────────────────────────────────────────────
    const fetchGallery = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const response = await axios.get(`/api/media/gallery?page=${page}`, { withCredentials: true });
            if (response.data.success) {
                setAssets(response.data.assets);
                setPagination(response.data.pagination);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to fetch gallery');
        } finally {
            setLoading(false);
        }
    }, []);

    // ─── UPLOAD IMAGE ──────────────────────────────────────────────────────────
    const uploadImage = useCallback(async (file: File) => {
        const formData = new FormData();
        formData.append('image', file);

        setLoading(true);
        setError(null);
        try {
            const response = await axios.post('/api/media/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                withCredentials: true
            });

            if (response.data.success) {
                const newAsset = response.data.asset;
                setAssets(prev => [newAsset, ...prev]); // Optimistic update
                return newAsset;
            }
            return null;
        } catch (err: any) {
            setError(err.response?.data?.error || 'Upload failed');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // ─── ASSET RESOLVER ────────────────────────────────────────────────────────
    const resolveAssetUrl = useCallback((assetId: string | undefined) => {
        if (!assetId) return '';
        // If it's already a URL (legacy support), return as is
        if (assetId.startsWith('http') || assetId.startsWith('/')) return assetId;

        // Find in local state first (cache)
        const asset = assets.find(a => a._id === assetId);
        if (asset) return asset.url;

        // Fallback: we might need a dedicated resolution endpoint if the asset is not in current page
        // For now, we assume builder components might store the full path if they are already migrated
        // or we can construct it if we know the pattern
        return `/uploads/${assetId}`; // Simplistic but matches our naming convention
    }, [assets]);

    return (
        <MediaStoreContext.Provider value={{
            assets,
            loading,
            error,
            pagination,
            fetchGallery,
            uploadImage,
            resolveAssetUrl
        }}>
            {children}
        </MediaStoreContext.Provider>
    );
};

export const useMediaStore = () => {
    const context = useContext(MediaStoreContext);
    if (!context) throw new Error('useMediaStore must be used within MediaStoreProvider');
    return context;
};
