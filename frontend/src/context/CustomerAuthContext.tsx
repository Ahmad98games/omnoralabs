import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface CustomerUser {
    id: string;
    email: string;
    name: string;
    createdAt?: string;
}

interface CustomerAuthContextType {
    customer: CustomerUser | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string, merchantId: string) => Promise<void>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export const CustomerAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [customer, setCustomer] = useState<CustomerUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session?.user) {
                // Ensure this is a storefront customer and not a merchant
                const { data: customerRecord } = await supabase
                    .from('customers')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (customerRecord) {
                    setCustomer({
                        id: customerRecord.id,
                        email: customerRecord.email,
                        name: customerRecord.name,
                        createdAt: customerRecord.created_at
                    });
                } else {
                    // Not a customer (possibly a Merchant admin token bleeding in)
                    setCustomer(null);
                }
            }
            setLoading(false);
        };

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                const { data: customerRecord } = await supabase
                    .from('customers')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();
                
                if (customerRecord) {
                    setCustomer({
                        id: customerRecord.id,
                        email: customerRecord.email,
                        name: customerRecord.name
                    });
                } else {
                    setCustomer(null);
                }
            } else {
                setCustomer(null);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const login = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error || !data.user) throw new Error(error?.message || 'Login failed');
        
        // Verify it's a customer
        const { data: customerData, error: customerErr } = await supabase
            .from('customers')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (customerErr || !customerData) {
            await supabase.auth.signOut();
            throw new Error('Not recognized as a storefront customer.');
        }

        setCustomer({ id: customerData.id, email: customerData.email, name: customerData.name });
    };

    const register = async (name: string, email: string, password: string, merchantId: string) => {
        // 1. Sign up the user via Supabase Auth
        const { data, error } = await supabase.auth.signUp({
            email, password,
            options: { data: { full_name: name, role: 'customer' } }
        });
        
        if (error || !data.user) throw new Error(error?.message || 'Registration failed');

        // 2. Sync to public `customers` table
        const { error: insertErr } = await supabase
            .from('customers')
            .insert({
                id: data.user.id,
                email: data.user.email,
                name: name,
                merchant_id: merchantId
            });

        if (insertErr) {
            console.error("Customer Sync Error:", insertErr);
            throw new Error('Failed to synchronize customer profile.');
        }

        // 3. Growth Hack: Auto-merge past guest orders by matching the email
        const { error: mergeErr } = await supabase
            .from('orders')
            .update({ customer_id: data.user.id })
            .eq('customer_email', data.user.email)
            .is('customer_id', null);

        if (mergeErr) {
            console.warn("Could not automatically merge guest orders:", mergeErr);
        }

        setCustomer({ id: data.user.id, email: data.user.email || email, name });
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setCustomer(null);
    };

    return (
        <CustomerAuthContext.Provider value={{ customer, loading, login, register, logout, isAuthenticated: !!customer }}>
            {children}
        </CustomerAuthContext.Provider>
    );
};

export const useCustomerAuth = () => {
    const context = useContext(CustomerAuthContext);
    if (context === undefined) {
        throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
    }
    return context;
};
