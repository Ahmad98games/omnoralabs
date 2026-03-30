import React, { useState } from 'react';
import { useForgeController } from '../../platform/forge/ForgeController';
import { useBuilder } from '../../context/BuilderContext';
import { toast } from 'react-hot-toast';

export const ForgeButton: React.FC = () => {
    const [userPrompt, setUserPrompt] = useState('Generate a High-End Sneaker Store for a merchant in Karachi, Pakistan.');
    const [isForging, setIsForging] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [liveLink, setLiveLink] = useState('');
    
    // Grab forge and publish from the Custom Hook
    const { forge, publish } = useForgeController(); 
    const builder = useBuilder();

    const handleForge = async () => {
        if (!userPrompt.trim()) return;
        setIsForging(true);
        try {
            const success = await forge(userPrompt);
            if (success) toast.success("Store forged successfully!");
        } catch (err: unknown) {
            toast.error((err as Error).message || "Forge failed");
        } finally {
            setIsForging(false);
        }
    };

    const handlePublish = async () => {
        setIsPublishing(true);
        try {
            const activePageId = builder?.activePageId || 'home';
            const pages = builder?.pages || { byId: {} };
            const currentPage = pages.byId[activePageId];
            const slug = currentPage?.slug === '/' ? 'home' : currentPage?.slug || 'home';

            const { success, url } = await publish(slug);
            if (success && url) {
                setLiveLink(url);
                setIsModalOpen(true);
                toast.success("Store Published Live!");
            }
        } catch (err: unknown) {
            toast.error((err as Error).message || "Publishing failed");
        } finally {
            setIsPublishing(false);
        }
    };

    const copyToClipboard = () => {
        if (!liveLink) return;
        navigator.clipboard.writeText(liveLink);
        toast.success("Link copied to clipboard!");
    };

    return (
        <div className="forge-container" style={{ padding: '16px', background: '#1c1c1c', borderRadius: '8px', border: '1px solid #333' }}>
            <h3 style={{ color: '#fff', marginBottom: '12px', fontSize: '16px', fontWeight: 600 }}>✨ AI Store Forge</h3>
            <textarea 
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                placeholder="Describe your store..."
                style={{ 
                    width: '100%', padding: '12px', minHeight: '100px', borderRadius: '6px',
                    background: '#0a0a0a', color: '#fff', border: '1px solid #333', marginBottom: '12px', resize: 'vertical'
                }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                    onClick={handleForge}
                    disabled={isForging || isPublishing}
                    style={{
                        padding: '10px 16px', background: isForging ? '#555' : '#6366f1',
                        color: '#fff', border: 'none', borderRadius: '6px',
                        cursor: isForging ? 'not-allowed' : 'pointer', flex: 1, fontWeight: 500
                    }}
                >
                    {isForging ? 'Forging...' : 'Generate Store'}
                </button>
                <button 
                    onClick={handlePublish}
                    disabled={isForging || isPublishing}
                    style={{
                        padding: '10px 16px', background: isPublishing ? '#555' : '#10b981',
                        color: '#fff', border: 'none', borderRadius: '6px',
                        cursor: isPublishing ? 'not-allowed' : 'pointer', flex: 1, fontWeight: 500
                    }}
                >
                    {isPublishing ? 'Publishing...' : '🚀 Go Live'}
                </button>
            </div>
            
            {/* Forge Loading Overlay */}
            {isForging && (
                <div style={S_Overlay}>
                    <div style={S_Spinner} />
                    <div style={{ color: '#fff', fontSize: '18px', fontWeight: 600, animation: 'pulse 2s infinite' }}>
                        Forging your Empire...
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {isModalOpen && (
                <div style={S_Overlay}>
                    <div style={{
                        background: '#18181b', padding: '32px', borderRadius: '12px', width: '400px',
                        textAlign: 'center', border: '1px solid #27272a', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                    }}>
                        <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎉</div>
                        <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Your Store is Live!</h2>
                        <p style={{ color: '#a1a1aa', fontSize: '12px', marginBottom: '20px' }}>Your store page is now published and accessible in public view.</p>
                        
                        <div style={{
                            background: '#09090b', padding: '10px 12px', borderRadius: '6px', border: '1px solid #27272a',
                            color: '#71717a', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap', marginBottom: '16px'
                        }}>
                            {liveLink}
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={copyToClipboard} style={S_ModalBtn('#6366f1')}>Copy Link</button>
                            <button onClick={() => setIsModalOpen(false)} style={S_ModalBtn('#3f3f46')}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
            `}</style>
        </div>
    );
};

const S_Overlay: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 9999
};

const S_Spinner: React.CSSProperties = {
    width: '40px', height: '40px', border: '3px solid #333',
    borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px'
};

const S_ModalBtn = (bg: string): React.CSSProperties => ({
    flex: 1, padding: '10px', background: bg, color: '#fff', border: 'none',
    borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600
});
