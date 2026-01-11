import React, { useState, useEffect } from 'react';
import { ArrowUpRight } from 'lucide-react';
import LoadingWrapper from '../components/LoadingWrapper'; // The component we built
import './OmnoraPosterGallery.css';

interface Poster {
    id: number;
    image: string;
    alt: string;
    title: string;
    category: string;
}

const posters: Poster[] = [
    { id: 1, image: '/images/posters/1.png', alt: 'Bath Bomb Poster 1', title: 'The Royal Edition', category: 'Signature' },
    { id: 2, image: '/images/posters/2.png', alt: 'Bath Bomb Poster 2', title: 'Midnight Void', category: 'Dark Series' },
    { id: 3, image: '/images/posters/3.png', alt: 'Bath Bomb Poster 3', title: 'Solar Essence', category: 'Citrus' },
    { id: 4, image: '/images/posters/4.png', alt: 'Bath Bomb Poster 4', title: 'Liquid Dreams', category: 'Abstract' },
    { id: 5, image: '/images/posters/5.png', alt: 'Bath Bomb Poster 5', title: 'Crystal Form', category: 'Geologic' },
];

export default function PosterGallery() {
    const [isLoading, setIsLoading] = useState(true);
    const [heroPoster, ...gridPosters] = posters;

    // Simulate Image Loading (In production, use onLoad events on images)
    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 1500);
        return () => clearTimeout(timer);
    }, []);

    // Custom Skeleton for this specific asymmetrical layout
    const GallerySkeleton = () => (
        <div className="gallery-grid-magnum">
            {/* Hero Skeleton */}
            <div className="skeleton-block" style={{ height: '100%', borderRadius: '4px', minHeight: '600px' }} />
            {/* Grid Skeleton */}
            <div className="gallery-sub-grid">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="skeleton-block" style={{ height: '100%', minHeight: '280px', borderRadius: '4px' }} />
                ))}
            </div>
        </div>
    );

    return (
        <section className="gallery-magnum">
            <div className="gallery-noise" />
            
            <div className="container">
                {/* HEADER */}
                <div className="gallery-header-magnum">
                    <h2 className="gallery-title">
                        <span>Visual Archive</span>
                        Exhibition
                    </h2>
                    <div className="gallery-meta">
                        <p>
                            A curated selection of Omnora Sanctuary visual assets. 
                            Exploring the intersection of luxury and ritual.
                        </p>
                    </div>
                </div>

                {/* LOADING WRAPPER INTEGRATION */}
                <LoadingWrapper 
                    isLoading={isLoading} 
                    skeleton={<GallerySkeleton />}
                    minDisplayTime={800} // Ensure shimmer is seen
                >
                    <div className="gallery-grid-magnum animate-entry">
                        
                        {/* LEFT: HERO POSTER */}
                        <div className="poster-artifact poster-hero">
                            <div className="artifact-img-wrapper">
                                <img 
                                    src={heroPoster.image} 
                                    alt={heroPoster.alt} 
                                    className="artifact-img" 
                                    loading="lazy" 
                                />
                                <div className="artifact-overlay">
                                    <div className="overlay-header">
                                        <span className="artifact-id">NO. 0{heroPoster.id}</span>
                                        <span className="artifact-cat">{heroPoster.category}</span>
                                    </div>
                                    <div className="overlay-footer">
                                        <h3 className="artifact-title">{heroPoster.title}</h3>
                                        <button className="artifact-btn" aria-label="View Details">
                                            <ArrowUpRight size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: SUB GRID */}
                        <div className="gallery-sub-grid">
                            {gridPosters.map((poster) => (
                                <div key={poster.id} className="poster-artifact">
                                    <div className="artifact-img-wrapper">
                                        <img 
                                            src={poster.image} 
                                            alt={poster.alt} 
                                            className="artifact-img" 
                                            loading="lazy" 
                                        />
                                        <div className="artifact-overlay">
                                            <span className="artifact-id">0{poster.id}</span>
                                            <h3 className="artifact-title small">{poster.title}</h3>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                    </div>
                </LoadingWrapper>
            </div>
        </section>
    );
};