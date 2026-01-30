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
    return useMemo(() => ({
        lat: filters.nearMe ? userLocation?.latitude : undefined,
        lng: filters.nearMe ? userLocation?.longitude : undefined,
        maxDistKm: filters.nearMe ? filters.maxDistKm : undefined,
        followingOnly: activeTab === 1,
        spotTypes: filters.spotTypes.length > 0 ? filters.spotTypes : undefined,
        difficulties: filters.difficulties.length > 0 ? filters.difficulties : undefined,
        riderTypes: filters.riderTypes.length > 0 ? filters.riderTypes : undefined,
        maxRisk: filters.maxRisk < 5 ? filters.maxRisk : undefined,
    }), [filters, userLocation, activeTab]);
}