import React, { useState, useEffect, useRef } from 'react';
import { localAIEngine, CopilotAction } from '../../lib/LocalAIEngine';
import { Bot, Send, Loader2, X, Sparkles, AlertTriangle } from 'lucide-react';
import { useBuilder } from '../../context/BuilderContext';
import { useToast } from '../../context/ToastContext';
import { executeCopilotCommands } from '../../lib/CommandExecutor';

interface LocalCopilotPanelProps {
    currentState: any; // Lightweight dispatcher subset
    onClose: () => void;
}

export const LocalCopilotPanel: React.FC<LocalCopilotPanelProps> = ({ currentState, onClose }) => {
    const dispatcher = useBuilder();
    const { showToast } = useToast();
    
    const [status, setStatus] = useState<string>('Initializing local WebGPU Copilot...');
    const [progressText, setProgressText] = useState<string>('');
    const [progressValue, setProgressValue] = useState<number>(0);
    const [isReady, setIsReady] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    
    const [input, setInput] = useState('');
    const [chatHistory, setChatHistory] = useState<{role: 'user' | 'assistant', text: string}[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);

    const chatEndRef = useRef<HTMLDivElement>(null);

    // Initialize Local Engine on mount
    useEffect(() => {
        let mounted = true;

        const bootEngine = async () => {
            try {
                await localAIEngine.init((progress) => {
                    if (mounted) {
                        setStatus(`Loading AI Model...`);
                        setProgressText(progress.text);
                        // Progress ranges 0.0 - 1.0 (sometimes slightly over occasionally based on chunks)
                        setProgressValue(Math.min(progress.progress * 100, 100));
                    }
                });
                
                if (mounted) {
                    setIsReady(true);
                    setChatHistory([{ role: 'assistant', text: "I'm the Omnora Design Copilot. Completely local, fully private, running on WebGPU. What are we building today?" }]);
                }
            } catch (err: any) {
                if (mounted) {
                    setErrorMsg(err.message || 'Fatal Error initializing WebLLM Engine.');
                }
            }
        };

        bootEngine();

        return () => {
            mounted = false;
        };
    }, []);

    // Scroll to bottom on updates
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, isGenerating]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !isReady || isGenerating) return;

        const userPrompt = input.trim();
        setInput('');
        setChatHistory(prev => [...prev, { role: 'user', text: userPrompt }]);
        setIsGenerating(true);

        try {
            const actions = await localAIEngine.generateAction(userPrompt, currentState);
            
            if (actions && actions.length > 0) {
                // Pass directly to the execution bridge using selected target node (or null for root fallback)
                executeCopilotCommands(actions, dispatcher, dispatcher.selectedNodeId || null);
                
                showToast("✨ Magic applied!", "success");
                setChatHistory(prev => [...prev, { role: 'assistant', text: `✨ Applied ${actions.length} cinematic actions to the canvas.` }]);
            } else {
                setChatHistory(prev => [...prev, { role: 'assistant', text: `I couldn't identify any constructive actions to take from that prompt.` }]);
            }
        } catch (err: any) {
            setChatHistory(prev => [...prev, { role: 'assistant', text: `⚠️ Error executing request: ${err.message}` }]);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div style={{
            position: 'absolute', top: 20, right: 350, width: 340, height: 600,
            background: 'rgba(20, 20, 28, 0.95)', border: '1px solid rgba(124, 109, 250, 0.3)',
            borderRadius: '16px', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
            display: 'flex', flexDirection: 'column', zIndex: 1000,
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            fontFamily: "'Inter', sans-serif", overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{
                padding: '16px', borderBottom: '1px solid rgba(124, 109, 250, 0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'linear-gradient(90deg, rgba(30,30,42,1) 0%, rgba(20,20,28,1) 100%)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ padding: '6px', background: 'rgba(124, 109, 250, 0.2)', borderRadius: '8px', color: '#7c6dfa' }}>
                        <Sparkles size={16} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#f0f0f5' }}>Omnora Copilot</h3>
                        <p style={{ margin: 0, fontSize: '11px', color: '#8b8ba0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: isReady ? '#34d399' : '#fbbf24' }}/>
                            {isReady ? 'WebGPU Online' : 'Initializing...'}
                        </p>
                    </div>
                </div>
                <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#8b8ba0', cursor: 'pointer', padding: 4 }}>
                    <X size={18} />
                </button>
            </div>

            {/* Error State */}
            {errorMsg && (
                <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                    <AlertTriangle size={32} color="#ff4d6a" style={{ marginBottom: 12 }} />
                    <p style={{ color: '#ff4d6a', fontSize: '13px', lineHeight: 1.5 }}>
                        {errorMsg}
                    </p>
                </div>
            )}

            {/* Loading State */}
            {!isReady && !errorMsg && (
                <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 16 }}>
                    <Loader2 size={24} className="spin" color="#7c6dfa" />
                    <div style={{ width: '100%', textAlign: 'center' }}>
                        <p style={{ fontSize: '13px', color: '#f0f0f5', marginBottom: 8, fontWeight: 500 }}>{status}</p>
                        <div style={{ width: '100%', height: 4, background: '#2a2a3a', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ 
                                height: '100%', width: `${progressValue}%`, 
                                background: 'linear-gradient(90deg, #7c6dfa, #9b8aff)', 
                                transition: 'width 0.3s ease' 
                            }} />
                        </div>
                        <p style={{ fontSize: '11px', color: '#8b8ba0', marginTop: 8, fontFamily: 'monospace' }}>
                            {progressValue.toFixed(0)}% • {progressText.split('[')[0]?.trim() || 'Downloading weights...'}
                        </p>
                        <p style={{ fontSize: '11px', color: '#8b8ba0', marginTop: 16 }}>
                            This uses your local GPU. The model is cached after the first download.
                        </p>
                    </div>
                </div>
            )}

            {/* Chat Area */}
            {isReady && !errorMsg && (
                <>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {chatHistory.map((msg, i) => (
                            <div key={i} style={{
                                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '85%',
                                padding: '10px 14px',
                                borderRadius: msg.role === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0',
                                background: msg.role === 'user' ? 'linear-gradient(135deg, #7c6dfa, #9b8aff)' : '#1a1a24',
                                border: msg.role === 'user' ? 'none' : '1px solid #2a2a3a',
                                color: msg.role === 'user' ? '#fff' : '#f0f0f5',
                                fontSize: '13px',
                                lineHeight: 1.5
                            }}>
                                {msg.text}
                            </div>
                        ))}
                        {isGenerating && (
                            <div style={{ alignSelf: 'flex-start', padding: '10px 14px', borderRadius: '12px 12px 12px 0', background: '#1a1a24', color: '#8b8ba0', fontSize: '13px' }}>
                                <Loader2 size={14} className="spin" style={{ display: 'inline', marginRight: 6 }} /> Thinking...
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input Area */}
                    <div style={{ padding: '12px', borderTop: '1px solid rgba(124, 109, 250, 0.15)', background: '#14141c' }}>
                        <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
                            <input
                                autoFocus
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                disabled={isGenerating}
                                placeholder="E.g., Add a dark watch grid..."
                                style={{
                                    width: '100%', padding: '12px 40px 12px 14px',
                                    borderRadius: '8px', background: '#1a1a24',
                                    border: '1px solid #2a2a3a', color: '#f0f0f5',
                                    fontSize: '13px', outline: 'none',
                                }}
                            />
                            <button 
                                type="submit" 
                                disabled={isGenerating || !input.trim()}
                                style={{
                                    position: 'absolute', right: 6, top: 6, bottom: 6,
                                    width: 30, background: 'transparent', border: 'none',
                                    color: (isGenerating || !input.trim()) ? '#8b8ba0' : '#7c6dfa',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: (isGenerating || !input.trim()) ? 'default' : 'pointer'
                                }}
                            >
                                <Send size={16} />
                            </button>
                        </form>
                    </div>
                </>
            )}
            <style>{`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};
