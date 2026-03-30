import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

export interface PaymentMethod {
    id: string;
    name: string;
    accountTitle: string;
    accountNumber: string;
    instruction: string;
    showWhatsAppScreenshot: boolean;
}

interface PaymentMethodBuilderProps {
    merchantId: string;
    onSaveSuccess?: () => void;
}

/**
 * PaymentMethodBuilder: Adds custom dynamic payment handlers
 * * Supports dynamic lists, screenshot toggles, and attaches anchored ID
 * nodes for Onboarding highlight overlays flawlessly.
 */
export const PaymentMethodBuilder: React.FC<PaymentMethodBuilderProps> = ({
    merchantId,
    onSaveSuccess
}) => {
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
        const fetchMethods = async () => {
            const { data, error } = await supabase
                .from('merchants')
                .select('payment_methods')
                .eq('id', merchantId)
                .single();

            if (!error && data?.payment_methods) {
                setMethods(data.payment_methods as PaymentMethod[]);
            }
        };

        if (merchantId) fetchMethods();
    }, [merchantId]);

    const handleAddMethod = () => {
        const newMethod: PaymentMethod = {
            id: `method_${Date.now()}`,
            name: '',
            accountTitle: '',
            accountNumber: '',
            instruction: '',
            showWhatsAppScreenshot: false
        };
        setMethods([...methods, newMethod]);
    };

    // OSTT FIX: Strongly typed key and value pairing to avoid `any`
    const handleUpdateMethod = <K extends keyof PaymentMethod>(id: string, key: K, value: PaymentMethod[K]) => {
        setMethods(methods.map(m => m.id === id ? { ...m, [key]: value } : m));
    };

    const handleRemoveMethod = (id: string) => {
        setMethods(methods.filter(m => m.id !== id));
    };

    const handleSave = async () => {
        setLoading(true);
        const { error } = await supabase
            .from('merchants')
            .update({ payment_methods: methods })
            .eq('id', merchantId);

        setLoading(false);
        if (!error) {
            alert('✅ Payment Methods Saved Successfully!');
            onSaveSuccess?.();
        } else {
            alert('❌ Failed to save methods.');
        }
    };

    return (
        <div id="tab-payment" style={{ padding: 20, background: '#13131a', borderRadius: 8, border: '1px solid #2a2a3a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 600 }}>Payment Methods</h2>
                <button 
                    type="button"
                    onClick={handleAddMethod}
                    style={{ background: '#6366f1', color: '#fff', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', border: 'none', fontSize: '12px' }}
                >
                    + Add New Method
                </button>
            </div>

            <AnimatePresence>
                {methods.map((method, index) => (
                    <motion.div 
                        key={method.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        style={{ background: '#1a1a24', padding: 16, borderRadius: 6, marginBottom: 12, border: '1px solid #2a2a3a' }}
                    >
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                            <div>
                                <label htmlFor={`methodName-${method.id}`} style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: 4 }}>Method Name</label>
                                <input 
                                    id={`methodName-${method.id}`}
                                    type="text" 
                                    placeholder="e.g. SadaPay, EasyPaisa, HBL" 
                                    value={method.name} 
                                    onChange={(e) => handleUpdateMethod(method.id, 'name', e.target.value)}
                                    style={{ width: '100%', background: '#0a0a0f', border: '1px solid #333', color: '#fff', padding: 8, borderRadius: 4 }}
                                />
                            </div>
                            <div>
                                <label htmlFor={`accountTitle-${method.id}`} style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: 4 }}>Account Title</label>
                                <input 
                                    id={`accountTitle-${method.id}`}
                                    type="text" 
                                    placeholder="Account Holder Name" 
                                    value={method.accountTitle} 
                                    onChange={(e) => handleUpdateMethod(method.id, 'accountTitle', e.target.value)}
                                    style={{ width: '100%', background: '#0a0a0f', border: '1px solid #333', color: '#fff', padding: 8, borderRadius: 4 }}
                                />
                            </div>
                        </div>

                        <div style={{ marginTop: 12 }}>
                            <label htmlFor={`accountNumber-${method.id}`} style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: 4 }}>Account Number</label>
                            <input 
                                id={`accountNumber-${method.id}`}
                                type="text" 
                                placeholder="IBAN or Account Number" 
                                value={method.accountNumber} 
                                onChange={(e) => handleUpdateMethod(method.id, 'accountNumber', e.target.value)}
                                style={{ width: '100%', background: '#0a0a0f', border: '1px solid #333', color: '#fff', padding: 8, borderRadius: 4 }}
                            />
                        </div>

                        {/* ANCHOR 1: Payment Instruction Box */}
                        <div style={{ marginTop: 12 }} id={index === 0 ? 'payment-instruction' : undefined}>
                            <label htmlFor={`instruction-${method.id}`} style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: 4 }}>Payment Instruction</label>
                            <textarea 
                                id={`instruction-${method.id}`}
                                placeholder="Paise bhej kar screenshot WhatsApp pe bhejein" 
                                value={method.instruction} 
                                onChange={(e) => handleUpdateMethod(method.id, 'instruction', e.target.value)}
                                style={{ width: '100%', background: '#0a0a0f', border: '1px solid #333', color: '#fff', padding: 8, borderRadius: 4, height: 60 }}
                            />
                        </div>

                        {/* ANCHOR 2: WhatsApp Toggle */}
                        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyItems: 'space-between' }} id={index === 0 ? 'whatsapp-toggle' : undefined}>
                            <span style={{ color: '#fff', fontSize: '13px' }}>Show WhatsApp Screenshot Button</span>
                            <input 
                                type="checkbox" 
                                checked={method.showWhatsAppScreenshot} 
                                onChange={(e) => handleUpdateMethod(method.id, 'showWhatsAppScreenshot', e.target.checked)}
                                style={{ cursor: 'pointer', width: 16, height: 16, marginLeft: 'auto' }}
                            />
                        </div>

                        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                            <button 
                                type="button"
                                onClick={() => handleRemoveMethod(method.id)}
                                style={{ background: '#ef4444', color: '#fff', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', border: 'none', fontSize: '11px' }}
                            >
                                Delete
                            </button>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>

            {methods.length > 0 && (
                <button 
                    type="button"
                    onClick={handleSave}
                    disabled={loading}
                    style={{ width: '100%', background: '#6366f1', color: '#fff', padding: '10px', borderRadius: 6, cursor: 'pointer', border: 'none', fontWeight: 600, marginTop: 10 }}
                >
                    {loading ? 'Saving...' : 'Save Methods'}
                </button>
            )}
        </div>
    );
};