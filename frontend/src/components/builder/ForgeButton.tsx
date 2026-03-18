import React, { useState } from 'react';
import { handleForgeGeneration } from '../../platform/forge/ForgeController';
import { useBuilder } from '../../context/BuilderContext';
import { toast } from 'react-hot-toast'; 

export const ForgeButton: React.FC = () => {
    const [userPrompt, setUserPrompt] = useState('Generate a Luxury Watch store for a merchant in Dubai');
    const [isForging, setIsForging] = useState(false);
    
    // Grab injectAST from the BuilderContext
    const builderContext = useBuilder(); 

    const handleForge = async () => {
        if (!userPrompt.trim()) return;
        
        setIsForging(true);
        try {
            const { builderPayload } = await handleForgeGeneration(userPrompt);
            
            // 5. CANVAS SYNC: instantly render the builder payload
            if (builderContext?.injectAST) {
                builderContext.injectAST(builderPayload);
                toast.success("Store forged successfully!");
            } else {
                toast.error("Builder context not found. Cannot inject AST.");
            }
        } catch (err: any) {
            console.error(err);
            if (err.message.includes('malformed')) {
                toast.error("AI layout was malformed. Retrying...");
                // A retry loop could be implemented natively if desired
            } else {
                toast.error(err.message || "Forge failed");
            }
        } finally {
            setIsForging(false);
        }
    };

    return (
        <div className="forge-container" style={{ padding: '16px', background: '#1c1c1c', borderRadius: '8px', border: '1px solid #333' }}>
            <h3 style={{ color: '#fff', marginBottom: '12px', fontSize: '16px', fontWeight: 600 }}>✨ AI Store Forge</h3>
            <textarea 
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                placeholder="Describe your store (e.g., Luxury Watch store in Dubai)"
                style={{ 
                    width: '100%', 
                    padding: '12px', 
                    minHeight: '100px', 
                    borderRadius: '6px',
                    background: '#0a0a0a',
                    color: '#fff',
                    border: '1px solid #333',
                    marginBottom: '12px',
                    resize: 'vertical'
                }}
            />
            <button 
                onClick={handleForge}
                disabled={isForging}
                style={{
                    padding: '10px 16px',
                    background: isForging ? '#555' : '#6366f1',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: isForging ? 'not-allowed' : 'pointer',
                    width: '100%',
                    fontWeight: 500,
                    transition: 'background 0.2s'
                }}
            >
                {isForging ? 'Forging Store...' : 'Generate Store'}
            </button>
            
            {/* Forge Loading Overlay */}
            {isForging && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.85)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999
                }}>
                    <div style={{ 
                        width: '50px', 
                        height: '50px', 
                        border: '4px solid #333',
                        borderTop: '4px solid #6366f1',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        marginBottom: '24px'
                    }} />
                    <div style={{ color: '#fff', fontSize: '24px', fontWeight: 600, animation: 'pulse 2s infinite' }}>
                        Forge Loading... AI is building your store
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
