import { useState, useCallback } from 'react';
import type { Map as LeafletMap } from 'leaflet';

export const useGeolocation = (map: LeafletMap | null) => {
    const [locating, setLocating] = useState(false);

    const getCurrentPosition = useCallback(async (): Promise<{ latitude: number, longitude: number }> => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by this browser.'));
                return;
            }

            setLocating(true);
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setLocating(false);
                    resolve({
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude
                    });
                },
                (error) => {
                    setLocating(false);
                    reject(error);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
            );
        });
    }, []);

    const centerMapOnUser = useCallback(async () => {
        try {
            const { latitude, longitude } = await getCurrentPosition();
            if (map) {
                map.flyTo([latitude, longitude], 12, { duration: 1 });
            }
            return { latitude, longitude };
        } catch (error) {
            let message = 'Unable to retrieve your location.';
            if (error instanceof GeolocationPositionError) {
                if (error.code === error.PERMISSION_DENIED) {
                    message = 'Location access was denied. Please check your browser permissions.';
                } else if (error.code === error.TIMEOUT) {
                    message = 'Location request timed out. Please try again.';
                }
            }
            alert(message);
            console.error(error);
            return null;
        }
    }, [map, getCurrentPosition]);

    return { locating, getCurrentPosition, centerMapOnUser };
};
