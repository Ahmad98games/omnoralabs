import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Terminal, Database, Cpu, Layout, Layers, ShieldCheck, Rocket } from 'lucide-react';
import client from '../../api/client';
import { useNodes } from '../../context/BuilderContext';
import { useNavigate } from 'react-router-dom';

interface StoreGeneratorProps {
    prompt: string;
    onComplete?: () => void;
    onCancel?: () => void;
}

const STEPS = [
    { text: "Initializing Neural Core...", icon: Cpu, delay: 0 },
    { text: "Analyzing Niche Patterns...", icon: Sparkles, delay: 2000 },
    { text: "Generating Page Semantic Structure...", icon: Layout, delay: 4000 },
    { text: "Provisioning Database Cluster...", icon: Database, delay: 6000 },
    { text: "Injecting Cinematic Styling System...", icon: Layers, delay: 8000 },
    { text: "Synthesizing Node Tree...", icon: Terminal, delay: 10000 },
    { text: "Finalizing Global Design Tokens...", icon: ShieldCheck, delay: 12000 },
    { text: "Deploying Virtual Storefront...", icon: Rocket, delay: 14000 },
];

export const StoreGenerator: React.FC<StoreGeneratorProps> = ({ prompt, onComplete, onCancel }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [status, setStatus] = useState<'processing' | 'completed' | 'failed'>('processing');
    const [jobId, setJobId] = useState<string | null>(null);
    
    // Optional integration with BuilderContext
    let injectAST: any = null;
    try {
        const nodes = useNodes();
        injectAST = nodes.injectAST;
    } catch {
        // Not in builder context, ignore
    }

    const navigate = useNavigate();

    // Start Generation
    useEffect(() => {
        const startGeneration = async () => {
            try {
                const response = await client.post('/api/ai/generate-store', { prompt });
                if (response.data.success) {
                    setJobId(response.data.jobId);
                } else {
                    setStatus('failed');
                }
            } catch (err) {
                console.error('[AI Store] Failed to start generation:', err);
                setStatus('failed');
            }
        };
        startGeneration();
    }, [prompt]);

    // Poll Status
    useEffect(() => {
        if (!jobId || status !== 'processing') return;

        const poll = setInterval(async () => {
            try {
                const response = await client.get(`/api/jobs/${jobId}`);
                if (response.data.status === 'completed') {
                    const ast = response.data.result.ast;
                    clearInterval(poll);
                    
                    // Final "Matrix" flourish before injection
                    setCurrentStep(STEPS.length - 1);
                    setTimeout(() => {
                        if (injectAST) injectAST(ast);
                        setStatus('completed');
                        if (onComplete) onComplete();
                    }, 1500);
                } else if (response.data.status === 'failed') {
                    clearInterval(poll);
                    setStatus('failed');
                }
            } catch (err) {
                console.error('[AI Store] Polling error:', err);
            }
        }, 2000);

        return () => clearInterval(poll);
    }, [jobId, status, injectAST, onComplete]);

    // Fake Step Progression for UI feel
    useEffect(() => {
        if (status !== 'processing') return;
        
        const interval = setInterval(() => {
            setCurrentStep(prev => {
                const next = prev + 1;
                return next < STEPS.length - 1 ? next : prev;
            });
        }, 2500);

        return () => clearInterval(interval);
    }, [status]);

    return (
        <div className="fixed inset-0 z-[9999] bg-[#0A0A0A] flex flex-col items-center justify-center overflow-hidden font-mono">
            {/* Background Ambient Glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#D4AF37]/5 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10" />
            </div>

            <div className="relative z-10 w-full max-w-2xl px-8 flex flex-col items-center">
                {/* Header Section */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] text-[10px] tracking-widest uppercase mb-6">
                        <Sparkles size={12} />
                        Neural Generation Active
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4 italic">
                        OMNORA <span className="text-[#D4AF37]">FORGE</span>
                    </h1>
                    <p className="text-white/40 text-sm max-w-sm mx-auto">
                        Generating high-fidelity storefront based on: <br/>
                        <span className="text-white/60 italic">"{prompt}"</span>
                    </p>
                </motion.div>

                {/* Progress Visualizer */}
                <div className="w-full space-y-4 mb-12">
                    {STEPS.map((step, idx) => (
                        <AnimatePresence key={idx}>
                            {idx <= currentStep && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ 
                                        opacity: idx === currentStep ? 1 : 0.3, 
                                        x: 0,
                                        scale: idx === currentStep ? 1.02 : 1
                                    }}
                                    className={`flex items-center gap-4 py-3 px-4 rounded-lg border transition-colors ${
                                        idx === currentStep 
                                            ? 'bg-white/5 border-white/10 text-white' 
                                            : 'bg-transparent border-transparent text-white/40'
                                    }`}
                                >
                                    <step.icon size={18} className={idx === currentStep ? 'text-[#D4AF37]' : ''} />
                                    <span className="text-sm font-light tracking-wide">{step.text}</span>
                                    {idx === currentStep && (
                                        <motion.div 
                                            animate={{ opacity: [0, 1, 0] }}
                                            transition={{ repeat: Infinity, duration: 1 }}
                                            className="ml-auto w-1.5 h-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.6)]"
                                        />
                                    )}
                                    {idx < currentStep && (
                                        <div className="ml-auto text-[#D4AF37]/60 text-[10px]">OK</div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    ))}
                </div>

                {/* Loading Bar */}
                <div className="w-full h-[1px] bg-white/5 relative overflow-hidden mb-12">
                    <motion.div 
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent w-40"
                        animate={{ left: ['-20%', '120%'] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    />
                </div>

                {/* Action Footer */}
                <div className="flex flex-col items-center gap-6">
                    {status === 'failed' ? (
                        <div className="text-center">
                            <p className="text-red-500 mb-4">Generation failed. Please check your API configuration.</p>
                            <button 
                                onClick={onCancel}
                                className="px-6 py-2 rounded border border-white/10 text-white/60 hover:text-white transition-colors"
                            >
                                ABORT COMMAND
                            </button>
                        </div>
                    ) : (
                        <button 
                            disabled
                            className="text-[10px] tracking-[0.2em] uppercase text-white/20 select-none"
                        >
                            Syncing Neural Weights... {Math.round((currentStep / (STEPS.length - 1)) * 100)}%
                        </button>
                    )}
                </div>
            </div>

            {/* Matrix Rain Effect (Optional Overlay) */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none overflow-hidden text-[#D4AF37] text-[8px] leading-none">
                {Array.from({ length: 20 }).map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ y: -100 }}
                        animate={{ y: 1000 }}
                        transition={{ 
                            repeat: Infinity, 
                            duration: 5 + Math.random() * 10, 
                            ease: "linear",
                            delay: Math.random() * 5
                        }}
                        style={{ left: `${i * 5}%` }}
                        className="absolute top-0 bottom-0 whitespace-pre"
                    >
                        {Array.from({ length: 50 }).map(() => (
                            Math.random() > 0.5 ? '0' : '1'
                        )).join('\n')}
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
