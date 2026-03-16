import { useState } from 'react';
import type { Spot } from 'src/types';
import { useToggleFavoriteMutation } from './useSpotQueries';

// ... (imports remain the same)

export const useSpotFavorites = (spot: Spot | undefined, userId: string | undefined, initialCount: number = 0) => {
    const [isFavorited, setIsFavorited] = useState(!!spot?.isFavorited);
    const [favoriteCount, setFavoriteCount] = useState(spot?.favoriteCount ?? initialCount);

    const toggleMutation = useToggleFavoriteMutation();

    // Sync favorite state with spot data from props during render (Task 4)
    const [prevSpotId, setPrevSpotId] = useState(spot?.id);
    if (spot?.id !== prevSpotId) {
        setIsFavorited(!!spot?.isFavorited);
        setFavoriteCount(spot?.favoriteCount ?? initialCount);
        setPrevSpotId(spot?.id);
    }

    const toggleFavorite = async () => {
        if (!userId || !spot || toggleMutation.isPending) return;

        // Optimistic update
        const previousState = isFavorited;
        const previousCount = favoriteCount;

        setIsFavorited(!previousState);
        setFavoriteCount(prev => previousState ? Math.max(0, prev - 1) : prev + 1);

        try {
            await toggleMutation.mutateAsync({
                spotId: spot.id,
                userId,
                isFavorited: previousState
            });
            return { success: true, message: previousState ? 'Removed from favorites' : 'Added to favorites' };
        } catch (error) {
            // Revert on error
            setIsFavorited(previousState);
            setFavoriteCount(previousCount);
            console.error('Error toggling favorite:', error);
            return { success: false, message: 'Error updating favorite status' };
        }
    };

    return {
        isFavorited,
        favoriteCount,
        toggleFavorite,
        isLoading: toggleMutation.isPending
    };
};
