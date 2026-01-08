import { useQuery } from '@tanstack/react-query';
import { spotService } from '../services/spotService';

export const spotKeys = {
    all: ['spots'] as const,
    details: (spotId: string) => [...spotKeys.all, 'detail', spotId] as const,
};

/**
 * Hook for fetching full spot details.
 */
export function useSpotQuery(spotId: string, userId?: string) {
    return useQuery({
        queryKey: spotKeys.details(spotId),
        queryFn: () => spotService.fetchSpotDetails(spotId, userId),
        enabled: !!spotId,
        staleTime: 1000 * 60 * 5, // 5 minutes (standard stale time)
    });
}
