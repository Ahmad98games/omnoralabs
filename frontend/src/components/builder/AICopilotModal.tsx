import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, X, Wand2, Loader2, CheckCircle2 } from 'lucide-react';
import { localAIEngine } from '../../lib/LocalAIEngine';
import { useBuilder } from '../../context/BuilderContext';
import { useToast } from '../../context/ToastContext';
import { InitProgressReport } from '@mlc-ai/web-llm';
import { supabase } from '../../lib/supabaseClient';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export const AICopilotModal: React.FC<Props> = ({ isOpen, onClose }) => {
    const { nodes, updateNode } = useBuilder();
    const { showToast } = useToast();
    const [brandDescription, setBrandDescription] = useState('');
    const [refinement, setRefinement] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedContent, setGeneratedContent] = useState<any>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [progress, setProgress] = useState<InitProgressReport | null>(null);

    if (!isOpen) return null;

    const handleGenerate = async () => {
        if (!brandDescription.trim()) {
            showToast('Please enter a brand description.', 'error');
            return;
        }

        setIsGenerating(true);
        setGeneratedContent(null);
        setErrorMsg(null);
        setProgress({ text: 'Initializing WebGPU Core...', progress: 0, timeElapsed: 0 });

        try {
            // Ensure initialized
            await localAIEngine.init((p) => setProgress(p));
            
            setProgress({ text: 'Generating Cinematic Context...', progress: 1, timeElapsed: 0 });
            const content = await localAIEngine.generateContent(brandDescription, refinement);
            setGeneratedContent(content);
            showToast('Generation complete!', 'success');
        } catch (err: any) {
            console.error("Copilot Error:", err);
            setErrorMsg(err.message || 'AI Generation failed.');
            showToast(err.message || 'AI Generation failed.', 'error');
        } finally {
            setIsGenerating(false);
            setProgress(null);
        }
    };

    const handleApply = async () => {
        if (!generatedContent) return;

        // Phase 32: Safe Canvas Injection
        const nodeArray = Object.values(nodes) as any[];
        const heroNode = nodeArray.find(n => n.type === 'HeroBanner');
        const productGrid = nodeArray.find(n => n.type === 'ProductGrid' || n.type === 'Grid'); 

        if (!heroNode) {
            showToast('Magic Failed: No HeroBanner found on canvas to inject text.', 'error');
            return;
        }

        try {
            updateNode(heroNode.id, 'props', { 
                ...heroNode.props, 
                headline: generatedContent.heroHeadline,
                subtext: generatedContent.heroSubtext
            });

            // Save to Metadata (Persistence) 💾
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('merchants').update({
                    metadata: { 
                        custom_soul: brandDescription,
                        updated_at: new Date().toISOString()
                    }
                }).eq('id', user.id);
            }

            if (!productGrid) {
                 showToast('Hero Banner updated! (Add a ProductGrid to inject product ideas).', 'success');
            } else {
                 showToast('Hero Banner updated successfully.', 'success');
            }
            
            onClose();
        } catch (err) {
            console.error("Injection error:", err);
            showToast('Failed to apply content to canvas.', 'error');
        }
    };

    const modalContent = (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#050505]/80 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative bg-[#030303] border border-[#C9A063]/30 rounded-lg w-full max-w-2xl shadow-[0_0_50px_rgba(201,160,99,0.05)] overflow-hidden animate-fade-in-up font-mono text-white">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#C9A063]/10 flex items-center justify-center text-[#C9A063]">
                            <Sparkles size={16} />
                        </div>
                        <h2 className="font-bold tracking-tight text-lg">[FORGE] OMNORA_AI_COPILOT_V1_STABLE</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors">
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                        Describe your brand aesthetic and let our WebGPU engine generate high-converting, cinematic copy directly onto your canvas.
                    </p>

                    <div className="space-y-4">
                        <textarea
                            value={brandDescription}
                            onChange={(e) => setBrandDescription(e.target.value)}
                            placeholder="> Describe brand vision (e.g., A dark cyberpunk streetwear brand selling leather jackets)..."
                            className="w-full h-24 bg-[#010101] border border-[#C9A063]/20 rounded-lg p-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#C9A063] focus:ring-1 focus:ring-[#C9A063] transition-all resize-none"
                            disabled={isGenerating}
                        />

                        {isGenerating ? (
                            <div className="bg-[#010101] border border-[#C9A063]/20 rounded-lg p-6 flex flex-col items-center justify-center text-center space-y-4">
                                <Loader2 size={24} className="text-[#C9A063] animate-spin" />
                                <div>
                                    <p className="text-sm font-bold text-white mb-1">[SYSTEM]: Synthesizing Content...</p>
                                    <p className="text-xs text-[#C9A063] font-mono">> {progress?.text || 'Processing neural pathways...'}</p>
                                </div>
                            </div>
                        ) : generatedContent ? (
                            <>
                                <div className="bg-[#010101] border border-[#C9A063]/30 rounded-lg p-5 space-y-4 shadow-[inset_0_0_20px_rgba(201,160,99,0.03)]">
                                    <div>
                                        <p className="text-xs font-bold text-[#C9A063] uppercase tracking-wider mb-1">> Hero Headline</p>
                                        <p className="text-sm font-semibold text-white">{generatedContent.heroHeadline}</p>
                                    </div>
                                    <div className="h-px bg-white/5 w-full" />
                                    <div>
                                        <p className="text-xs font-bold text-[#C9A063] uppercase tracking-wider mb-1">> Hero Subtext</p>
                                        <p className="text-sm text-gray-300 leading-relaxed">{generatedContent.heroSubtext}</p>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">> Refine Output (The Prompt Bypass)</label>
                                    <input
                                        type="text"
                                        value={refinement}
                                        onChange={(e) => setRefinement(e.target.value)}
                                        placeholder="> Apply adjustments (e.g., More sarcastic / elegant)..."
                                        className="w-full bg-[#010101] border border-[#C9A063]/20 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#C9A063]"
                                    />
                                </div>
                            </>
                        ) : errorMsg ? (
                            <div className="bg-[#050000] border border-red-500/30 rounded-lg p-5 space-y-2">
                                <p className="text-xs font-bold text-red-400 uppercase tracking-wider">[SYSTEM ERROR]</p>
                                <p className="text-sm text-red-100 font-mono">> {errorMsg}</p>
                            </div>
                        ) : null}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-white/5 bg-white/[0.01] flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    
                    {!generatedContent ? (
                        <button
                            onClick={() => handleGenerate()}
                            disabled={isGenerating || !brandDescription.trim()}
                            className="bg-transparent border border-[#C9A063] text-[#C9A063] hover:bg-[#C9A063]/10 px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                        >
                            <Wand2 size={14} />
                            {isGenerating ? 'GENERATE.ACTION' : 'GENERATE.ACTION'}
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleGenerate()}
                                disabled={isGenerating || !refinement.trim()}
                                className="border border-[#C9A063]/30 text-[#C9A063] hover:bg-[#C9A063]/10 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                            >
                                <Wand2 size={14} />
                                REGENERATE.ACTION
                            </button>
                            <button
                                onClick={handleApply}
                                className="bg-[#C9A063] text-black hover:bg-[#B18952] px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
                            >
                                <CheckCircle2 size={14} />
                                APPLY_TO_STORE
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};
