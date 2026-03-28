import React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useBuilderStore } from '../../stores/useBuilderStore';
import { Palette, Type, Layout, Hexagon, ChevronRight } from 'lucide-react';

/**
 * 🎨 THEME PANEL (Task 3.3)
 * Full control over the Omnora Design System.
 */
export const ThemePanel: React.FC = () => {
    const theme = useBuilderStore(s => s.themeSettings);
    const updateTheme = useBuilderStore(s => s.updateThemeSettings);

    const handleColorChange = (key: string, value: string) => {
        updateTheme({ colors: { ...theme.colors, [key]: value } });
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* 1. Colors Section */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 text-zinc-500 uppercase tracking-widest text-[10px] font-black">
                    <Palette size={14} /> Brand Colors
                </div>
                <div className="grid grid-cols-5 gap-2">
                    {Object.entries(theme.colors).map(([key, val]) => (
                        <div key={key} className="flex flex-col items-center gap-1">
                            <input 
                                type="color" 
                                value={val} 
                                onChange={(e) => handleColorChange(key, e.target.value)}
                                className="w-10 h-10 rounded-lg cursor-pointer border border-zinc-800 bg-transparent overflow-hidden"
                            />
                            <span className="text-[8px] text-zinc-500 uppercase">{key}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* 2. Typography Section */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 text-zinc-500 uppercase tracking-widest text-[10px] font-black">
                    <Type size={14} /> Typography
                </div>
                
                <div className="space-y-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-zinc-400">Heading Font</label>
                        <select 
                            value={theme.typography.headingFont}
                            onChange={(e) => updateTheme({ typography: { ...theme.typography, headingFont: e.target.value } })}
                            className="bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white outline-none focus:ring-1 ring-orange-500"
                        >
                            <option>Outfit</option>
                            <option>Inter</option>
                            <option>Playfair Display</option>
                            <option>Syne</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[10px] text-zinc-500 uppercase font-bold">
                            <span>Base Size</span>
                            <span>{theme.typography.baseSize}px</span>
                        </div>
                        <input 
                            type="range" min="12" max="24" step="1"
                            value={theme.typography.baseSize}
                            onChange={(e) => updateTheme({ typography: { ...theme.typography, baseSize: parseInt(e.target.value) } })}
                            className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                        />
                    </div>
                </div>
            </section>

            {/* 3. Layout Radii Section */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 text-zinc-500 uppercase tracking-widest text-[10px] font-black">
                    <Layout size={14} /> Shape & Layout
                </div>
                
                <div className="space-y-4">
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[10px] text-zinc-500 uppercase font-bold">
                            <span>Corner Radius</span>
                            <span>{theme.layout.borderRadius}px</span>
                        </div>
                        <input 
                            type="range" min="0" max="32" step="2"
                            value={theme.layout.borderRadius}
                            onChange={(e) => updateTheme({ layout: { ...theme.layout, borderRadius: parseInt(e.target.value) } })}
                            className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[10px] text-zinc-500 uppercase font-bold">
                            <span>Button Shape</span>
                            <span>{theme.layout.buttonRadius}px</span>
                        </div>
                        <input 
                            type="range" min="0" max="40" step="4"
                            value={theme.layout.buttonRadius}
                            onChange={(e) => updateTheme({ layout: { ...theme.layout, buttonRadius: parseInt(e.target.value) } })}
                            className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                        />
                    </div>
                </div>
            </section>

            {/* 4. Actions */}
            <div className="pt-4 flex gap-2">
                <button className="flex-1 bg-orange-500 hover:bg-orange-600 text-black text-xs font-black py-3 rounded-xl shadow-lg shadow-orange-500/10 transition-all flex items-center justify-center gap-2">
                    Save Changes
                </button>
                <button className="w-12 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center text-zinc-500 hover:text-white transition-all">
                    ...
                </button>
            </div>
        </div>
    );
};
