import React from 'react';
import { useUI } from '../../../context/BuilderContext';
import { Link2, Check, Globe, XCircle } from 'lucide-react';

interface LinkPickerEditorProps {
    value: {
        type: 'INTERNAL' | 'EXTERNAL' | 'SCROLL' | 'NONE';
        target: string;
    } | string | undefined; // Support legacy string or new object
    onChange: (value: any) => void;
    label?: string;
}

export const LinkPickerEditor: React.FC<LinkPickerEditorProps> = ({ value, onChange, label }) => {
    const { pages } = useUI();
    
    // Normalize value
    const activeLink = typeof value === 'string' 
        ? { type: value.startsWith('http') ? 'EXTERNAL' : 'INTERNAL', target: value }
        : value || { type: 'NONE', target: '' };

    const systemPages = pages.allIds.filter(id => pages.byId[id].type === 'system');
    const templatePages = pages.allIds.filter(id => pages.byId[id].type === 'template');
    const customPages = pages.allIds.filter(id => pages.byId[id].type === 'custom');

    const handleSelectPage = (pageId: string) => {
        const page = pages.byId[pageId];
        onChange({
            type: 'INTERNAL',
            target: page.slug
        });
    };

    return (
        <div className="space-y-3 py-2 border-t border-[var(--border-primary)] first:border-0 first:pt-0">
            {label && (
                <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-1 block">
                    {label}
                </label>
            )}
            
            <div className="flex flex-col gap-2">
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-black/40 rounded-xl border border-[var(--border-primary)]">
                    {(['NONE', 'INTERNAL', 'EXTERNAL'] as const).map((type) => (
                        <button
                            key={type}
                            onClick={() => onChange({ ...activeLink, type })}
                            className={`px-2 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                                activeLink.type === type 
                                ? 'bg-[var(--accent-gold)] text-black shadow-[0_0_15px_rgba(var(--accent-gold-rgb),0.2)]' 
                                : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {activeLink.type === 'INTERNAL' && (
                <div className="space-y-2 mt-2">
                    <div className="max-h-[180px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {[
                            { label: 'System Pages', ids: systemPages },
                            { label: 'Templates', ids: templatePages },
                            { label: 'Custom Pages', ids: customPages }
                        ].map(group => group.ids.length > 0 && (
                            <div key={group.label} className="space-y-1">
                                <p className="text-[8px] font-black text-[var(--text-secondary)]/40 uppercase tracking-[0.2em] px-1 mb-1">{group.label}</p>
                                {group.ids.map(id => {
                                    const page = pages.byId[id];
                                    const isActive = activeLink.target === page.slug;
                                    return (
                                        <button
                                            key={id}
                                            onClick={() => handleSelectPage(id)}
                                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-all group ${
                                                isActive 
                                                ? 'bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] border border-[var(--accent-gold)]/20' 
                                                : 'bg-white/2 hover:bg-white/5 text-white/70 border border-white/5'
                                            }`}
                                        >
                                            <div className="flex flex-col items-start transition-transform duration-300 group-hover:translate-x-0.5">
                                                <span className="text-[11px] font-bold">{page.title}</span>
                                                <span className="text-[9px] opacity-40 font-mono italic">{page.slug}</span>
                                            </div>
                                            {isActive && <Check size={12} className="animate-in fade-in zoom-in" />}
                                        </button>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeLink.type === 'EXTERNAL' && (
                <div className="space-y-2 mt-2">
                    <div className="relative group">
                        <Globe size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[var(--accent-gold)] transition-colors" />
                        <input
                            type="url"
                            value={activeLink.target}
                            onChange={(e) => onChange({ ...activeLink, target: e.target.value })}
                            className="w-full bg-black/40 border border-[var(--border-primary)] rounded-xl pl-8 pr-3 py-2 text-[11px] text-white focus:outline-none focus:border-[var(--accent-gold)] focus:ring-1 focus:ring-[var(--accent-gold)]/30 transition-all font-mono placeholder:text-white/20"
                            placeholder="https://..."
                        />
                    </div>
                </div>
            )}

            {activeLink.type === 'NONE' && (
                <div className="flex items-center gap-2 px-3 py-2 bg-white/2 border border-dashed border-white/10 rounded-xl justify-center">
                    <XCircle size={12} className="text-white/20" />
                    <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">No Interaction</span>
                </div>
            )}
        </div>
    );
};
