import React from 'react';

interface SectionProps {
    type: string;
    data: any;
}

const HeroSection: React.FC<{ data: any }> = ({ data }) => (
    <section className="hero-section" style={{ padding: '4rem 2rem', textAlign: 'center', background: 'var(--bg-surface)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <h1 style={{ fontSize: '3.5rem', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--p-color)', marginBottom: '1rem' }}>{data.title || 'Welcome Territory'}</h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--s-color)', opacity: 0.8, maxWidth: '600px', margin: '0 auto' }}>{data.subtitle || 'Customized Sovereign Experience'}</p>
        {data.buttonText && (
            <button style={{ marginTop: '2rem', padding: '1rem 2.5rem', background: 'var(--p-color)', color: '#000', border: 'none', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                {data.buttonText}
            </button>
        )}
    </section>
);

const ProductGrid: React.FC<{ data: any }> = ({ data }) => (
    <section className="product-grid-section" style={{ padding: '4rem 2rem' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '2rem', color: 'var(--p-color)', fontFamily: 'monospace' }}>{data.title || 'Curated Collection'}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
            {/* Product items would go here, linked to real data */}
            {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '1.5rem', backdropFilter: 'blur(20px)' }}>
                    <div style={{ aspectRatio: '1', background: '#111', marginBottom: '1rem' }}></div>
                    <div style={{ height: '20px', background: '#222', width: '60%', marginBottom: '0.5rem' }}></div>
                    <div style={{ height: '15px', background: '#222', width: '40%' }}></div>
                </div>
            ))}
        </div>
    </section>
);

const TextContent: React.FC<{ data: any }> = ({ data }) => (
    <section className="text-content-section" style={{ padding: '4rem 2rem', maxWidth: '800px', margin: '0 auto' }}>
        <div dangerouslySetInnerHTML={{ __html: data.body }} style={{ lineHeight: '1.8', color: 'rgba(255,255,255,0.9)' }} />
    </section>
);

const DynamicSection: React.FC<SectionProps> = ({ type, data }) => {
    switch (type) {
        case 'hero':
            return <HeroSection data={data} />;
        case 'products':
            return <ProductGrid data={data} />;
        case 'text':
            return <TextContent data={data} />;
        default:
            return <div style={{ padding: '2rem', color: 'red' }}>Unknown Section Type: {type}</div>;
    }
};

export default DynamicSection;
