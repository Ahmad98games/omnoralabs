import React from 'react';
import './LegalPages.css';

export default function Privacy() {
    return (
        <div className="legal-page-luxury reveal">
            <div className="container">
                <div className="legal-header-lux">
                    <span className="eyebrow">DATA PROTECTION</span>
                    <h1 className="subtitle-serif">Privacy Policy</h1>
                    <p className="description-small italic">Your privacy is paramount to our service</p>
                </div>

                <div className="legal-content-lux">
                    <section className="legal-section-lux">
                        <span className="section-num-lux">PROTOCOL 01</span>
                        <h2 className="section-title-serif">Information We Curate</h2>
                        <p className="legal-text-lux">
                            We collect information you provide directly to us during your boutique experience, such as when you create an atelier profile, secure a purchase, or subscribe to our seasonal updates. This metadata is handled with the utmost discretion.
                        </p>
                    </section>

                    <section className="legal-section-lux">
                        <span className="section-num-lux">PROTOCOL 02</span>
                        <h2 className="section-title-serif">Data Utilization</h2>
                        <ul className="legal-list-lux">
                            <li>To fulfill and track your artisanal orders</li>
                            <li>To provide personalized boutique notifications</li>
                            <li>To enhance your digital atelier experience</li>
                            <li>To maintain direct concierge communications</li>
                        </ul>
                    </section>

                    <section className="legal-section-lux">
                        <span className="section-num-lux">PROTOCOL 03</span>
                        <h2 className="section-title-serif">Atelier Security</h2>
                        <p className="legal-text-lux">
                            We implement industry-leading encryption and security protocols to safeguard your personal data. Your trust is the foundation of our legacy.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
