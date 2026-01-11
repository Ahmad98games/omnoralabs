import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import './OmnoraCarousel.css';

// Import assets (Keep your imports)
import slide3 from '../assets/bathbomb/3.png';
import slide2 from '../assets/bathbomb/2.png';
import slide1 from '../assets/bathbomb/1.png';
import slide4 from '../assets/bathbomb/4.png';
import slide5 from '../assets/bathbomb/5.png';

const slides = [
    { 
        src: slide3, 
        title: "Velvet Void", 
        badge: "Best Seller",
        desc: "Deep relaxation with notes of lavender and charcoal." 
    },
    { 
        src: slide2, 
        title: "Solar Flare", 
        badge: "New Arrival",
        desc: "Citrus bursts that awaken the senses and energize the soul." 
    },
    { 
        src: slide1, 
        title: "Rose Quartz", 
        badge: "Limited Edition",
        desc: "Infused with real petals for a romantic, silky embrace." 
    },
    { 
        src: slide4, 
        title: "Ocean Mist", 
        badge: "Therapeutic",
        desc: "Sea salts and eucalyptus to clear the mind and body." 
    },
    { 
        src: slide5, 
        title: "Golden Hour", 
        badge: "Luxury",
        desc: "Shimmering gold mica with a warm vanilla finish." 
    }
];

const AUTOPLAY_DURATION = 5000;

const Carousel = () => {
    const [current, setCurrent] = useState(0);

    // Simplified Logic: No complex intervals for progress bar
    const nextSlide = () => {
        setCurrent((prev) => (prev + 1) % slides.length);
    };

    const prevSlide = () => {
        setCurrent((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
    };

    // AutoPlay Logic
    useEffect(() => {
        const timer = setInterval(() => {
            nextSlide();
        }, AUTOPLAY_DURATION);

        return () => clearInterval(timer);
    }, [current]);

    return (
        <div className="carousel-magnum">
            {/* Cinematic Grain Overlay (Texture) */}
            <div className="film-grain"></div>

            {/* Slides Layer */}
            {slides.map((slide, idx) => (
                <div 
                    key={idx} 
                    className={`magnum-slide ${idx === current ? 'active' : ''}`}
                >
                    <div className="magnum-image-wrapper">
                        <img src={slide.src} alt={slide.title} className="magnum-img" />
                    </div>
                    
                    <div className="magnum-content">
                        <span className="magnum-badge">{slide.badge}</span>
                        <h2 className="magnum-title">{slide.title}</h2>
                        <p className="magnum-desc">{slide.desc}</p>
                    </div>
                </div>
            ))}

            {/* Controls Layer */}
            <div className="magnum-controls">
                <div className="magnum-counter">
                    {String(current + 1).padStart(2, '0')} 
                    <span>/ {String(slides.length).padStart(2, '0')}</span>
                </div>
                
                <button className="nav-btn" onClick={prevSlide} aria-label="Previous Slide">
                    <ArrowLeft size={20} />
                </button>
                <button className="nav-btn" onClick={nextSlide} aria-label="Next Slide">
                    <ArrowRight size={20} />
                </button>
            </div>

            {/* Progress Bar - CSS Driven */}
            <div className="magnum-progress-container">
                {/* TRICK: adding 'key={current}' forces React to destroy and recreate 
                   this div every time the slide changes. This resets the CSS animation automatically.
                */}
                <div 
                    key={current} 
                    className="magnum-progress-bar" 
                    style={{ animationDuration: `${AUTOPLAY_DURATION}ms` }}
                />
            </div>
        </div>
    );
};

export default Carousel;