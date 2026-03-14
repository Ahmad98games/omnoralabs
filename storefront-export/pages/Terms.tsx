import React from 'react';
import './LegalPages.css';

export default function Terms() {
    return (
        <div className="legal-page-luxury reveal">
            <div className="container">
                <div className="legal-header-lux">
                    <span className="eyebrow">GSG ATELIER</span>
                    <h1 className="subtitle-serif">Terms & Conditions</h1>
                    <p className="description-small italic">Last updated: November 2025</p>
                </div>

                <div className="legal-content-lux">
                    <section className="legal-section-lux">
                        <span className="section-num-lux">SEC. 01</span>
                        <h2 className="section-title-serif">Agreement to Terms</h2>
                        <p className="legal-text-lux">
                            By accessing the GSG Atelier website, you agree to be bound by these Terms of Service and to comply with all applicable laws and regulations. These terms govern the acquisition and use of our bespoke craftsmanship and boutique services.
                        </p>
                    </section>

                    <section className="legal-section-lux">
                        <span className="section-num-lux">SEC. 02</span>
                        <h2 className="section-title-serif">Atelier Access License</h2>
                        <p className="legal-text-lux">
                            Permission is granted to temporarily view the materials on our boutique website for personal, non-commercial transitory viewing only. This is the grant of a limited access privilege, not a transfer of intellectual property title.
                        </p>
                    </section>

                    <section className="legal-section-lux">
                        <span className="section-num-lux">SEC. 03</span>
                        <h2 className="section-title-serif">Artisanal Disclaimer</h2>
                        <p className="legal-text-lux">
                            The materials on our boutique website are provided as an invitation to experience our craftsmanship. While we strive for perfection, all digital representation of our physical pieces is provided on an 'as is' basis.
                        </p>
                    </section>

                    <section className="legal-section-lux">
                        <span className="section-num-lux">SEC. 04</span>
                        <h2 className="section-title-serif">Limitations of Liability</h2>
                        <p className="legal-text-lux">
                            In no event shall the GSG Atelier or its artisans be liable for any indirect damages arising out of the use or inability to access the digital materials on our website.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
