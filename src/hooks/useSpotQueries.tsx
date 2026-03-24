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
        staleTime: 1000 * 60 * 5, // 5 mins cache to prevent excessive fetching
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
        mutationFn: ({ spotId }: { spotId: string }) => 
            spotService.toggleFavorite(spotId),
        onMutate: async ({ spotId }) => {
            await queryClient.cancelQueries({ queryKey: spotKeys.details(spotId) });
            const previousSpot = queryClient.getQueryData<any>(spotKeys.details(spotId));
            
            if (previousSpot) {
                const isFavorited = previousSpot.is_favorited_by_user;
                queryClient.setQueryData(spotKeys.details(spotId), {
                    ...previousSpot,
                    is_favorited_by_user: !isFavorited,
                    favorite_count: Math.max(0, (previousSpot.favorite_count || 0) + (isFavorited ? -1 : 1))
                });
            }
            return { previousSpot };
        },
        onSuccess: (data, { spotId }) => {
            if (data) {
                queryClient.setQueryData(spotKeys.details(spotId), (old: any) => ({
                    ...old,
                    is_favorited_by_user: data.new_is_favorited,
                    favorite_count: data.new_favorite_count
                }));
            }
        },
        onError: (_err, _vars, context: any) => {
            if (context?.previousSpot) {
                queryClient.setQueryData(spotKeys.details(_vars.spotId), context.previousSpot);
            }
        }
    });
}
