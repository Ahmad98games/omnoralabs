import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';

const AdminApprove = () => {
    const [status, setStatus] = useState('loading'); // loading, success, error
    const [message, setMessage] = useState('');

    useEffect(() => {
        const performApproval = async () => {
            try {
                // Extract token from URL
                const params = new URLSearchParams(window.location.search);
                const token = params.get('token');
                // Get ID from URL path (last segment)
                const pathSegments = window.location.pathname.split('/');
                const id = pathSegments[pathSegments.length - 1];

                if (!token) {
                    throw new Error('Missing approval token');
                }

                await client.get(`/orders/${id}/approve?token=${token}`);
                setStatus('success');
            } catch (error: any) {
                setStatus('error');
                setMessage(error.response?.data || error.message || 'Approval failed');
            }
        };

        performApproval();
    }, []);

    const containerStyle: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        textAlign: 'center',
        padding: '2rem',
        backgroundColor: '#f9f9f9'
    };

    return (
        <div style={containerStyle}>
            {status === 'loading' && <h2>Processing Approval...</h2>}

            {status === 'success' && (
                <div style={{ color: 'green' }}>
                    <h1>✅ You have been approved</h1>
                    <p>The order status has been updated.</p>
                    <Link to="/" style={{ marginTop: '2rem', display: 'inline-block' }}>Go to Home</Link>
                </div>
            )}

            {status === 'error' && (
                <div style={{ color: 'red' }}>
                    <h1>❌ Approval Failed</h1>
                    <p>{message}</p>
                    <Link to="/" style={{ marginTop: '2rem', display: 'inline-block' }}>Go to Home</Link>
                </div>
            )}
        </div>
    );
};

export default AdminApprove;