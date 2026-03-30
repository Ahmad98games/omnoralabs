import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { SuperAdminPaymentController } from './SuperAdminPaymentController';

interface BillingRequest {
    id: string;
    merchant_id: string;
    merchants: { store_name: string; email: string };
    plan: string;
    amount: number;
    screenshot_url: string;
    status: string;
}

export const Payments: React.FC = () => {
    const [requests, setRequests] = useState<BillingRequest[]>([]);

    const fetchRequests = async () => {
        const { data } = await supabase
            .from('billing_requests')
            .select('*, merchants(store_name, email)')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });
        if (data) setRequests(data as BillingRequest[]);
    };

    useEffect(() => {
        const load = async () => {
            await fetchRequests();
        };
        load();
    }, []);

    const handleApprove = async (id: string, merchantId: string, plan: string) => {
        await SuperAdminPaymentController.approveRequest(id, merchantId, plan, 30);
        fetchRequests();
    };

    const handleReject = async (id: string) => {
        const note = prompt("Enter rejection reason:");
        if (note !== null) {
            await SuperAdminPaymentController.rejectRequest(id, note);
            fetchRequests();
        }
    };

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-white mb-6">Pending Billing Requests</h1>
            <div className="bg-[#18181b] rounded-xl border border-gray-800 overflow-hidden">
                <table className="w-full text-left text-sm text-gray-400">
                    <thead className="text-xs uppercase bg-gray-900 text-gray-500">
                        <tr>
                            <th className="px-6 py-3">Store</th>
                            <th className="px-6 py-3">Plan / Amount</th>
                            <th className="px-6 py-3">Receipt</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.map(req => (
                            <tr key={req.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                                <td className="px-6 py-4 font-medium text-gray-200">
                                    {req.merchants?.store_name || 'Unknown Store'} <br/> <span className="text-xs text-gray-500 font-mono">{req.merchant_id}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="uppercase text-indigo-400 text-xs font-bold mr-2">{req.plan}</span>
                                    Rs. {req.amount}
                                </td>
                                <td className="px-6 py-4">
                                    <a href={req.screenshot_url} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-400 underline transition-colors">View Screenshot</a>
                                </td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    <button onClick={() => handleApprove(req.id, req.merchant_id, req.plan)} className="text-xs font-bold bg-green-500/10 text-green-500 px-3 py-1.5 rounded hover:bg-green-500/20 transition-colors uppercase tracking-wider">Approve (+30d)</button>
                                    <button onClick={() => handleReject(req.id)} className="text-xs font-bold bg-red-500/10 text-red-500 px-3 py-1.5 rounded hover:bg-red-500/20 transition-colors uppercase tracking-wider">Reject</button>
                                </td>
                            </tr>
                        ))}
                        {requests.length === 0 && <tr><td colSpan={4} className="text-center py-12 text-gray-500 font-medium tracking-wide">NO PENDING PAYMENTS</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
