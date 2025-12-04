import React, { useEffect, useState } from 'react';
import '../../pages/Home.css';

const testimonials = [
    {
        id: 1,
        text: "Absolutely in love with the Lavender Bliss bath bomb! It smells divine and left my skin feeling so soft.",
        author: "Sarah K.",
        location: "Lahore"
    },
    {
        id: 2,
        text: "The packaging is beautiful and the bath bombs are huge. Great value for money. Will definitely order again.",
        author: "Ayesha M.",
        location: "Karachi"
    },
    {
        id: 3,
        text: "Best bath bombs in Pakistan! The fizz is amazing and the scents are not overpowering. Highly recommended.",
        author: "Fatima R.",
        location: "Islamabad"
    }
];

export default function Testimonials() {
    // Simple rotation logic if needed, or just grid display
    // Legacy had a carousel, but grid is often better for overview. 
    // We'll stick to grid for simplicity and robustness as per CSS.

    return (
        <section className="testimonials">
            <div className="container">
                <div className="section-header">
                    <h2>What Our Customers Say</h2>
                    <p>Real reviews from real customers</p>
                </div>
                <div className="testimonials-grid">
                    {testimonials.map((t) => (
                        <div key={t.id} className="testimonial" style={{ display: 'block' }}>
                            <p className="testimonial-text">"{t.text}"</p>
                            <div className="testimonial-author">{t.author}</div>
                            <div className="testimonial-location">{t.location}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
