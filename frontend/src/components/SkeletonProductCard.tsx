import React from 'react';

const SkeletonProductCard = () => {
    return (
        <div className="product-card skeleton-card">
            <div className="product-image-placeholder skeleton-pulse" style={{ height: '300px', background: '#e0e0e0' }}></div>
            <div className="product-info">
                <div className="skeleton-pulse" style={{ height: '20px', width: '80%', marginBottom: '10px', background: '#e0e0e0', borderRadius: '4px' }}></div>
                <div className="skeleton-pulse" style={{ height: '16px', width: '60%', marginBottom: '15px', background: '#e0e0e0', borderRadius: '4px' }}></div>
                <div className="skeleton-pulse" style={{ height: '40px', width: '100%', background: '#e0e0e0', borderRadius: '4px' }}></div>
            </div>
        </div>
    );
};

export default SkeletonProductCard;
