import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, ArrowRight, X } from 'lucide-react';

export const OmnoraNotification: React.FC = () => {
    const { setAuthModalOpen } = useAuth();
    const [isVisible, setIsVisible] = React.useState(true);

    if (!isVisible) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            background: 'rgba(10, 10, 10, 0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '100px',
            boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5), 0 0 20px rgba(99, 102, 241, 0.15)',
            color: '#fff',
            fontFamily: "'Inter', sans-serif",
            animation: 'slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}>
            <style>{`
                @keyframes slideUpFade {
                    from { transform: translateY(20px) scale(0.95); opacity: 0; }
                    to { transform: translateY(0) scale(1); opacity: 1; }
                }
                .omnora-notif-btn {
                    display: flex;
                    alignItems: center;
                    gap: 6px;
                    background: transparent;
                    border: none;
                    color: inherit;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 500;
                    padding: 0;
                    transition: opacity 0.2s;
                }
                .omnora-notif-btn:hover {
                    opacity: 0.8;
                }
                .omnora-notif-close {
                    display: flex;
                    alignItems: center;
                    justify-content: center;
                    background: rgba(255,255,255,0.1);
                    border: none;
                    border-radius: 50%;
                    width: 20px;
                    height: 20px;
                    color: #9CA3AF;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .omnora-notif-close:hover {
                    background: rgba(255,255,255,0.2);
                    color: #fff;
                }
            `}</style>
            
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: 'rgba(99, 102, 241, 0.1)',
                color: '#818CF8',
                borderRadius: '50%',
                width: '24px',
                height: '24px'
            }}>
                <Sparkles size={12} />
            </div>

            <button 
                className="omnora-notif-btn" 
                onClick={() => setAuthModalOpen(true)}
            >
                Recommended: Build your own cinematic store with Omnora OS
                <ArrowRight size={14} style={{ marginLeft: 4, color: '#818CF8' }} />
            </button>

            <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />

            <button 
                className="omnora-notif-close"
                onClick={() => setIsVisible(false)}
                aria-label="Dismiss"
            >
                <X size={12} />
            </button>
        </div>
    );
};
