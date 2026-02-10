import { useCallback } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { mapAtom, getSpotsAtom, searchedLocationAtom } from 'src/atoms/map';
import { useNavigate } from '@tanstack/react-router';

export const useMapSearch = () => {
    const map = useAtomValue(mapAtom);
    const getSpots = useAtomValue(getSpotsAtom);
    const setSearchedLocation = useSetAtom(searchedLocationAtom);
    const navigate = useNavigate();

    const getZoomLevel = (types: string[] = []): number => {
        // Specific locations (businesses, parks, addresses, etc.)
        const specificTypes = [
            'street_address', 'premise', 'subpremise', 'establishment',
            'point_of_interest', 'park', 'shopping_mall', 'stadium',
            'amusement_park', 'university', 'school', 'museum'
        ];

        // Mid-level locations (neighborhoods, large landmarks)
        const midTypes = ['neighborhood', 'landmark', 'sublocality'];

        if (types.some(t => specificTypes.includes(t))) {
            return 17; // Very specific - zoom in close
        }
        if (types.some(t => midTypes.includes(t))) {
            return 15; // Mid specificity
        }

        // Default to broader view for cities, towns, regions
        return 13;
    };

    const handlePlaceSelect = useCallback((place: google.maps.places.PlaceResult) => {
        const lat = place.geometry?.location?.lat();
        const lng = place.geometry?.location?.lng();

        if (lat && lng) {
            const types = place.types || [];
            const zoom = getZoomLevel(types);
            const name = place.name || place.formatted_address || 'Searched Location';

            // Check if it's a broad search (city, region, etc.)
            // We consider it broad if it maps to the default zoom level (13) which is for cities/towns
            const isBroadLocation = getZoomLevel(types) <= 13;

            // 1. Update Map view
            if (map) {
                map.flyTo([lat, lng], zoom, { duration: 1.5 });
                if (getSpots) {
                    map.once('moveend', () => getSpots(map.getBounds()));
                }
            }

            // 2. Set the searched location atom ONLY for specific locations
            if (!isBroadLocation) {
                setSearchedLocation({ lat, lng, name });
            } else {
                setSearchedLocation(null); // Clear any existing marker if searching broadly
            }

            // 3. Update URL
            navigate({ to: '/spots', search: { lat, lng } });
        }
    }, [map, getSpots, setSearchedLocation, navigate]);

    const clearSearchedLocation = useCallback(() => {
        setSearchedLocation(null);
    }, [setSearchedLocation]);

    return {
        handlePlaceSelect,
        clearSearchedLocation
    };
};