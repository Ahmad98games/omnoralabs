import React, { useState, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useBuilderStore } from '../../stores/useBuilderStore';
import { ConversionScore } from './ConversionScore';
import { Layers, Box, Settings, Sliders, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * 🛰️ SMART SIDEBAR (Task 3.2)
 * Zero local state (except active tab). Controls via Zustand.
 */
export const SmartSidebar: React.FC = () => {
    const [leftTab, setLeftTab] = useState<'elements' | 'layers'>('elements');
    const [rightTab, setRightTab] = useState<'props' | 'settings'>('props');
    const [collapsed, setCollapsed] = useState(false);

    const { selectedNodeId, activePage } = useBuilderStore(
        useShallow(s => ({
            selectedNodeId: s.selectedNodeId,
            activePage: s.pages[s.activePageId]
        }))
    );

    if (collapsed) return (
        <button 
            onClick={() => setCollapsed(false)}
            className="fixed right-0 top-1/2 -translate-y-1/2 w-8 h-20 bg-zinc-900 border border-zinc-800 rounded-l-xl flex items-center justify-center hover:bg-zinc-800 text-zinc-500 transition-all z-[200]"
        >
            <ChevronLeft size={16} />
        </button>
    );

    return (
        <div className="flex h-screen bg-[#000000] border-l border-white/10 overflow-hidden select-none">
            {/* Left Panel: Elements / Layers */}
            <div className="w-64 border-r border-white/10 flex flex-col bg-[#050505]">
                <div className="flex border-b border-white/10 p-1">
                    <TabButton 
                        active={leftTab === 'elements'} 
                        onClick={() => setLeftTab('elements')} 
                        icon={<Box size={16} />} 
                        label="Elements" 
                    />
                    <TabButton 
                        active={leftTab === 'layers'} 
                        onClick={() => setLeftTab('layers')} 
                        icon={<Layers size={16} />} 
                        label="Layers" 
                    />
                </div>
                
                <div className="flex-1 overflow-y-auto p-4">
                    {/* Elements Tab Logic placeholder */}
                    <div className="space-y-4">
                         <div className="text-[10px] font-black tracking-widest uppercase text-white/20 mb-4">Core Blocks</div>
                         {/* Blocks would go here */}
                    </div>
                </div>
            </div>

            {/* Right Panel: Properties / Settings */}
            <div className="w-80 flex flex-col relative bg-[#050505]">
                <div className="flex border-b border-white/10 p-1">
                    <TabButton 
                        active={rightTab === 'props'} 
                        onClick={() => setRightTab('props')} 
                        icon={<Sliders size={16} />} 
                        label="Properties" 
                    />
                    <TabButton 
                        active={rightTab === 'settings'} 
                        onClick={() => setRightTab('settings')} 
                        icon={<Settings size={16} />} 
                        label="Settings" 
                    />
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {/* Property Editor Logic */}
                    {selectedNodeId ? (
                        <div className="space-y-8">
                             <div className="pb-6 border-b border-white/5">
                                 <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Component ID</h4>
                                 <code className="text-[10px] font-mono text-white/60">{selectedNodeId}</code>
                             </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-white/5">
                             <Box size={32} className="text-white/10 mb-4" />
                             <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Select a node to inspect payload</p>
                        </div>
                    )}
                </div>

                {/* Automation & Audit Widget */}
                <div className="p-6 border-t border-white/10 bg-black/40 backdrop-blur-md">
                    <ConversionScore />
                </div>
            </div>
            
            <button 
                onClick={() => setCollapsed(true)}
                className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-12 bg-black border border-white/10 rounded-l-md flex items-center justify-center hover:bg-white/5 text-white/20 transition-all opacity-0 group-hover:opacity-100"
            >
                <ChevronRight size={12} />
            </button>
        </div>
    );
};

const TabButton = ({ active, onClick, icon, label }: any) => (
    <button 
        onClick={onClick}
        className={`flex-1 flex items-center justify-center gap-2 py-4 text-[10px] font-black tracking-widest uppercase transition-all relative
            ${active ? 'text-white' : 'text-white/30 hover:text-white hover:bg-white/5'}
        `}
    >
        {icon}
        {label}
        {active && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
        )}
    </button>
);
