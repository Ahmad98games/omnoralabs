import React, { useState } from 'react';
import client from '../../api/client';
import '../../pages/Home.css';

export default function Newsletter() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setStatus('loading');
        try {
            await client.post('/newsletter/subscribe', { email });
            setStatus('success');
            setMessage('Thank you for subscribing!');
            setEmail('');
        } catch (error: any) {
            setStatus('error');
            setMessage(error.message || 'Failed to subscribe. Please try again.');
        }
    };

    return (
        <section className="newsletter">
            <div className="container">
                <div className="newsletter-content">
                    <h2>Join the Omnora Family</h2>
                    <p>Subscribe to get exclusive offers, new launch alerts, and self-care tips.</p>

                    {status === 'success' ? (
                        <div className="newsletter-success">{message}</div>
                    ) : (
                        <form className="newsletter-form" onSubmit={handleSubmit}>
                            <input
                                type="email"
                                placeholder="Enter your email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <button type="submit" className="btn btn-primary" disabled={status === 'loading'}>
                                {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
                            </button>
                        </form>
                    )}
                    {status === 'error' && <div style={{ color: '#ff6b6b', marginTop: '1rem' }}>{message}</div>}
                </div>
            </div>
        </section>
    );
}
