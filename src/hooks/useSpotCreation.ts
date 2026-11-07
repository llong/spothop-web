import { useState, useCallback } from 'react';
import L from 'leaflet';
import { reverseGeocode } from 'src/utils/geocoding';

export const useSpotCreation = (isLoggedIn: boolean) => {
    const [newSpot, setNewSpot] = useState<{ latlng: L.LatLng; address: string } | null>(null);

    const onRightClick = useCallback(async (latlng: L.LatLng) => {
        if (!isLoggedIn) return;
        try {
            // Shared helper: cached per coordinate and parses the response once
            const info = await reverseGeocode(latlng.lat, latlng.lng);
            if (info.formattedAddress) {
                setNewSpot({ latlng, address: info.formattedAddress });
            }
        } catch (error) {
            console.error('[useSpotCreation] Geocoding error:', error);
        }
    }, [isLoggedIn]);

    return {
        newSpot,
        setNewSpot,
        onRightClick
    };
};
