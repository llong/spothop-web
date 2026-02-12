import { useState, useCallback, useEffect } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import L from 'leaflet';
import { useGeolocation } from './useGeolocation';
import { useSetAtom } from 'jotai';
import { userLocationAtom } from 'src/atoms/map';

export const useMapState = (map: LeafletMap | null, getSpots: (bounds: L.LatLngBounds) => void, lat?: number, lng?: number) => {
    const [moved, setMoved] = useState(false);
    const [isFollowingUser, setIsFollowingUser] = useState(true);
    const [circleSize, setCircleSize] = useState(25);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
    const setGlobalUserLocation = useSetAtom(userLocationAtom);

    const { centerMapOnUser } = useGeolocation(map);

    useEffect(() => {
        if (!map) return;

        const bounds = map.getBounds();
        getSpots(bounds);

        const handleZoom = () => {
            const zoom = map.getZoom();
            setCircleSize(Math.max(25, Math.min(35, 25 * Math.pow(2, 17 - zoom))));
        };

        map.on('zoomend', handleZoom);
        return () => {
            map.off('zoomend', handleZoom);
        };
    }, [map, getSpots]);

    useEffect(() => {
        if (navigator.geolocation && map) {
            const watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const coords = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy || 100
                    };
                    setUserLocation(coords);
                    setGlobalUserLocation({ latitude: coords.lat, longitude: coords.lng });
                    
                    // Only update map view if we are explicitly following the user AND NO search params exist
                    // AND we haven't moved the map manually recently (handled by isFollowingUser)
                    if (isFollowingUser && !lat && !lng) {
                        const currentCenter = map.getCenter();
                        const dist = L.latLng(coords.lat, coords.lng).distanceTo(currentCenter);
                        
                        // Only pan and refetch if we moved significantly (> 50 meters)
                        // This prevents micro-stuttering updates from refreshing the list constantly
                        if (dist > 50) {
                            map.panTo([coords.lat, coords.lng]);
                            
                            // Debounce/Throttle this in a real app, but for now just check distance
                            setTimeout(() => {
                                getSpots(map.getBounds());
                            }, 500);
                        }
                    }
                },
                (error) => console.error('[useMapState] Geolocation error:', error),
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
            );

            return () => navigator.geolocation.clearWatch(watchId);
        }
    }, [map, isFollowingUser, lat, lng]);

    const handleMove = useCallback(() => {
        setMoved(true);
        setIsFollowingUser(false);
    }, []);

    const handleCenterOnUser = useCallback(() => {
        setIsFollowingUser(true);
        centerMapOnUser();
    }, [centerMapOnUser]);

    return {
        moved,
        setMoved,
        isFollowingUser,
        circleSize,
        userLocation,
        handleMove,
        handleCenterOnUser
    };
};