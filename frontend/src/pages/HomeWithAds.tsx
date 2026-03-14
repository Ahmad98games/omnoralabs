import React from 'react';
import OriginalHome from './Home';
import AdPlacementZone from '../components/AdPlacementZone';
import adConfig from '../config/adConfig.json';
import '../components/AdPlacement.css';
import { OmnoraNotification } from '../components/storefront/OmnoraNotification';

// Wrapper component that adds ad zones to the existing Home page
export default function HomeWithAds() {
    return (
        <div>
            {/* Original Home Page Content */}
            <OriginalHome />
            <OmnoraNotification />
                {/* Mid Page Banner */}

                {/* Footer Banner */}
            </div>
        
    );
}
