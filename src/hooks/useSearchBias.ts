import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { mapAtom, userLocationAtom } from '@/atoms/map';

export interface LatLngLiteral {
    lat: number;
    lng: number;
}

/**
 * Where place searches should favor results: the user's location, or the centre of the map when the
 * location isn't known (yet). Null when neither is available, and then searches are not biased.
 */
export function useSearchBias(): LatLngLiteral | null {
    const userLocation = useAtomValue(userLocationAtom);
    const mapCenter = useAtomValue(mapAtom)?.getCenter();

    const lat = userLocation?.latitude ?? mapCenter?.lat;
    const lng = userLocation?.longitude ?? mapCenter?.lng;

    return useMemo(() => (lat !== undefined && lng !== undefined ? { lat, lng } : null), [lat, lng]);
}
