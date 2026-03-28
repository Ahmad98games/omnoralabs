import React from 'react';
import { Sidebar } from './Sidebar';

/**
 * 🛰️ INDUSTRIAL MAIN LAYOUT (Task 9.3)
 * Absolute Black Shell with high-contrast content area.
 */
export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="flex w-screen h-screen bg-[#000000] overflow-hidden">
            {/* Nav: Fixed 240px */}
            <Sidebar />

            {/* Content: Main Admin View */}
            <main className="flex-1 overflow-y-auto bg-[#000000] custom-scrollbar">
                <div className="max-w-7xl mx-auto px-8 py-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {children}
                </div>
            </main>
        </div>
    );
};

/**
 * 📐 INDUSTRIAL CARD (Task 9.3)
 * No shadows, #050505 bg, subtle borders.
 */
export const Card: React.FC<{ title?: string; children: React.ReactNode; className?: string }> = ({ title, children, className = "" }) => (
    <div className={`bg-[#050505] border border-[rgba(255,255,255,0.08)] rounded-lg p-6 flex flex-col gap-4 group transition-all duration-300 hover:border-white/15 ${className}`}>
        {title && (
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-2">
                <h3 className="text-white font-bold text-sm tracking-tight uppercase tracking-widest text-[11px] opacity-60">{title}</h3>
                <div className="w-1 h-1 rounded-full bg-white/20 group-hover:bg-white transition-all" />
            </div>
        )}
        {children}
    </div>
);

/**
 * 🖱️ INDUSTRIAL BUTTON (Task 9.3)
 * High-contrast, 6px radii, sharp typography.
 */
export const Button: React.FC<{ variant?: 'primary' | 'secondary'; children: React.ReactNode; onClick?: () => void; className?: string }> = ({ variant = 'primary', children, onClick, className = "" }) => (
    <button 
        onClick={onClick}
        className={`px-5 py-2.5 rounded-[6px] text-xs font-black uppercase tracking-widest transition-all duration-200 active:scale-[0.98]
            ${variant === 'primary' 
                ? 'bg-white text-black hover:bg-zinc-200' 
                : 'bg-transparent text-white border border-white/10 hover:bg-white/5 hover:border-white/20'}
            ${className}
        `}
    >
        {children}
    </button>
);
