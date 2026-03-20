import React, { useEffect, useRef } from 'react';
import { useBuilder } from '../../../context/BuilderContext';

export interface AdSenseSlotProps {
    client_id?: string;
    slot_id: string;
    format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical';
    responsive?: boolean;
    style?: React.CSSProperties;
    nodeId?: string;
}

export const AdSenseSlot: React.FC<AdSenseSlotProps> = ({
    client_id,
    slot_id,
    format = 'auto',
    responsive = true,
    style = {},
}) => {
    const isBuilderEnv = !!useBuilder;
    const isBuilderActive = useBuilder?.()?.mode === 'edit';
    const finalClientId = client_id || 'ca-pub-XXXXXXXXXXXXXXXX'; 

    const initialized = useRef(false);

    useEffect(() => {
        // Do not inject scripts in builder mode to prevent interference
        if (isBuilderActive || initialized.current) return;
        
        try {
            const win = window as any;
            (win.adsbygoogle = win.adsbygoogle || []).push({});
            initialized.current = true;
        } catch (e) {
            console.error('AdSense initialization error:', e);
        }
    }, [isBuilderActive]);

    if (isBuilderActive) {
        return (
            <div 
                style={{
                    backgroundColor: '#1E1E24',
                    border: '1px dashed #6366F1',
                    borderRadius: '8px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '120px',
                    width: '100%',
                    color: '#9CA3AF',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    ...style
                }}
            >
                <div style={{ color: '#6366F1', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>
                    [ Google AdSense Slot ]
                </div>
                <div>Slot ID: {slot_id || 'Not Set'}</div>
                <div>Client ID: {client_id ? 'Configured' : 'Using Global Store Config'}</div>
                <div>Format: {format}</div>
            </div>
        );
    }

    return (
        <div style={{ overflow: 'hidden', ...style }}>
            <ins 
                className="adsbygoogle"
                style={{ display: 'block', width: '100%' }}
                data-ad-client={finalClientId}
                data-ad-slot={slot_id}
                data-ad-format={format}
                data-full-width-responsive={responsive ? 'true' : 'false'}
            />
        </div>
    );
};

export default AdSenseSlot;
