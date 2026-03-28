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
        <div className="flex h-screen bg-zinc-950 border-l border-zinc-900 overflow-hidden select-none">
            {/* Left Panel: Elements / Layers */}
            <div className="w-64 border-r border-zinc-900 flex flex-col">
                <div className="flex border-b border-zinc-900 p-1">
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
                
                <div className="flex-1 overflow-y-auto">
                    {/* Elements Tab Logic */}
                    {/* Layers Tab Logic */}
                </div>
            </div>

            {/* Right Panel: Properties / Settings */}
            <div className="w-80 flex flex-col relative">
                <div className="flex border-b border-zinc-900 p-1">
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

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {/* Property Editor Logic */}
                </div>

                {/* Automation & Audit Widget */}
                <div className="p-4 border-t border-zinc-900 bg-zinc-950/80 backdrop-blur-md">
                    <ConversionScore />
                </div>
            </div>
            
            <button 
                onClick={() => setCollapsed(true)}
                className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-12 bg-zinc-900 border border-zinc-800 rounded-l-md flex items-center justify-center hover:bg-zinc-800 text-zinc-500 transition-all opacity-0 group-hover:opacity-100"
            >
                <ChevronRight size={12} />
            </button>
        </div>
    );
};

const TabButton = ({ active, onClick, icon, label }: any) => (
    <button 
        onClick={onClick}
        className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold transition-all relative
            ${active ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}
        `}
    >
        {icon}
        {label}
        {active && (
            <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-orange-500 rounded-full" />
        )}
    </button>
);
