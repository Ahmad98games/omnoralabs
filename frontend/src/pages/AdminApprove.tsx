import React, { useEffect, useState, useRef } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import client from '../api/client';
import { ShieldCheck, ShieldAlert, Loader2, ArrowLeft, RefreshCw } from 'lucide-react';
import './AdminApprove.css';

type ApprovalStatus = 'loading' | 'success' | 'error';

const AdminApprove: React.FC = () => {
    const { id } = useParams<{ id: string }>(); 
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    
    const [status, setStatus] = useState<ApprovalStatus>('loading');
    const [message, setMessage] = useState('');
    
    // Prevent double-firing in Strict Mode
    const hasFetched = useRef(false);

    const performApproval = useCallback(async () => {
        if (!id || !token) {
            setStatus('error');
            setMessage('Security Token Missing or Malformed.');
            return;
        }

        setStatus('loading');

        try {
            await client.get(`/orders/${id}/approve?token=${token}`);
            setStatus('success');
        } catch (error: unknown) {
            setStatus('error');
            const errorMsg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Authorization Protocol Failed';
            setMessage(errorMsg);
        }
    }, [id, token]);

    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;
        
        // Ensure this runs after the first render to avoid cascading state updates
        setTimeout(() => {
            performApproval();
        }, 0);
    }, [performApproval]);

    return (
        <div className="approval-container">
            <div className="scan-line"></div> {/* Cosmetic Scan Line */}
            
            <div className="approval-card">
                
                {status === 'loading' && (
                    <div className="status-content">
                        <div className="loader-ring">
                            <Loader2 className="animate-spin" size={48} color="var(--neon-cyan)" />
                        </div>
                        <h2 className="blink-text">VERIFYING SIGNATURE</h2>
                        <p className="status-desc">Accessing Secure Gateway Node...</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="status-content animate-entry">
                        <div className="icon-box success">
                            <ShieldCheck size={56} strokeWidth={1.5} />
                        </div>
                        <h2>ACCESS GRANTED</h2>
                        <p className="status-desc">Order has been successfully authorized and pushed to fulfillment.</p>
                        
                        <div className="meta-terminal">
                            <div className="meta-row">
                                <span>TARGET ID:</span>
                                <span className="highlight">{id}</span>
                            </div>
                            <div className="meta-row">
                                <span>STATUS:</span>
                                <span className="highlight green">APPROVED</span>
                            </div>
                        </div>

                        <Link to="/admin" className="btn-action primary">
                            <ArrowLeft size={18} /> RETURN TO COMMAND
                        </Link>
                    </div>
                )}

                {status === 'error' && (
                    <div className="status-content animate-entry">
                        <div className="icon-box error">
                            <ShieldAlert size={56} strokeWidth={1.5} />
                        </div>
                        <h2>ACCESS DENIED</h2>
                        <p className="status-desc error-text">{message}</p>
                        
                        <div className="action-row">
                            <button onClick={() => performApproval()} className="btn-action secondary">
                                <RefreshCw size={18} /> RETRY
                            </button>
                            <Link to="/" className="btn-action primary">
                                <ArrowLeft size={18} /> ABORT
                            </Link>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="approval-footer">
                OMNORA SECURE SYSTEMS • v2.4.0
            </div>
        </div>
    );
};

export default AdminApprove;