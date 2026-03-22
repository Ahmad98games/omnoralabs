import React, { useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { Loader2, UploadCloud, CheckCircle } from 'lucide-react';

export const Billing: React.FC = () => {
    const { user, profile } = useAuth(); // Profile holds wallet_days_remaining synced globally
    const { showToast } = useToast();
    
    const [selectedPlan, setSelectedPlan] = useState<'basic' | 'pro'>('basic');
    const [screenshotUrl, setScreenshotUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const walletDays = profile?.wallet_days_remaining || 0;
    const progressColor = walletDays > 10 ? 'bg-green-500' : walletDays > 3 ? 'bg-orange-500' : 'bg-red-500';
    const progressWidth = Math.min((walletDays / 30) * 100, 100);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;
        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            const { error } = await supabase.storage.from('billing_receipts').upload(fileName, file);
            if (error) throw error;
            
            const { data: publicData } = supabase.storage.from('billing_receipts').getPublicUrl(fileName);
            setScreenshotUrl(publicData.publicUrl);
            showToast('Receipt uploaded successfully!', 'success');
        } catch (error: any) {
            showToast(error.message, 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async () => {
        if (!screenshotUrl || !user) {
            showToast('Please upload a screenshot of your transfer.', 'error');
            return;
        }
        setIsSubmitting(true);
        try {
            const amount = selectedPlan === 'pro' ? 2500 : 1000;
            const { error } = await supabase.from('billing_requests').insert({
                merchant_id: user.id,
                amount,
                plan: selectedPlan,
                screenshot_url: screenshotUrl,
                status: 'pending'
            });
            if (error) throw error;
            showToast('Billing request sent to Super-Admin for approval.', 'success');
            setScreenshotUrl('');
        } catch (error: any) {
            showToast(error.message, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold text-white">Billing & Subscriptions</h1>

            {walletDays < 7 && walletDays > 0 && (
                <div className="bg-amber-900/20 border border-amber-800 p-4 rounded-xl flex items-center gap-3 text-amber-400 text-sm shadow-lg">
                    <span className="text-xl">⚠️</span>
                    <div>
                        <strong className="text-white font-semibold">Subscription Warning:</strong> Your store wallet expires in <span className="underline font-bold">{walletDays} days</span>. Please top up to avoid automatic dormancy.
                    </div>
                </div>
            )}
            
            <div className="bg-[#18181b] p-6 rounded-xl border border-gray-800">
                <h2 className="text-lg font-semibold text-gray-200 mb-4">Store Wallet</h2>
                <div className="mb-2 flex justify-between text-sm text-gray-400">
                    <span>Days Remaining</span>
                    <span className={walletDays <= 3 ? 'text-red-400 font-bold' : 'text-gray-300'}>{walletDays} Days</span>
                </div>
                <div className="w-full bg-gray-900 rounded-full h-3">
                    <div className={`h-3 rounded-full ${progressColor} transition-all duration-1000`} style={{ width: `${Math.max(progressWidth, 1)}%` }} />
                </div>
                {walletDays <= 0 && <p className="text-red-500 text-xs mt-3">Your store is currently offline due to expired billing.</p>}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-[#18181b] p-6 rounded-xl border border-gray-800 space-y-6">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-200 mb-2">Select Plan</h2>
                        <div className="flex gap-4">
                            <button onClick={() => setSelectedPlan('basic')} className={`flex-1 p-4 rounded-lg border text-left transition-all ${selectedPlan === 'basic' ? 'border-[#7c6dfa] bg-[#7c6dfa]/10' : 'border-gray-800 hover:border-gray-700'}`}>
                                <h3 className="font-bold text-white">Basic</h3>
                                <p className="text-sm text-gray-400">Rs. 1,000 / mo</p>
                            </button>
                            <button onClick={() => setSelectedPlan('pro')} className={`flex-1 p-4 rounded-lg border text-left transition-all ${selectedPlan === 'pro' ? 'border-[#7c6dfa] bg-[#7c6dfa]/10' : 'border-gray-800 hover:border-gray-700'}`}>
                                <h3 className="font-bold text-white">Pro</h3>
                                <p className="text-sm text-gray-400">Rs. 2,500 / mo</p>
                            </button>
                        </div>
                    </div>

                    <div className="bg-gray-900 p-4 rounded-lg">
                        <h3 className="text-sm font-bold text-gray-300 mb-2">Payment Instructions</h3>
                        <p className="text-xs text-gray-500 mb-3">Send the exact amount via EasyPaisa or JazzCash to the account below, then upload the screenshot.</p>
                        <div className="text-sm text-gray-400">
                            <p><strong>Bank:</strong> Meezan Bank</p>
                            <p><strong>Account Title:</strong> Omnora OS</p>
                            <p><strong>Account Number:</strong> 01234567890123</p>
                            <p><strong>EasyPaisa:</strong> 0300-0000000</p>
                        </div>
                    </div>
                </div>

                <div className="bg-[#18181b] p-6 rounded-xl border border-gray-800 flex flex-col justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-200 mb-4">Upload Receipt</h2>
                        {screenshotUrl ? (
                            <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 p-4 rounded-lg text-green-400">
                                <CheckCircle size={20} />
                                <span className="text-sm font-medium">Receipt Attached Successfully</span>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-800 border-dashed rounded-lg cursor-pointer hover:border-[#7c6dfa] bg-gray-900/50 hover:bg-gray-900 transition-all">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    {isUploading ? <Loader2 className="animate-spin text-gray-500 mb-2" /> : <UploadCloud className="w-8 h-8 text-gray-500 mb-2" />}
                                    <p className="text-sm text-gray-500"><span className="font-semibold">Click to upload</span> screenshot</p>
                                </div>
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={isUploading} />
                            </label>
                        )}
                    </div>
                    
                    <button 
                        onClick={handleSubmit} 
                        disabled={!screenshotUrl || isSubmitting}
                        className="w-full mt-6 py-3 bg-[#7c6dfa] hover:bg-[#6b5ded] text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin mx-auto" /> : 'Submit for Review'}
                    </button>
                </div>
            </div>
        </div>
    );
};
