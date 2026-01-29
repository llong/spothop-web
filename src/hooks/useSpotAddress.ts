import { useState, useEffect } from 'react';
import { reverseGeocode } from 'src/utils/geocoding';
import type { Spot } from 'src/types';

const buildBasicAddress = (spot: Spot | undefined) => {
    if (!spot) return null;
    if (spot.address) {
        return [
            spot.address,
            [spot.city, spot.state].filter(Boolean).join(', '),
            spot.country
        ].filter(Boolean).join(', ');
    }
    const locationParts = [spot.city, spot.state].filter(Boolean).join(', ');
    return [
        locationParts,
        spot.country
    ].filter(Boolean).join(', ') || 'Unknown Location';
};

export const useSpotAddress = (spot: Spot | undefined) => {
    const [displayAddress, setDisplayAddress] = useState<string | null>(() => buildBasicAddress(spot));
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!spot) {
            setDisplayAddress(null);
            return;
        }

        const buildAddress = async () => {
            // Priority 1: Use reverse geocoding if lat/lng available to get the most accurate address
            if (spot.latitude && spot.longitude) {
                setIsLoading(true);
                try {
                    const info = await reverseGeocode(spot.latitude, spot.longitude);
                    if (!info) return;

                    // Build a clean address: "123 Street Name, City, State"
                    const streetInfo = [info.streetNumber, info.street].filter(Boolean).join(' ');
                    const city = info.city;
                    const state = info.state;
                    const country = info.country;

                    const locationParts = [city, state].filter(Boolean).join(', ');
                    const enrichedAddress = [streetInfo, locationParts, country].filter(Boolean).join(', ');

                    // If enriched address is available and has some content, use it. 
                    if (enrichedAddress && enrichedAddress.length > 5) {
                        setDisplayAddress(enrichedAddress);
                    }
                } catch (error) {
                    console.error('Error building address:', error);
                } finally {
                    setIsLoading(false);
                }
            }
        };

        buildAddress();
    }, [spot?.id, spot?.latitude, spot?.longitude]);

    return { displayAddress, isLoading };
};
