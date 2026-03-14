import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { SuperAdminClient, MerchantDetails } from '../../lib/SuperAdminClient';

interface MerchantLedgerProps {
    merchants: MerchantDetails[];
    onMerchantsUpdate: () => void;
}

export const MerchantLedger: React.FC<MerchantLedgerProps> = ({ merchants, onMerchantsUpdate }) => {
    const { showToast } = useToast();
    const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

    const handleToggleStatus = async (merchantId: string, currentStatusActive: boolean) => {
        setLoadingIds(prev => new Set(prev).add(merchantId));
        const suspend = currentStatusActive; // If currently active, we suspend. If inactive, we reactivate.
        try {
            await SuperAdminClient.toggleMerchantStatus(merchantId, suspend);
            showToast(
                `${suspend ? "Store Suspended" : "Store Reactivated"}: The store has been successfully ${suspend ? "suspended" : "reactivated"}.`,
                suspend ? "warning" : "success"
            );
            onMerchantsUpdate(); // Trigger refresh
        } catch (error: any) {
            showToast(
                `Error: ${error.message || "Failed to update store status."}`,
                "error"
            );
        } finally {
            setLoadingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(merchantId);
                return newSet;
            });
        }
    };

    return (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden mt-8 backdrop-blur-sm">
            <div className="px-6 py-4 border-b border-gray-800">
                <h3 className="text-xl font-bold text-white tracking-wide">Platform Merchants</h3>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-300">
                    <thead className="bg-[#050505] text-xs uppercase text-gray-400 border-b border-gray-800 tracking-wider">
                        <tr>
                            <th className="px-6 py-4 font-semibold">Store / Founder</th>
                            <th className="px-6 py-4 font-semibold">Subdomain</th>
                            <th className="px-6 py-4 font-semibold">Plan</th>
                            <th className="px-6 py-4 font-semibold">Status</th>
                            <th className="px-6 py-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50">
                        {merchants.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                    No merchants found.
                                </td>
                            </tr>
                        ) : (
                            merchants.map((m) => (
                                <tr key={m.id} className="hover:bg-gray-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-white">{m.display_name}</div>
                                        <div className="text-gray-500 text-xs mt-0.5">{m.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-indigo-400/80 font-mono text-xs bg-indigo-500/10 px-2 py-1 rounded">
                                            {m.store_slug}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="capitalize text-gray-300 font-medium">
                                            {m.subscription || 'free'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {m.is_active !== false ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_10px_rgba(34,211,238,0.2)]">
                                                Active
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                                                Suspended
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleToggleStatus(m.id, m.is_active !== false)}
                                            disabled={loadingIds.has(m.id)}
                                            className={`
                                                relative inline-flex items-center px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider
                                                transition-all overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed
                                                ${m.is_active !== false 
                                                    ? 'text-red-400 border border-red-900/50 hover:bg-red-950/40 hover:border-red-500 hover:shadow-[0_0_15px_rgba(220,38,38,0.3)]' 
                                                    : 'text-cyan-400 border border-cyan-900/50 hover:bg-cyan-950/40 hover:border-cyan-500 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                                                }
                                            `}
                                        >
                                            {loadingIds.has(m.id) ? '...Processing...' : m.is_active !== false ? 'Suspend Store' : 'Reactivate Store'}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
