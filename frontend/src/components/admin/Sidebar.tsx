import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
    LayoutDashboard, 
    ShoppingBag, 
    Box, 
    Users, 
    BarChart3, 
    Settings, 
    Package, 
    ShieldCheck, 
    Zap,
    ExternalLink
} from 'lucide-react';

/**
 * 🛰️ INDUSTRIAL SIDEBAR (Task 9.3)
 * Fixed 240px, High-Contrast, Cold Industrial.
 */
export const Sidebar: React.FC = () => {
    return (
        <aside className="w-[240px] h-screen bg-[#000000] border-r border-[rgba(255,255,255,0.08)] flex flex-col pt-8 pb-6 select-none shrink-0 overflow-hidden">
            {/* 🛡️ Industrial Brand Logo */}
            <div className="px-6 mb-12 flex items-center gap-2">
                <div className="w-6 h-6 bg-white rounded-sm flex items-center justify-center">
                    <div className="w-3 h-3 bg-black rounded-[1px]" />
                </div>
                <span className="text-white font-black tracking-tighter text-lg uppercase">Omnora</span>
            </div>

            {/* 🛰️ Navigation Grid (Strict 12px padding) */}
            <nav className="flex-1 space-y-3 px-3 overflow-y-auto custom-scrollbar">
                <SidebarItem to="/admin/dashboard" icon={<LayoutDashboard strokeWidth={1.5} size={18} />} label="Dashboard" />
                <SidebarItem to="/admin/orders" icon={<ShoppingBag strokeWidth={1.5} size={18} />} label="Orders" />
                <SidebarItem to="/admin/products" icon={<Box strokeWidth={1.5} size={18} />} label="Products" />
                <SidebarItem to="/admin/customers" icon={<Users strokeWidth={1.5} size={18} />} label="Customers" />
                <SidebarItem to="/admin/analytics" icon={<BarChart3 strokeWidth={1.5} size={18} />} label="Analytics" />
                
                <div className="pt-8 pb-4">
                    <span className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Organization</span>
                </div>
                
                <SidebarItem to="/admin/inventory" icon={<Package strokeWidth={1.5} size={18} />} label="Inventory" />
                <SidebarItem to="/admin/settings" icon={<Settings strokeWidth={1.5} size={18} />} label="Settings" />
            </nav>

            {/* ⚙️ Footer Section */}
            <div className="mt-auto px-4 space-y-1">
                <div className="p-4 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between group cursor-pointer hover:bg-white/10 transition-all">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-500 flex items-center justify-center">
                            <Zap size={16} fill="currentColor" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-white leading-none">Pro Plan</span>
                            <span className="text-[9px] text-white/40 leading-none mt-1">SaaS Active</span>
                        </div>
                    </div>
                    <ExternalLink size={12} className="text-white/20 group-hover:text-white transition-colors" />
                </div>
            </div>
        </aside>
    );
};

const SidebarItem = ({ to, icon, label }: any) => (
    <NavLink 
        to={to}
        className={({ isActive }) => `
            flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-medium transition-all group relative
            ${isActive ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}
        `}
    >
        {({ isActive }) => (
            <>
                {/* 🛡️ ACTIVE ACCENT (Task 10.1) */}
                {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-6 bg-white rounded-r-full" />
                )}
                <div className="shrink-0">{icon}</div>
                <span className="tracking-tight">{label}</span>
            </>
        )}
    </NavLink>
);
