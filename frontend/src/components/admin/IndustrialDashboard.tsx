import React from 'react';
import { Card, Button } from './Layout';
import { 
    Activity, 
    TrendingUp, 
    Package, 
    Users, 
    ArrowUpRight, 
    MoreHorizontal,
    Search,
    Filter
} from 'lucide-react';

/**
 * 🏥 INDUSTRIAL DASHBOARD MOCK (Task 9.3)
 * High-end instrument aesthetic. Clean, fast, and dead-serious.
 */
export const IndustrialDashboard: React.FC = () => {
    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* 1. Header & Stats Grid */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Operations</h1>
                    <p className="text-zinc-500 text-sm mt-1">Real-time system status and commerce throughput.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary">Export CSV</Button>
                    <Button variant="primary">New Order</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard label="Total Revenue" value="$142,502.20" trend="+12.4%" icon={<Activity size={16} />} />
                <StatCard label="Active Sessions" value="5,021" trend="+8.1%" icon={<Users size={16} />} />
                <StatCard label="Orders (24h)" value="1,102" trend="-2.4%" icon={<Package size={16} />} />
                <StatCard label="Conversion Rate" value="3.41%" trend="+0.5%" icon={<TrendingUp size={16} />} />
            </div>

            {/* 2. Main Order Table (Shopify-style Clean) */}
            <Card title="Live Throughput">
                <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
                        <input 
                        type="text" 
                        placeholder="Search orders, customers, or SKUs..."
                        className="om-input w-full pl-10 pr-4 py-2 font-mono text-xs"
                    />
                </div>
                    <Button variant="secondary" className="px-3"><Filter size={14} /></Button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="text-left py-4 px-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 uppercase">OrderID</th>
                                <th className="text-left py-4 px-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 uppercase">Customer</th>
                                <th className="text-left py-4 px-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 uppercase">Items</th>
                                <th className="text-left py-4 px-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 uppercase">Amount</th>
                                <th className="text-left py-4 px-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 uppercase">Status</th>
                                <th className="text-right py-4 px-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 uppercase">Detail</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {[1,2,3,4,5].map(i => (
                                <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="py-4 px-4 text-xs font-mono text-white/50 tabular-nums">#OM-{(1000 + i)}</td>
                                    <td className="py-4 px-4 text-xs font-bold text-white tracking-tight">Alexander {i}</td>
                                    <td className="py-4 px-4 text-xs text-zinc-500 tabular-nums">{i} Products</td>
                                    <td className="py-4 px-4 text-xs font-black text-white tabular-nums">$450.00</td>
                                    <td className="py-4 px-4">
                                        <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[9px] font-black uppercase tracking-tight">Processed</span>
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        <button className="p-1 text-zinc-700 hover:text-white transition-colors opacity-0 group-hover:opacity-100"><MoreHorizontal size={14} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                <div className="flex justify-between items-center pt-6 border-t border-white/5 mt-4">
                    <span className="text-[10px] text-zinc-600 uppercase font-black">Displaying 1-20 of 5,021 events</span>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 bg-white/5 border border-white/5 rounded text-[10px] font-black text-white hover:bg-white/10 transition-all">Prev</button>
                        <button className="px-3 py-1 bg-white/5 border border-white/5 rounded text-[10px] font-black text-white hover:bg-white/10 transition-all">Next</button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

const StatCard = ({ label, value, trend, icon }: any) => (
    <Card className="p-5 flex flex-col gap-1 group">
        <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{label}</span>
            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-zinc-500 group-hover:text-white transition-all transform group-hover:rotate-6">
                {icon}
            </div>
        </div>
        <div className="text-xl font-black text-white tracking-tight mt-1 tabular-nums">{value}</div>
        <div className="flex items-center gap-1.5 mt-2">
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded tabular-nums ${trend.startsWith('+') ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                {trend}
            </span>
            <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-tight">vs prev interval</span>
        </div>
    </Card>
);
