import React from 'react';
import { Quote, Star, MapPin } from 'lucide-react';
import './Testimonials.css'; // Make sure to create this file

const testimonials = [
    {
        id: 1,
        text: "Absolutely in love with the Lavender Bliss bath bomb! It smells divine and left my skin feeling so soft.",
        author: "Sarah K.",
        location: "Lahore",
        rating: 5
    },
    {
        id: 2,
        text: "The packaging is beautiful and the bath bombs are huge. Great value for money. Will definitely order again.",
        author: "Ayesha M.",
        location: "Karachi",
        rating: 5
    },
    {
        id: 3,
        text: "Best bath bombs in Pakistan! The fizz is amazing and the scents are not overpowering. Highly recommended.",
        author: "Fatima R.",
        location: "Islamabad",
        rating: 5
    }
];

export default function Testimonials() {
    return (
        <section className="testimonials-section">
            <div className="testimonials-container">
                
                {/* --- HEADER --- */}
                <div className="section-header">
                    <span className="section-tag">VOICE OF THE COMMUNITY</span>
                    <h2 className="section-title">
                        Customer <span className="highlight-text">Stories</span>
                    </h2>
                    <p className="section-subtitle">
                        Real experiences from the people who use Omnora daily.
                    </p>
                </div>

                {/* --- GRID --- */}
                <div className="testimonials-grid">
                    {testimonials.map((t) => (
                        <div key={t.id} className="testimonial-card">
                            {/* Ambient Quote Icon */}
                            <div className="quote-icon-bg">
                                <Quote size={60} strokeWidth={1} />
                            </div>

                            <div className="card-content">
                                {/* Stars */}
                                <div className="stars">
                                    {[...Array(t.rating)].map((_, i) => (
                                        <Star key={i} size={16} fill="#ffd600" stroke="none" />
                                    ))}
                                </div>

                                <p className="testimonial-text">"{t.text}"</p>

                                <div className="testimonial-footer">
                                    <div className="author-avatar">
                                        {t.author.charAt(0)}
                                    </div>
                                    <div className="author-info">
                                        <span className="author-name">{t.author}</span>
                                        <span className="author-location">
                                            <MapPin size={12} /> {t.location}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}