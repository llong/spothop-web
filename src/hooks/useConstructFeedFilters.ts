import { useMemo } from 'react';
import type { FeedFilters } from '../atoms/feed';

/**
 * Hook to construct feed filters from UI state.
 */
export function useConstructFeedFilters(
    filters: FeedFilters,
    userLocation: { latitude: number; longitude: number } | null,
    activeTab: number
) {
    return useMemo(() => {
        console.log('[useConstructFeedFilters] ActiveTab:', activeTab, 'UserLoc:', userLocation);
        let lat = undefined;
        let lng = undefined;
        let maxDistKm = undefined;

        if (filters.selectedLocation) {
            lat = filters.selectedLocation.lat;
            lng = filters.selectedLocation.lng;
            maxDistKm = filters.maxDistKm;
        } else if (filters.nearMe) {
            lat = userLocation?.latitude;
            lng = userLocation?.longitude;
            maxDistKm = filters.maxDistKm;
        }

        const constructedFilters = {
            lat,
            lng,
            maxDistKm,
            followingOnly: activeTab === 1,
            spotTypes: filters.spotTypes.length > 0 ? filters.spotTypes : undefined,
            difficulties: filters.difficulties.length > 0 ? filters.difficulties : undefined,
            riderTypes: filters.riderTypes.length > 0 ? filters.riderTypes : undefined,
            maxRisk: filters.maxRisk < 5 ? filters.maxRisk : undefined,
            authorId: filters.author?.id,
        };

        console.log('[useConstructFeedFilters] Result:', constructedFilters);
        return constructedFilters;
    }, [filters, userLocation, activeTab]);
}
