import React from 'react';
import '../../pages/Home.css';

export default function HowItWorks() {
    return (
        <section className="how-it-works">
            <div className="container">
                <div className="section-header">
                    <h2>How It Works</h2>
                    <p>Simple steps to your perfect bath</p>
                </div>
                <div className="steps-grid">
                    <div className="step-card">
                        <div className="step-number">1</div>
                        <h3>Choose Your Scent</h3>
                        <p>Browse our collection and pick the perfect mood for your bath.</p>
                    </div>
                    <div className="step-card">
                        <div className="step-number">2</div>
                        <h3>Place Order</h3>
                        <p>Secure checkout with Cash on Delivery available nationwide.</p>
                    </div>
                    <div className="step-card">
                        <div className="step-number">3</div>
                        <h3>Relax & Enjoy</h3>
                        <p>Receive your package and indulge in a luxurious spa experience at home.</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
