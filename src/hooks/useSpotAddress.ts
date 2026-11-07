import { useState, useEffect, useMemo } from 'react';
import { reverseGeocode } from 'src/utils/geocoding';
import type { Spot } from 'src/types';

type AddressFields = Pick<Spot, 'address' | 'city' | 'state' | 'country'>;

/**
 * Builds a display address from the fields stored on the spot, without any network call.
 * Spots created in the app store Google's full formatted address, which already contains the
 * city/state/country, so those parts are only appended when they are not already present.
 */
export const buildBasicAddress = (spot: AddressFields | undefined | null): string | null => {
    if (!spot) return null;

    const parts: string[] = [];
    if (spot.address) parts.push(spot.address);

    const existing = (spot.address ?? '').toLowerCase();
    for (const value of [spot.city, spot.state, spot.country]) {
        if (value && !existing.includes(value.toLowerCase())) parts.push(value);
    }

    return parts.join(', ') || 'Unknown Location';
};

/**
 * Display address for a spot. Uses the stored address fields; only falls back to reverse
 * geocoding (a billable Google API call) when the spot has no stored street address.
 */
export const useSpotAddress = (spot: Spot | undefined) => {
    const basicAddress = useMemo(
        () => buildBasicAddress(spot),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [spot?.address, spot?.city, spot?.state, spot?.country, !!spot]
    );
    const [geocodedAddress, setGeocodedAddress] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const needsGeocode = !!spot && !spot.address && !!spot.latitude && !!spot.longitude;

    useEffect(() => {
        if (!needsGeocode || !spot) {
            setGeocodedAddress(null);
            return;
        }

        let cancelled = false;
        setIsLoading(true);

        reverseGeocode(spot.latitude, spot.longitude)
            .then((info) => {
                if (cancelled || !info) return;

                // "123 Street Name, City, State, Country"
                const streetInfo = [info.streetNumber, info.street].filter(Boolean).join(' ');
                const locationParts = [info.city, info.state].filter(Boolean).join(', ');
                const enriched = [streetInfo, locationParts, info.country].filter(Boolean).join(', ');

                if (enriched.length > 5) setGeocodedAddress(enriched);
            })
            .catch((error) => console.error('Error building address:', error))
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [needsGeocode, spot?.id, spot?.latitude, spot?.longitude]);

    return { displayAddress: geocodedAddress ?? basicAddress, isLoading };
};
