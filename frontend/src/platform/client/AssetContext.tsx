import React, { createContext, useContext, useState, useCallback } from 'react';
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

interface AssetContextState {
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

const AssetContext = createContext<AssetContextState | undefined>(undefined);

/**
 * AssetProvider: Platform-wide asset resolution and management.
 * Note: Uploads/Fetching are typically Editor-only, but the contract 
 * allows for consumer-side implementations (e.g. UGC in storefront).
 */
export const AssetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [assets, setAssets] = useState<ImageAsset[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });

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
                setAssets(prev => [newAsset, ...prev]);
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

    const resolveAssetUrl = useCallback((assetId: string | undefined) => {
        if (!assetId) return '';
        if (assetId.startsWith('http') || assetId.startsWith('/')) return assetId;
        const asset = assets.find(a => a._id === assetId);
        if (asset) return asset.url;
        return `/uploads/${assetId}`;
    }, [assets]);

    return (
        <AssetContext.Provider value={{
            assets,
            loading,
            error,
            pagination,
            fetchGallery,
            uploadImage,
            resolveAssetUrl
        }}>
            {children}
        </AssetContext.Provider>
    );
};

export const useMediaStore = () => {
    const context = useContext(AssetContext);
    if (!context) {
        // Fallback for isolated runtime
        return {
            resolveAssetUrl: (id: string | undefined) => id ? `/uploads/${id}` : '',
            assets: [],
            loading: false,
            error: null,
            pagination: { total: 0, page: 1, pages: 1 },
            fetchGallery: async () => { },
            uploadImage: async () => null,
        };
    }
    return context;
};
