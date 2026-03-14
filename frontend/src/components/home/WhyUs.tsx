import React from 'react';
import '../../pages/Home.css';

export default function WhyUs() {
    return (
        <section className="why-us">
            <div className="container">
                <div className="why-us-content">
                    <h2>Why Choose Omnora?</h2>
                    <p>We believe in the power of nature to heal and rejuvenate. Our bath bombs are more than just fizzy fun—they are a commitment to your well-being and the planet.</p>

                    <div className="why-us-features">
                        <div className="why-feature">
                            <h4>Artisanal Quality</h4>
                            <p>Each bath bomb is hand-pressed in small batches to ensure perfection.</p>
                        </div>
                        <div className="why-feature">
                            <h4>Skin-Loving Oils</h4>
                            <p>Infused with shea butter, coconut oil, and essential oils for deep hydration.</p>
                        </div>
                        <div className="why-feature">
                            <h4>Eco-Friendly Packaging</h4>
                            <p>We use biodegradable materials to minimize our environmental footprint.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
