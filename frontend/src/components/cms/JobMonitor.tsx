import React from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useJobPolling } from '../../hooks/useJobPolling';
import { useBuilder } from '../../context/BuilderContext';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * JobMonitor
 * 
 * Cinematic UI overlay for tracking background tasks in the builder/onboarding.
 * Provides real-time feedback on progress and terminal states.
 */
export const JobMonitor: React.FC = () => {
    const { activeJobId, setActiveJobId, setSaveStatus } = useBuilder();

    const { data: job, isLoading } = useJobPolling(
        activeJobId,
        (result) => {
            setSaveStatus('saved');
            setTimeout(() => {
                setActiveJobId(null);
                setSaveStatus('idle');
            }, 3000);
        },
        (error) => {
            setSaveStatus('error');
            setTimeout(() => {
                setActiveJobId(null);
            }, 5000);
        }
    );

    if (!activeJobId) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                style={{
                    position: 'fixed',
                    bottom: 24,
                    right: 24,
                    background: 'rgba(10, 10, 10, 0.85)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 16,
                    padding: '16px 20px',
                    width: 300,
                    zIndex: 10000,
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    fontFamily: "'Inter', sans-serif"
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {job?.status === 'completed' ? (
                            <CheckCircle2 size={18} color="#10B981" />
                        ) : job?.status === 'failed' || job?.status === 'error' ? (
                            <AlertCircle size={18} color="#EF4444" />
                        ) : (
                            <Loader2 size={18} color="#D4AF37" style={{ animation: 'spin 2s linear infinite' }} />
                        )}
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: '0.02em' }}>
                            {job?.status === 'completed' ? 'Task Complete' : 
                             job?.status === 'failed' ? 'Task Failed' : 
                             'Processing...'}
                        </span>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                        <motion.div 
                            animate={{ width: `${job?.progress || 0}%` }}
                            style={{ height: '100%', background: 'var(--accent-gold, #D4AF37)', boxShadow: '0 0 10px rgba(212,175,55,0.4)' }}
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                        <span>ON-SITE SYNC ENGINE</span>
                        <span>{job?.progress || 0}%</span>
                    </div>
                </div>

                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4, margin: 0 }}>
                    {job?.status === 'completed' ? 'Optimization complete. Your changes are live.' :
                     job?.status === 'failed' ? `System Error: ${job.error}` :
                     'Synchronizing your visual canvas with the Omnora core...'}
                </p>
                
                {/* Spin Keyframes for the monitor specifically */}
                <style dangerouslySetInnerHTML={{ __html: `
                    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                `}} />
            </motion.div>
        </AnimatePresence>
    );
};
