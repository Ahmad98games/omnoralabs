import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, X, Wand2, Loader2, CheckCircle2 } from 'lucide-react';
import { localAIEngine } from '../../lib/LocalAIEngine';
import { useBuilder } from '../../context/BuilderContext';
import { useToast } from '../../context/ToastContext';
import { InitProgressReport } from '@mlc-ai/web-llm';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export const AICopilotModal: React.FC<Props> = ({ isOpen, onClose }) => {
    const { nodes, updateNode } = useBuilder();
    const { showToast } = useToast();
    const [brandDescription, setBrandDescription] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedContent, setGeneratedContent] = useState<any>(null);
    const [progress, setProgress] = useState<InitProgressReport | null>(null);

    if (!isOpen) return null;

    const handleGenerate = async () => {
        if (!brandDescription.trim()) {
            showToast('Please enter a brand description.', 'error');
            return;
        }

        setIsGenerating(true);
        setGeneratedContent(null);
        setProgress({ text: 'Initializing WebGPU Core...', progress: 0, timeElapsed: 0 });

        try {
            // Ensure initialized
            await localAIEngine.init((p) => setProgress(p));
            
            setProgress({ text: 'Generating Cinematic Context...', progress: 1, timeElapsed: 0 });
            const content = await localAIEngine.generateContent(brandDescription);
            setGeneratedContent(content);
            showToast('Generation complete!', 'success');
        } catch (err: any) {
            console.error("Copilot Error:", err);
            showToast(err.message || 'AI Generation failed.', 'error');
        } finally {
            setIsGenerating(false);
            setProgress(null);
        }
    };

    const handleApply = () => {
        if (!generatedContent) return;

        // Phase 32: Safe Canvas Injection
        const nodeArray = Object.values(nodes) as any[];
        const heroNode = nodeArray.find(n => n.type === 'HeroBanner');
        const productGrid = nodeArray.find(n => n.type === 'ProductGrid' || n.type === 'Grid'); // Or specific dummy products

        if (!heroNode) {
            showToast('Magic Failed: No HeroBanner found on canvas to inject text.', 'error');
            return;
        }

        try {
            // Safely inject Headline and Subtext using full object replacement 
            // instead of dot-notation strings to satisfy TypeScript BuilderNode interface
            updateNode(heroNode.id, 'props', { 
                ...heroNode.props, 
                headline: generatedContent.heroHeadline,
                subtext: generatedContent.heroSubtext
            });

            // Optional: Inject products if a grid exists (complex mapping depending on grid structure)
            // For now, we notify the user what product ideas were generated so they can use them manually
            // if we don't have a direct mechanism to map an array of objects to a generic grid yet.
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
            
            <div className="relative bg-[#0A0A0A] border border-indigo-500/20 rounded-2xl w-full max-w-2xl shadow-[0_0_50px_rgba(99,102,241,0.1)] overflow-hidden animate-fade-in-up font-sans text-white">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                            <Sparkles size={16} />
                        </div>
                        <h2 className="font-bold tracking-tight text-lg">Omnora AI Copilot</h2>
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
                            placeholder="e.g., A dark cyberpunk streetwear brand selling leather jackets, neon aesthetics..."
                            className="w-full h-24 bg-[#050505] border border-white/10 rounded-xl p-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
                            disabled={isGenerating}
                        />

                        {isGenerating ? (
                            <div className="bg-[#050505] border border-white/5 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-4">
                                <Loader2 size={24} className="text-indigo-400 animate-spin" />
                                <div>
                                    <p className="text-sm font-bold text-white mb-1">Synthesizing Content</p>
                                    <p className="text-xs text-indigo-400 font-mono">{progress?.text || 'Processing neural pathways...'}</p>
                                </div>
                            </div>
                        ) : generatedContent ? (
                            <div className="bg-[#050505] border border-indigo-500/30 rounded-xl p-5 space-y-4 shadow-[inset_0_0_20px_rgba(99,102,241,0.05)]">
                                <div>
                                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Hero Headline</p>
                                    <p className="text-sm font-semibold text-white">{generatedContent.heroHeadline}</p>
                                </div>
                                <div className="h-px bg-white/5 w-full" />
                                <div>
                                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Hero Subtext</p>
                                    <p className="text-sm text-gray-300 leading-relaxed">{generatedContent.heroSubtext}</p>
                                </div>
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
                            onClick={handleGenerate}
                            disabled={isGenerating || !brandDescription.trim()}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                        >
                            <Wand2 size={14} />
                            {isGenerating ? 'Generating...' : 'Generate Magic'}
                        </button>
                    ) : (
                        <button
                            onClick={handleApply}
                            className="bg-white text-black hover:bg-gray-200 px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
                        >
                            <CheckCircle2 size={14} />
                            Apply to Store
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};
