/**
 * CustomerReviews: Social Proof Block
 *
 * Renders star-rated review cards in grid or slider layout.
 * Cinematic dark-mode aesthetic with hover micro-animations.
 * Registered in BuilderRegistry as 'customer_reviews'.
 */
import React, { useState } from 'react';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface Review {
    author: string;
    rating: number;
    content: string;
    date?: string;
    avatar?: string;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface CustomerReviewsProps {
    nodeId: string;
    headline?: string;
    layout?: 'grid' | 'slider';
    starColor?: string;
    bgColor?: string;
    columns?: number;
    reviews?: Review[];
    children?: React.ReactNode;
}

// ─── Default Data ─────────────────────────────────────────────────────────────

const DEFAULT_REVIEWS: Review[] = [
    { author: 'Sarah M.', rating: 5, content: 'Absolutely stunning quality! The craftsmanship is impeccable and it arrived beautifully packaged. Worth every penny.', date: '2 days ago' },
    { author: 'James K.', rating: 5, content: 'I\'ve ordered from many stores online, but this one truly stands out. Fast shipping, premium materials, and incredible attention to detail.', date: '1 week ago' },
    { author: 'Emily R.', rating: 4, content: 'Beautiful product and great customer service. Only wish it came in more color options. Will definitely be ordering again!', date: '2 weeks ago' },
    { author: 'David L.', rating: 5, content: 'The build quality exceeded my expectations. This is luxury at its finest. Already recommending it to everyone I know.', date: '3 weeks ago' },
];

// ─── Tokens ───────────────────────────────────────────────────────────────────

const T = {
    surface: '#13131a',
    surface2: '#1a1a24',
    border: '#2a2a3a',
    text: '#f0f0f5',
    textDim: '#8b8ba0',
    textMuted: '#5a5a70',
};

// ─── Component ────────────────────────────────────────────────────────────────

export const CustomerReviews: React.FC<CustomerReviewsProps> = ({
    nodeId,
    headline = 'What Our Customers Say',
    layout = 'grid',
    starColor = '#fbbf24',
    bgColor = 'transparent',
    columns = 2,
    reviews = DEFAULT_REVIEWS,
}) => {
    const isSlider = layout === 'slider';

    return (
        <div
            data-node-id={nodeId}
            style={{
                fontFamily: "'Inter', -apple-system, sans-serif",
                padding: '32px 0', background: bgColor,
            }}
        >
            {headline && (
                <h2 style={{
                    fontSize: 22, fontWeight: 800, color: T.text,
                    margin: '0 0 24px', letterSpacing: '-0.03em',
                    textAlign: 'center',
                }}>
                    {headline}
                </h2>
            )}

            {/* Average Rating */}
            {reviews.length > 0 && (
                <div style={{
                    textAlign: 'center', marginBottom: 28,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                }}>
                    <Stars rating={Math.round(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length * 10) / 10} color={starColor} size={16} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>
                        {(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)}
                    </span>
                    <span style={{ fontSize: 12, color: T.textMuted }}>
                        ({reviews.length} reviews)
                    </span>
                </div>
            )}

            {/* Cards */}
            <div style={isSlider ? {
                display: 'flex', gap: 16, overflowX: 'auto',
                scrollSnapType: 'x mandatory', padding: '4px 0',
                scrollbarWidth: 'none',
            } : {
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gap: 16,
            }}>
                {reviews.map((review, i) => (
                    <ReviewCard
                        key={i}
                        review={review}
                        starColor={starColor}
                        isSlider={isSlider}
                    />
                ))}
            </div>
        </div>
    );
};

// ─── Review Card ──────────────────────────────────────────────────────────────

const ReviewCard: React.FC<{ review: Review; starColor: string; isSlider: boolean }> = ({
    review, starColor, isSlider,
}) => {
    const [hov, setHov] = useState(false);

    return (
        <div
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
                background: T.surface,
                border: `1px solid ${hov ? '#3a3a5a' : T.border}`,
                borderRadius: 14,
                padding: '22px 20px',
                display: 'flex', flexDirection: 'column', gap: 14,
                transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
                transform: hov ? 'translateY(-3px)' : 'none',
                boxShadow: hov ? '0 8px 30px rgba(0,0,0,0.2)' : 'none',
                ...(isSlider ? { minWidth: 300, scrollSnapAlign: 'start', flexShrink: 0 } : {}),
            }}
        >
            {/* Stars */}
            <Stars rating={review.rating} color={starColor} size={14} />

            {/* Content */}
            <p style={{
                fontSize: 13, color: T.textDim, lineHeight: 1.7,
                margin: 0, fontWeight: 400, flex: 1,
            }}>
                "{review.content}"
            </p>

            {/* Author */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                borderTop: `1px solid ${T.border}`, paddingTop: 12,
            }}>
                <div style={{
                    width: 32, height: 32, borderRadius: 16,
                    background: `linear-gradient(135deg, ${starColor}40, ${starColor}15)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 800, color: starColor,
                }}>
                    {review.author.charAt(0)}
                </div>
                <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.text, display: 'block' }}>
                        {review.author}
                    </span>
                    {review.date && (
                        <span style={{ fontSize: 10, color: T.textMuted }}>
                            {review.date}
                        </span>
                    )}
                </div>
                <span style={{
                    marginLeft: 'auto', fontSize: 10, fontWeight: 600,
                    color: '#34d399', background: 'rgba(52,211,153,0.1)',
                    padding: '3px 8px', borderRadius: 4,
                }}>
                    Verified
                </span>
            </div>
        </div>
    );
};

// ─── Stars ────────────────────────────────────────────────────────────────────

const Stars: React.FC<{ rating: number; color: string; size: number }> = ({ rating, color, size }) => (
    <div style={{ display: 'flex', gap: 2 }}>
        {[1, 2, 3, 4, 5].map(i => (
            <span key={i} style={{
                fontSize: size, color: i <= rating ? color : '#2a2a3a',
                transition: 'color 0.15s',
            }}>
                ★
            </span>
        ))}
    </div>
);

export default CustomerReviews;
