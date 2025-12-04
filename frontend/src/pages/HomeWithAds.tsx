import React from 'react';
import OriginalHome from './Home';
import AdPlacementZone from '../components/AdPlacementZone';
import adConfig from '../config/adConfig.json';
import '../components/AdPlacement.css';

// Wrapper component that adds ad zones to the existing Home page
export default function HomeWithAds() {
    return (
        <div>
            {/* Original Home Page Content */}
            <OriginalHome />

            {/* Ad Zones - These will be inserted at the end of the home page */}
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
                {/* Video Showcase Zone */}
                <AdPlacementZone
                    type="video"
                    config={adConfig.home.videoShowcase}
                    zoneName="Product Showcase Video"
                />

                {/* Mid Page Banner */}
                <AdPlacementZone
                    type="banner"
                    config={adConfig.home.midPageBanner}
                    zoneName="Mid-Page Promotional Banner"
                />

                {/* Footer Banner */}
                <AdPlacementZone
                    type="banner"
                    config={adConfig.home.footerBanner}
                    zoneName="Footer Banner"
                />
            </div>
        </div>
    );
}
