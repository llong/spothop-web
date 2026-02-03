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
        // Uniform location formatting: [Street], City, State, Country
        // Prefer explicit components over raw address strings to ensure consistency
        
        let streetPart = '';
        let statePart = '';
        let countryCode = country === 'United States' ? 'US' : (country || 'US');

        if (address) {
            const addressParts = address.split(',').map(p => p.trim());
            // Extract street (usually the first part)
            streetPart = addressParts[0];

            // If city matches a part, check the NEXT part for a state code
            if (city) {
                const cityIdx = addressParts.indexOf(city);
                if (cityIdx !== -1 && addressParts[cityIdx + 1]) {
                    const possibleState = addressParts[cityIdx + 1].split(' ')[0];
                    if (possibleState.length === 2 && possibleState === possibleState.toUpperCase()) {
                        statePart = possibleState;
                    }
                }
            }
        }

        // Combine parts into canonical format
        const finalParts = [
            streetPart,
            city,
            statePart,
            countryCode
        ].filter(Boolean);

        if (finalParts.length > 1) {
            return finalParts.join(', ');
        }

        // Fallback to reverse geocoding if critical parts are missing
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