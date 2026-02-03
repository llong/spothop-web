import { useState, useEffect } from 'react';
import type { Spot } from 'src/types';
import { useToggleFavoriteMutation } from './useSpotQueries';

export const useSpotFavorites = (spot: Spot | undefined, userId: string | undefined) => {
    const [isFavorited, setIsFavorited] = useState(false);
    const toggleMutation = useToggleFavoriteMutation();

    // Sync favorite state with spot data from props (e.g. query result)
    useEffect(() => {
        if (spot) setIsFavorited(!!spot.isFavorited);
    }, [spot?.isFavorited]);

    const toggleFavorite = async () => {
        if (!userId || !spot || toggleMutation.isPending) return;

        // Optimistic update
        const previousState = isFavorited;
        setIsFavorited(!previousState);

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
            console.error('Error toggling favorite:', error);
            return { success: false, message: 'Error updating favorite status' };
        }
    };

    return { 
        isFavorited, 
        toggleFavorite, 
        isLoading: toggleMutation.isPending 
    };
};
