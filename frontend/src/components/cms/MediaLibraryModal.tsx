/**
 * MediaLibraryModal: Global Asset Manager UI
 *
 * Cinematic dark-themed modal for image upload and selection.
 * Triggered from anywhere in the Builder or Admin Dashboard.
 *
 * Features:
 *   - Drag-and-drop upload zone with 2MB validation
 *   - Responsive grid of previously uploaded images
 *   - Click-to-select + "Insert" mechanism
 *   - Loading states for upload progress
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { storageClient, type UploadedAsset } from '../../platform/core/StorageClient';

// ─── Design Tokens ────────────────────────────────────────────────────────────

const T = {
    bg: '#0a0a0f',
    surface: '#111118',
    surface2: '#1a1a24',
    surface3: '#222230',
    border: '#2a2a3a',
    accent: '#7c6dfa',
    accentDim: 'rgba(124,109,250,0.15)',
    text: '#f0f0f5',
    textDim: '#8b8ba0',
    textMuted: '#5a5a70',
    danger: '#ff4d6a',
    success: '#34d399',
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface MediaLibraryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (url: string) => void;
    merchantId: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const MediaLibraryModal: React.FC<MediaLibraryModalProps> = ({ isOpen, onClose, onSelect, merchantId }) => {
    const [assets, setAssets] = useState<UploadedAsset[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Load assets on open ───────────────────────────────────────────────
    useEffect(() => {
        if (!isOpen || !merchantId) return;
        let mounted = true;
        setLoading(true);
        setSelectedUrl(null);
        setError(null);
        storageClient.getFiles(merchantId)
            .then(files => { if (mounted) setAssets(files); })
            .catch(() => { if (mounted) setError('Failed to load media.'); })
            .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, [isOpen, merchantId]);

    // ── Upload handler ────────────────────────────────────────────────────
    const handleUpload = useCallback(async (files: FileList | File[]) => {
        if (!merchantId) return;
        setError(null);
        setUploading(true);

        const fileArray = Array.from(files);
        for (const file of fileArray) {
            try {
                const url = await storageClient.uploadFile(file, merchantId);
                setAssets(prev => [...prev, { url, fileName: file.name, size: file.size, uploadedAt: new Date().toISOString() }]);
                setSelectedUrl(url);
            } catch (err: any) {
                setError(err.message || 'Upload failed.');
            }
        }
        setUploading(false);
    }, [merchantId]);

    // ── Drag & Drop ───────────────────────────────────────────────────────
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    }, []);

    const handleDragLeave = useCallback(() => setDragOver(false), []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files.length > 0) {
            handleUpload(e.dataTransfer.files);
        }
    }, [handleUpload]);

    // ── Insert action ─────────────────────────────────────────────────────
    const handleInsert = useCallback(() => {
        if (selectedUrl) {
            onSelect(selectedUrl);
            onClose();
        }
    }, [selectedUrl, onSelect, onClose]);

    // ── Delete asset ──────────────────────────────────────────────────────
    const handleDelete = useCallback(async (url: string) => {
        try {
            await storageClient.deleteFile(url, merchantId);
            setAssets(prev => prev.filter(a => a.url !== url));
            if (selectedUrl === url) setSelectedUrl(null);
        } catch { /* ignore */ }
    }, [merchantId, selectedUrl]);

    if (!isOpen) return null;

    return (
        <div style={overlayStyle} onClick={onClose}>
            <div style={modalStyle} onClick={e => e.stopPropagation()}>
                {/* ── Header ──────────────────────────────── */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '20px 24px', borderBottom: `1px solid ${T.border}`,
                }}>
                    <div>
                        <h2 style={{ fontSize: 18, fontWeight: 800, color: T.text, margin: 0, letterSpacing: '-0.02em' }}>
                            Media Library
                        </h2>
                        <p style={{ fontSize: 11, color: T.textMuted, margin: '4px 0 0' }}>
                            {assets.length} file{assets.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <button onClick={onClose} style={closeBtnStyle}>✕</button>
                </div>

                {/* ── Body ────────────────────────────────── */}
                <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
                    {/* Upload Zone */}
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            border: `2px dashed ${dragOver ? T.accent : T.border}`,
                            borderRadius: 12, padding: '28px 20px',
                            textAlign: 'center', cursor: 'pointer',
                            background: dragOver ? T.accentDim : T.surface2,
                            transition: 'all 0.2s', marginBottom: 20,
                        }}
                    >
                        {uploading ? (
                            <>
                                <div style={spinnerStyle} />
                                <p style={{ color: T.textDim, fontSize: 13, marginTop: 10, marginBottom: 0 }}>Uploading…</p>
                            </>
                        ) : (
                            <>
                                <span style={{ fontSize: 28, display: 'block', marginBottom: 6, opacity: 0.5 }}>📁</span>
                                <p style={{ color: T.textDim, fontSize: 13, fontWeight: 600, margin: '0 0 4px' }}>
                                    Drop files here or click to browse
                                </p>
                                <p style={{ color: T.textMuted, fontSize: 11, margin: 0 }}>
                                    JPEG, PNG, GIF, WebP, SVG — max 2MB
                                </p>
                            </>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={e => { if (e.target.files) handleUpload(e.target.files); }}
                            style={{ display: 'none' }}
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div style={{
                            padding: '10px 14px', borderRadius: 8, marginBottom: 16,
                            background: 'rgba(255,77,106,0.1)', border: '1px solid rgba(255,77,106,0.2)',
                            color: T.danger, fontSize: 12, fontWeight: 600,
                        }}>
                            {error}
                        </div>
                    )}

                    {/* Grid */}
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 40 }}>
                            <div style={spinnerStyle} />
                            <p style={{ color: T.textMuted, fontSize: 12, marginTop: 10 }}>Loading media…</p>
                        </div>
                    ) : assets.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 40 }}>
                            <span style={{ fontSize: 36, display: 'block', marginBottom: 8, opacity: 0.2 }}>🖼️</span>
                            <p style={{ color: T.textMuted, fontSize: 13, margin: 0 }}>No images uploaded yet.</p>
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                            gap: 10,
                        }}>
                            {assets.map((asset, i) => {
                                const isSelected = selectedUrl === asset.url;
                                return (
                                    <div
                                        key={`${asset.fileName}-${i}`}
                                        onClick={() => setSelectedUrl(isSelected ? null : asset.url)}
                                        style={{
                                            position: 'relative',
                                            aspectRatio: '1', borderRadius: 8, overflow: 'hidden',
                                            cursor: 'pointer',
                                            border: `2px solid ${isSelected ? T.accent : 'transparent'}`,
                                            boxShadow: isSelected ? `0 0 0 2px ${T.accentDim}` : 'none',
                                            transition: 'all 0.15s',
                                        }}
                                    >
                                        <img
                                            src={asset.url}
                                            alt={asset.fileName}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                        />
                                        {/* Selection checkmark */}
                                        {isSelected && (
                                            <div style={{
                                                position: 'absolute', top: 4, right: 4,
                                                width: 20, height: 20, borderRadius: 10,
                                                background: T.accent, color: '#fff',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 11, fontWeight: 800,
                                            }}>
                                                ✓
                                            </div>
                                        )}
                                        {/* Delete button */}
                                        <button
                                            onClick={e => { e.stopPropagation(); handleDelete(asset.url); }}
                                            style={{
                                                position: 'absolute', bottom: 4, right: 4,
                                                width: 22, height: 22, borderRadius: 6,
                                                background: 'rgba(0,0,0,0.7)', border: 'none',
                                                color: T.textMuted, fontSize: 12, cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                opacity: 0.6, transition: 'opacity 0.15s',
                                            }}
                                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
                                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.6'; }}
                                            title="Delete"
                                        >
                                            🗑
                                        </button>
                                        {/* File name tooltip */}
                                        <div style={{
                                            position: 'absolute', bottom: 0, left: 0, right: 0,
                                            padding: '16px 6px 4px',
                                            background: 'linear-gradient(transparent, rgba(0,0,0,0.75))',
                                            fontSize: 9, color: '#ccc', fontWeight: 500,
                                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                        }}>
                                            {asset.fileName}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ── Footer ──────────────────────────────── */}
                <div style={{
                    display: 'flex', justifyContent: 'flex-end', gap: 10,
                    padding: '16px 24px', borderTop: `1px solid ${T.border}`,
                }}>
                    <button onClick={onClose} style={btnSecondary}>Cancel</button>
                    <button
                        onClick={handleInsert}
                        disabled={!selectedUrl}
                        style={{
                            ...btnPrimary,
                            opacity: selectedUrl ? 1 : 0.4,
                            cursor: selectedUrl ? 'pointer' : 'not-allowed',
                        }}
                    >
                        Insert Selected
                    </button>
                </div>
            </div>

            <style>{`@keyframes omnoraMediaSpin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 10000,
};

const modalStyle: React.CSSProperties = {
    background: T.surface, border: `1px solid ${T.border}`,
    borderRadius: 16, width: '90%', maxWidth: 680,
    maxHeight: '80vh', display: 'flex', flexDirection: 'column',
    boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
    overflow: 'hidden',
};

const closeBtnStyle: React.CSSProperties = {
    background: 'none', border: 'none', color: T.textMuted,
    fontSize: 18, cursor: 'pointer', padding: 4,
    transition: 'color 0.15s',
};

const btnPrimary: React.CSSProperties = {
    padding: '10px 22px', background: `linear-gradient(135deg, ${T.accent}, #9b8aff)`,
    border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 700,
    cursor: 'pointer', boxShadow: '0 2px 12px rgba(124,109,250,0.3)',
};

const btnSecondary: React.CSSProperties = {
    padding: '10px 22px', background: T.surface2,
    border: `1px solid ${T.border}`, borderRadius: 8,
    color: T.textDim, fontSize: 13, fontWeight: 600, cursor: 'pointer',
};

const spinnerStyle: React.CSSProperties = {
    width: 24, height: 24,
    border: '2.5px solid #27272a', borderTopColor: T.accent,
    borderRadius: '50%', display: 'inline-block',
    animation: 'omnoraMediaSpin 0.7s linear infinite',
};

export default MediaLibraryModal;
