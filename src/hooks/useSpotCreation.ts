import { useState, useCallback } from 'react';
import L from 'leaflet';

export const useSpotCreation = (isLoggedIn: boolean) => {
    const [newSpot, setNewSpot] = useState<{ latlng: L.LatLng; address: string } | null>(null);

    const onRightClick = useCallback(async (latlng: L.LatLng) => {
        if (!isLoggedIn) return;
        try {
            const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latlng.lat},${latlng.lng}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`);
            const data = await response.json();
            if (data.results && data.results.length > 0) {
                setNewSpot({ latlng, address: data.results[0].formatted_address });
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