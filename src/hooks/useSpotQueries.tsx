import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
        staleTime: 0, // Always consider details stale to ensure fresh data on mount
        gcTime: 1000 * 60 * 10, // Keep in cache for 10 mins
    });
}

/**
 * Hook for deleting a spot.
 */
export function useDeleteSpotMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (spotId: string) => spotService.deleteSpot(spotId),
        onSuccess: (_, spotId) => {
            queryClient.invalidateQueries({ queryKey: spotKeys.all });
            queryClient.removeQueries({ queryKey: spotKeys.details(spotId) });
        },
    });
}

/**
 * Hook for toggling a spot as favorite.
 */
export function useToggleFavoriteMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ spotId, userId, isFavorited }: { spotId: string, userId: string, isFavorited: boolean }) => 
            spotService.toggleFavorite(spotId, userId, isFavorited),
        onSuccess: (_, { spotId }) => {
            queryClient.invalidateQueries({ queryKey: spotKeys.details(spotId) });
            // Also invalidate global spots list if needed
            queryClient.invalidateQueries({ queryKey: spotKeys.all });
        },
    });
}
