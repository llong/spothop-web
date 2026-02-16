import { useState, useRef, useEffect } from 'react';
import { INITIAL_FEED_FILTERS } from 'src/atoms/feed';
import type { FeedFilters } from 'src/atoms/feed';
import { useGeolocation } from 'src/hooks/useGeolocation';

export const useFeedFilters = (initialFilters: FeedFilters, onApply: (f: FeedFilters) => void) => {
    const [tempFilters, setTempFilters] = useState<FeedFilters>(initialFilters);
    const locationInputRef = useRef<HTMLInputElement | null>(null);
    const { centerMapOnUser } = useGeolocation(null);

    // Keep temp state in sync if initialFilters change externally
    useEffect(() => {
        setTempFilters(initialFilters);
    }, [initialFilters]);

    const toggleArrayItem = (key: keyof FeedFilters, item: string) => {
        setTempFilters(f => {
            const currentArray = (f[key] as string[]) || [];
            const newArray = currentArray.includes(item)
                ? currentArray.filter(i => i !== item)
                : [...currentArray, item];
            return { ...f, [key]: newArray };
        });
    };

    const handleNearMeChange = async (checked: boolean) => {
        if (checked) {
            setTempFilters(f => ({ ...f, nearMe: true, selectedLocation: undefined }));
            if (locationInputRef.current) locationInputRef.current.value = '';
            
            const pos = await centerMapOnUser();
            if (!pos) {
                setTempFilters(f => ({ ...f, nearMe: false }));
                // You could replace this alert with a proper Snackbar/Toast
                alert("Location access is required for 'Near Me'.");
            }
        } else {
            setTempFilters(f => ({ ...f, nearMe: false }));
        }
    };

    const handlePlaceSelect = (place: google.maps.places.PlaceResult) => {
        if (place.geometry?.location) {
            setTempFilters(prev => ({
                ...prev,
                nearMe: false,
                selectedLocation: {
                    lat: place.geometry!.location!.lat(),
                    lng: place.geometry!.location!.lng(),
                    name: place.name || 'Selected Location'
                }
            }));
        }
    };

    const handleReset = () => {
        setTempFilters(INITIAL_FEED_FILTERS);
        if (locationInputRef.current) locationInputRef.current.value = '';
        onApply(INITIAL_FEED_FILTERS);
    };

    const handleApply = () => onApply(tempFilters);

    return {
        tempFilters,
        setTempFilters,
        locationInputRef,
        toggleArrayItem,
        handleNearMeChange,
        handlePlaceSelect,
        handleReset,
        handleApply
    };
};
