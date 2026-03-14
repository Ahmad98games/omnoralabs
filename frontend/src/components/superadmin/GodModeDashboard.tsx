import React, { useEffect, useState } from 'react';
import { SuperAdminClient, PlatformMetrics, MerchantDetails } from '../../lib/SuperAdminClient';
import { MerchantLedger } from './MerchantLedger';
import { RefreshCw, Activity, DollarSign, Store, ServerCrash } from 'lucide-react';

export const GodModeDashboard: React.FC = () => {
    const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
    const [merchants, setMerchants] = useState<MerchantDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            setError(null);
            const [metricsData, merchantsData] = await Promise.all([
                SuperAdminClient.getPlatformMetrics(),
                SuperAdminClient.getAllMerchants(),
            ]);
            setMetrics(metricsData);
            setMerchants(merchantsData);
        } catch (err: any) {
            console.error("God Mode Fetch Error:", err);
            setError(err.message || 'Failed to load platform data.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="text-cyan-500 flex flex-col items-center">
                    <Activity className="h-10 w-10 mb-4 animate-pulse" />
                    <span className="uppercase tracking-widest text-sm font-bold opacity-80 animate-pulse">Initializing God Mode...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] p-6 lg:p-10 font-sans text-white overflow-y-auto selection:bg-cyan-900 selection:text-cyan-100">
            {/* Header Section */}
            <div className="max-w-7xl mx-auto mb-10 overflow-hidden relative">
                {/* Cyberpunk ambient glow */}
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute top-20 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

                <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-800 pb-6">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-500">
                            GOD MODE
                        </h1>
                        <p className="mt-2 text-sm text-gray-400 uppercase tracking-[0.2em] font-medium flex items-center">
                            <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 mr-2 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></span>
                            Platform Command Center
                        </p>
                    </div>
                    
                    <button 
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="group flex items-center gap-2 px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-300 hover:text-white hover:border-gray-600 transition-all font-medium"
                    >
                        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-cyan-400' : 'group-hover:text-cyan-400 transition-colors'}`} />
                        {refreshing ? 'Syncing...' : 'Manual Sync'}
                    </button>
                </div>

                {error && (
                    <div className="mt-6 bg-red-950/30 border border-red-900/50 rounded-lg p-4 flex items-start gap-3 backdrop-blur-sm">
                        <ServerCrash className="h-5 w-5 text-red-500 mt-0.5" />
                        <div>
                            <h4 className="text-red-400 font-bold text-sm">System Error</h4>
                            <p className="text-red-200/70 text-sm mt-1">{error}</p>
                        </div>
                    </div>
                )}

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 relative z-10">
                    <MetricCard 
                        title="Total Active Stores" 
                        value={metrics?.totalStores.toString() || '0'} 
                        icon={<Store className="h-6 w-6 text-indigo-400" />} 
                        glowColor="rgba(99, 102, 241, 0.15)"
                    />
                    <MetricCard 
                        title="Platform MRR" 
                        value={`$${(metrics?.platformMrr || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                        icon={<Activity className="h-6 w-6 text-cyan-400" />} 
                        glowColor="rgba(34, 211, 238, 0.15)"
                    />
                    <MetricCard 
                        title="Total GMV Processed" 
                        value={`$${(metrics?.totalGmvProcessed || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                        icon={<DollarSign className="h-6 w-6 text-emerald-400" />} 
                        glowColor="rgba(52, 211, 153, 0.15)"
                    />
                </div>

                {/* Ledger Component */}
                <div className="relative z-10">
                    <MerchantLedger merchants={merchants} onMerchantsUpdate={fetchData} />
                </div>
            </div>
        </div>
    );
};

// Subcomponent for Metric Cards
const MetricCard = ({ title, value, icon, glowColor }: { title: string, value: string, icon: React.ReactNode, glowColor: string }) => (
    <div 
        className="bg-gray-900/40 border border-gray-800/80 rounded-xl p-6 backdrop-blur-md relative overflow-hidden group hover:border-gray-700 transition-colors"
        style={{ boxShadow: `0 0 20px -5px ${glowColor}` }}
    >
        <div className="absolute top-4 right-4 opacity-50 group-hover:opacity-100 transition-opacity drop-shadow-lg">
            {icon}
        </div>
        <p className="text-sm font-semibold tracking-wider uppercase text-gray-500 mb-2">{title}</p>
        <h3 className="text-3xl font-black text-white tracking-tight">{value}</h3>
    </div>
);
