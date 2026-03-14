export type Region = 'SOUTH_ASIA' | 'GLOBAL';

const SOUTH_ASIAN_COUNTRIES = new Set(['PK', 'IN', 'BD', 'LK', 'NP', 'MV', 'BT']);

export const GeoService = {
    /**
     * Determines the user's region based on their IP address.
     * Uses get.geojs.io as it is highly reliable and free for basic IP geolocation.
     * Fails open securely to 'GLOBAL' if blocked by ad-blockers or network errors.
     */
    async getUserRegion(): Promise<Region> {
        try {
            const response = await fetch('https://get.geojs.io/v1/ip/geo.json', {
                method: 'GET',
                // Brief timeout to ensure UI doesn't hang indefinitely for merchants on poor connections
                signal: AbortSignal.timeout(3000) 
            });

            if (!response.ok) {
                console.warn(`[GeoService] API failed with status: ${response.status}. Defaulting to GLOBAL.`);
                return 'GLOBAL';
            }

            const data = await response.json();
            const countryCode = data?.country; // e.g., 'US', 'PK', 'IN'

            if (countryCode && SOUTH_ASIAN_COUNTRIES.has(countryCode.toUpperCase())) {
                console.log(`[GeoService] South Asian region detected (${countryCode}). Applying PPP routing.`);
                return 'SOUTH_ASIA';
            }

            return 'GLOBAL';
        } catch (error) {
            console.warn("[GeoService] Failed to fetch geolocation. Ad-blocker or network error. Defaulting to GLOBAL.", error);
            return 'GLOBAL';
        }
    }
};
