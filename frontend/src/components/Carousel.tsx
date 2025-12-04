import React, { useState, useEffect, useRef } from 'react';
import './Carousel.css';

// Placeholder images – replace with your own bath bomb assets in src/assets/bathbomb
import slide1 from '../assets/bathbomb/bomb1.png';
import slide2 from '../assets/bathbomb/bomb2.png';

const slides = [slide1, slide2];

const Carousel: React.FC = () => {
    const [current, setCurrent] = useState(0);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const resetTimeout = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    };

    useEffect(() => {
        resetTimeout();
        timeoutRef.current = setTimeout(() => {
            setCurrent((prev) => (prev + 1) % slides.length);
        }, 5000); // 5 seconds per slide
        return () => {
            resetTimeout();
        };
    }, [current]);

    const goToSlide = (index: number) => {
        setCurrent(index);
    };

    return (
        <div className="carousel">
            <div
                className="carousel-inner"
                style={{ transform: `translateX(-${current * 100}%)` }}
            >
                {slides.map((src, idx) => (
                    <div className="carousel-item" key={idx}>
                        <img src={src} alt={`Slide ${idx + 1}`} />
                    </div>
                ))}
            </div>
            <div className="carousel-dots">
                {slides.map((_, idx) => (
                    <button
                        key={idx}
                        className={idx === current ? 'dot active' : 'dot'}
                        onClick={() => goToSlide(idx)}
                        aria-label={`Go to slide ${idx + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default Carousel;
