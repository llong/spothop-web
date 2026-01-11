import { useState, useCallback } from 'react';
import { reverseGeocode } from 'src/utils/geocoding';

export const useGeocoding = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const buildLocationString = useCallback(async (
        address?: string | null,
        city?: string | null,
        country?: string | null,
        latitude?: number | null,
        longitude?: number | null
    ): Promise<string> => {
        if (address) {
            return address;
        }

        if (latitude && longitude) {
            setIsLoading(true);
            setError(null);
            
            try {
                const info = await reverseGeocode(latitude, longitude);

                const streetInfo = address || [info.streetNumber, info.street].filter(Boolean).join(' ');
                const cityName = city || info.city;
                const state = info.state;
                const locationParts = [cityName, state].filter(Boolean).join(', ');
                const cleanAddress = [streetInfo, locationParts, country || info.country].filter(Boolean).join(', ');

                if (cleanAddress) {
                    return cleanAddress;
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Geocoding failed');
                console.error('Geocoding error:', err);
            } finally {
                setIsLoading(false);
            }
        }

        const parts = [city, country].filter(Boolean);
        return parts.length > 0 ? parts.join(', ') : 'Unknown Location';
    }, []);

    return {
        buildLocationString,
        isLoading,
        error
    };
};