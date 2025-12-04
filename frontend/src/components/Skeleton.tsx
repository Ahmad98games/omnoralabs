import React from 'react';
import './Skeleton.css';

export const SkeletonCard: React.FC = () => (
    <div className="skeleton-card">
        <div className="skeleton-image" />
        <div className="skeleton-text" />
        <div className="skeleton-text short" />
    </div>
);

export const SkeletonProductDetail: React.FC = () => (
    <div className="product-detail-container skeleton-detail">
        <div className="product-image-section">
            <div className="skeleton-image large" />
        </div>
        <div className="product-info-section">
            <div className="skeleton-text title" />
            <div className="skeleton-text price" />
            <div className="skeleton-text paragraph" />
            <div className="skeleton-text paragraph" />
            <div className="skeleton-text paragraph" />
            <div className="skeleton-text button" />
        </div>
    </div>
);
