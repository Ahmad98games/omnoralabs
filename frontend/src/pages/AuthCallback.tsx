import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { CinematicLoader } from '../components/ui/CinematicLoader';

const AuthCallback: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const handleCallback = async () => {
            // Supabase PKCE flow: the code is in the URL, but Supabase SDK 
            // usually handles the exchange automatically on window load.
            // However, we want to be explicit and wait for it.
            
            const { data, error } = await supabase.auth.getSession();
            
            if (error) {
                console.error('[AuthCallback] Session Error:', error);
                navigate('/login?error=auth_callback_failed');
                return;
            }

            if (data.session) {
                console.log('[AuthCallback] Session established, executing redirection matrix...');
                
                // 🔄 STRATEGY: Check both tables to ensure zero-flicker routing
                const { data: merchant } = await supabase.from('merchants').select('role').eq('id', data.session.user.id).single();
                const { data: customer } = await supabase.from('customers').select('id').eq('id', data.session.user.id).single();
                
                if (merchant) {
                    console.log('[AuthCallback] Identified as MERCHANT/ADMIN');
                    if (merchant.role === 'admin' || merchant.role === 'super-admin') {
                        navigate('/admin/dashboard');
                    } else {
                        navigate('/seller/dashboard?tab=builder');
                    }
                } else if (customer) {
                    console.log('[AuthCallback] Identified as CUSTOMER');
                    navigate('/');
                } else {
                    // 🛡️ RECOVERY: Fallback to user_metadata role if profile sync is still in progress
                    const role = data.session.user.user_metadata?.role || 'customer';
                    console.log(`[AuthCallback] No profile found, falling back to metadata role: ${role}`);
                    
                    if (role === 'seller') {
                        navigate('/seller/dashboard?tab=builder');
                    } else {
                        navigate('/');
                    }
                }
            } else {
                console.warn('[AuthCallback] No session found');
                navigate('/login');
            }
        };

        handleCallback();
    }, [navigate]);

    return (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100vh', 
            background: '#050505', 
            color: '#F1D592', 
            gap: '20px' 
        }}>
            <CinematicLoader />
            <div style={{ fontFamily: 'serif', fontSize: '18px', letterSpacing: '0.1em' }}>
                ESTABLISHING SECURE SESSION...
            </div>
        </div>
    );
};

export default AuthCallback;
