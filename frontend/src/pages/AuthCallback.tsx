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
                console.log('[AuthCallback] Session established, syncing profile...');
                
                // 🔄 STRATEGY: Retry up to 3 times to account for the background AuthContext sync
                let profile = null;
                for (let attempt = 0; attempt < 3; attempt++) {
                    const { data: p } = await supabase
                        .from('merchants')
                        .select('role')
                        .eq('id', data.session.user.id)
                        .single();
                    
                    if (p) {
                        profile = p;
                        break;
                    }
                    console.log(`[AuthCallback] Profile not found, retrying... (${attempt + 1}/3)`);
                    await new Promise(resolve => setTimeout(resolve, 1500));
                }
                
                const role = profile?.role || 'customer';
                console.log('[AuthCallback] Final resolved role:', role);
                
                if (role === 'admin' || role === 'super-admin') {
                    navigate('/admin/dashboard');
                } else if (role === 'seller') {
                    navigate('/seller/dashboard?tab=builder');
                } else {
                    // 🛍️ Redirect customers to the storefront home page
                    navigate('/');
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
