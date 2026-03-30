import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
// useAuth removed from imports to satisfy lint
import { CinematicLoader } from '../components/ui/CinematicLoader';

const AuthCallback: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const handleCallback = async () => {
            const { data, error } = await supabase.auth.getSession();
            
            if (error || !data.session) {
                console.error('[AuthCallback] Session Error:', error);
                navigate('/login?error=auth_callback_failed');
                return;
            }

            const sbUser = data.session.user;
            
            // 🔄 STRATEGY: Determine true intent using DB + Metadata + LocalStorage
            try {
                const [merchantRes, customerRes] = await Promise.all([
                    supabase.from('merchants').select('role').eq('id', sbUser.id).maybeSingle(),
                    supabase.from('customers').select('id').eq('id', sbUser.id).maybeSingle()
                ]);
                
                const merchant = merchantRes.data;
                const customer = customerRes.data;
                
                // 🛡️ RECOVERY: If Google didn't provide role, check storage
                const savedRole = localStorage.getItem('omnora_selected_role');
                
                // Priority: DB record > Supabase Metadata > LocalStorage > Default
                const targetRole = merchant?.role || (customer ? 'customer' : null) || sbUser.user_metadata?.role || savedRole || 'customer';

                console.log(`[AuthCallback] Terminal Intent for ${sbUser.email}: ${targetRole}`);

                // Clean up transition state
                localStorage.removeItem('omnora_selected_role');

                if (targetRole === 'admin' || targetRole === 'super-admin') {
                    navigate('/admin/dashboard');
                } else if (targetRole === 'seller') {
                    // Force builder tab for sellers to ensure they land in the right place
                    navigate('/seller/dashboard?tab=builder');
                } else {
                    navigate('/');
                }
            } catch (err) {
                console.error('[AuthCallback] Redirection Fault:', err);
                navigate('/'); // Fallback to safe zone
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
            background: '#000000', 
            color: '#FFFFFF', 
            gap: '32px' 
        }}>
            <CinematicLoader />
            <div style={{ 
                fontFamily: 'Inter, sans-serif', 
                fontSize: '10px', 
                fontWeight: '900', 
                letterSpacing: '5px', 
                color: 'rgba(255,255,255,0.2)', 
                textTransform: 'uppercase' 
            }}>
                Establishing Secure Session
            </div>
        </div>
    );
};

export default AuthCallback;
