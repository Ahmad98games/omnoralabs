import React, { useRef, useState, useCallback } from 'react';
import { Upload, X, RefreshCw, AlertCircle, Loader2, CheckCircle2, Info } from 'lucide-react';
import { useMediaStore } from '../../context/MediaStoreContext';
import { analyzeImage, ImageAnalysisResult } from '../../utils/imageAnalysis';

interface LogoPickerProps {
    value: string | null | undefined;
    onChange: (url: string | null) => void;
    label?: string;
    maxHeight?: number;
    maxWidth?: number;
}

const DARK = '#111827';
const ACCENT = '#6366F1';
const WHITE = '#FFFFFF';
const SUCCESS = '#10B981';
const WARNING = '#F59E0B';
const ERROR = '#EF4444';

type UploadStage = 'idle' | 'detecting' | 'analyzing' | 'validating' | 'uploading' | 'success' | 'error';

export const LogoPicker: React.FC<LogoPickerProps> = ({
    value,
    onChange,
    label = "Brand Logo",
    maxHeight = 80,
    maxWidth = 200
}) => {
    const { uploadImage, loading: mediaLoading, resolveAssetUrl, error: mediaError } = useMediaStore();
    const [localLoading, setLocalLoading] = useState(false);
    const [stage, setStage] = useState<UploadStage>('idle');
    const [analysis, setAnalysis] = useState<ImageAnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showTechnical, setShowTechnical] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const isLoading = mediaLoading || localLoading;
    const resolvedUrl = resolveAssetUrl(value || undefined);

    const handleUpload = useCallback(async (file: File) => {
        setError(null);
        setAnalysis(null);
        setLocalLoading(true);
        setShowTechnical(false);

        try {
            // Stage 1: Detecting
            setStage('detecting');
            await new Promise(r => setTimeout(r, 400)); // Small pause for UX visibility

            // Stage 2: Analyzing
            setStage('analyzing');
            const result = await analyzeImage(file);
            setAnalysis(result);

            if (!result.isValid) {
                setStage('error');
                setError(result.errors[0]);
                setLocalLoading(false);
                return;
            }

            // Stage 3: Validating (Checks warnings)
            setStage('validating');
            await new Promise(r => setTimeout(r, 400));

            // Stage 4: Uploading
            setStage('uploading');
            const asset = await uploadImage(file);

            if (asset && asset.url) {
                setStage('success');
                onChange(asset.url);
                setTimeout(() => setStage('idle'), 2000);
            } else {
                setStage('error');
            }
        } catch (err: any) {
            setStage('error');
            setError('An unexpected error occurred during processing.');
        } finally {
            setLocalLoading(false);
        }
    }, [uploadImage, onChange]);

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleUpload(file);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleUpload(file);
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = () => setIsDragging(false);

    return (
        <div style={{ marginBottom: 20 }}>
            {label && (
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 800, marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{label}</span>
                    {analysis && (
                        <span style={{ color: '#94a3b8', textTransform: 'none', fontWeight: 500 }}>
                            {analysis.width}x{analysis.height} • {analysis.sizeMB}MB • {analysis.format}
                        </span>
                    )}
                </div>
            )}

            {!value || stage !== 'idle' ? (
                <div
                    onClick={() => !isLoading && fileInputRef.current?.click()}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    style={{
                        border: `2px dashed ${stage === 'error' ? ERROR : stage === 'success' ? SUCCESS : isDragging ? ACCENT : '#E2E8F0'}`,
                        borderRadius: 12,
                        padding: '24px 16px',
                        textAlign: 'center',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        background: stage === 'error' ? 'rgba(239, 68, 68, 0.02)' : isDragging ? 'rgba(99, 102, 241, 0.04)' : '#F8FAFC',
                        position: 'relative',
                        overflow: 'hidden',
                        minHeight: 120,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <input type="file" ref={fileInputRef} hidden accept="image/png, image/jpeg, image/svg+xml, image/webp" onChange={onFileChange} />

                    {isLoading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Loader2 className="animate-spin" size={28} color={ACCENT} />
                                <div style={{ position: 'absolute', fontSize: 10, fontWeight: 800, color: ACCENT }}>
                                    {stage === 'detecting' ? '1' : stage === 'analyzing' ? '2' : stage === 'validating' ? '3' : '4'}
                                </div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: DARK }}>
                                    {stage === 'detecting' && 'Detecting file...'}
                                    {stage === 'analyzing' && 'Analyzing image structure...'}
                                    {stage === 'validating' && 'Validating requirements...'}
                                    {stage === 'uploading' && 'Uploading to secure storage...'}
                                </div>
                                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                                    Step {stage === 'detecting' ? '1' : stage === 'analyzing' ? '2' : stage === 'validating' ? '3' : '4'} of 4
                                </div>
                            </div>
                        </div>
                    ) : stage === 'success' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                            <CheckCircle2 size={32} color={SUCCESS} />
                            <div style={{ fontSize: 13, fontWeight: 700, color: DARK }}>Upload Successful</div>
                        </div>
                    ) : stage === 'error' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                            <AlertCircle size={32} color={ERROR} />
                            <div style={{ fontSize: 13, fontWeight: 700, color: DARK }}>Upload Failed</div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>Click to try again</div>
                        </div>
                    ) : (
                        <>
                            <div style={{ fontSize: 24, marginBottom: 8 }}>☁️</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: DARK, marginBottom: 4 }}>
                                Drag & drop or click to upload
                            </div>
                            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>
                                PNG, JPG, WebP, SVG • Max 10MB
                            </div>
                        </>
                    )}
                </div>
            ) : (
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 16 }}>
                    <div style={{
                        height: maxHeight,
                        maxWidth: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: WHITE,
                        borderRadius: 8,
                        border: '1px solid #F1F5F9',
                        padding: 12,
                        marginBottom: 12,
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <img
                            src={resolvedUrl}
                            style={{
                                maxHeight: '100%',
                                maxWidth: maxWidth,
                                objectFit: 'contain',
                            }}
                            alt="Logo implementation"
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                        <button
                            disabled={isLoading}
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                flex: 2,
                                height: 32,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                                background: WHITE,
                                border: '1px solid #E2E8F0',
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 700,
                                color: DARK,
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <RefreshCw size={12} /> Replace Logo
                        </button>
                        <button
                            disabled={isLoading}
                            onClick={() => onChange(null)}
                            style={{
                                flex: 1,
                                height: 32,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                                background: '#FEF2F2',
                                border: '1px solid #FEE2E2',
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 700,
                                color: '#EF4444',
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <X size={14} /> Remove
                        </button>
                    </div>
                </div>
            )}

            {analysis?.warnings && analysis.warnings.length > 0 && stage !== 'error' && (
                <div style={{ marginTop: 12, padding: 10, background: 'rgba(245, 158, 11, 0.05)', borderRadius: 8, border: '1px solid rgba(245, 158, 11, 0.1)' }}>
                    {analysis.warnings.map((w, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, color: WARNING, fontSize: 11, fontWeight: 600 }}>
                            <Info size={12} /> {w}
                        </div>
                    ))}
                </div>
            )}

            {(error || mediaError) && (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        color: ERROR,
                        fontSize: 12,
                        fontWeight: 700,
                        padding: '10px 12px',
                        background: 'rgba(239, 68, 68, 0.05)',
                        borderRadius: 8,
                        border: '1px solid rgba(239, 68, 68, 0.1)',
                        animation: 'shake 0.4s cubic-bezier(.36,.07,.19,.97) both'
                    }}>
                        <AlertCircle size={14} />
                        <div style={{ flex: 1 }}>{error || mediaError}</div>
                        <button
                            onClick={() => setShowTechnical(!showTechnical)}
                            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 10, cursor: 'pointer', textDecoration: 'underline' }}
                        >
                            {showTechnical ? 'Hide Analysis' : 'Why this failed?'}
                        </button>
                    </div>

                    {showTechnical && (
                        <div style={{
                            padding: 12,
                            background: '#0f172a',
                            borderRadius: 8,
                            color: '#94a3b8',
                            fontSize: 10,
                            fontFamily: 'monospace',
                            lineHeight: 1.5
                        }}>
                            <div>[STAGE]: {stage.toUpperCase()}</div>
                            {analysis && (
                                <>
                                    <div>[FILE]: {analysis.format} • {analysis.sizeMB}MB</div>
                                    <div>[DIMS]: {analysis.width}x{analysis.height} (Ratio: {analysis.aspectRatio.toFixed(2)})</div>
                                </>
                            )}
                            {mediaError && <div style={{ color: '#f87171', marginTop: 4 }}>[SERVER]: {mediaError}</div>}
                        </div>
                    )}

                    <style>{`
                        @keyframes shake {
                            10%, 90% { transform: translate3d(-1px, 0, 0); }
                            20%, 80% { transform: translate3d(2px, 0, 0); }
                            30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                            40%, 60% { transform: translate3d(4px, 0, 0); }
                        }
                    `}</style>
                </div>
            )}
        </div>
    );
};
