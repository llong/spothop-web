import { useState, useEffect } from 'react';
import { reverseGeocode } from 'src/utils/geocoding';
import type { Spot } from 'src/types';

export const useSpotAddress = (spot: Spot | undefined) => {
    const [displayAddress, setDisplayAddress] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!spot) {
            setDisplayAddress(null);
            return;
        }

        const buildAddress = async () => {
            setIsLoading(true);
            try {
                // Priority 1: Use reverse geocoding if lat/lng available to get the most accurate address
                if (spot.latitude && spot.longitude) {
                    const info = await reverseGeocode(spot.latitude, spot.longitude);

                    // Build a clean address: "123 Street Name, City, State"
                    const streetInfo = spot.address || [info.streetNumber, info.street].filter(Boolean).join(' ');
                    const city = spot.city || info.city;
                    const state = spot.state || info.state;
                    const country = spot.country || info.country;

                    const locationParts = [city, state].filter(Boolean).join(', ');
                    const cleanAddress = [streetInfo, locationParts, country].filter(Boolean).join(', ');

                    if (cleanAddress) {
                        setDisplayAddress(cleanAddress);
                        return;
                    }
                }

                // Fallback 1: Use existing fields if available
                if (spot.address) {
                    setDisplayAddress([
                        spot.address,
                        [spot.city, spot.state].filter(Boolean).join(', '),
                        spot.country
                    ].filter(Boolean).join(', '));
                    return;
                }

                // Fallback 2: Just city/state/country from DB
                const locationParts = [spot.city, spot.state].filter(Boolean).join(', ');
                setDisplayAddress([
                    locationParts,
                    spot.country
                ].filter(Boolean).join(', ') || 'Unknown Location');
            } catch (error) {
                console.error('Error building address:', error);
                setDisplayAddress('Unknown Location');
            } finally {
                setIsLoading(false);
            }
        };

        buildAddress();
    }, [spot?.id, spot?.address, spot?.city, spot?.state, spot?.country, spot?.latitude, spot?.longitude]);

    return { displayAddress, isLoading };
};
