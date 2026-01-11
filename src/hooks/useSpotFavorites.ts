import { useState, useMemo } from 'react';
import supabase from 'src/supabase';
import type { Spot } from 'src/types';

export const useSpotFavorites = (spot: Spot | undefined, userId: string | undefined) => {
    const [isFavorited, setIsFavorited] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Sync favorite state with spot data
    useMemo(() => {
        if (spot) setIsFavorited(!!spot.isFavorited);
    }, [spot?.isFavorited]);

    const toggleFavorite = async () => {
        if (!userId || !spot) return;

        setIsLoading(true);
        try {
            if (isFavorited) {
                await supabase
                    .from('user_favorite_spots')
                    .delete()
                    .eq('user_id', userId)
                    .eq('spot_id', spot.id);
            } else {
                await supabase
                    .from('user_favorite_spots')
                    .insert({ user_id: userId, spot_id: spot.id });
            }
            setIsFavorited(!isFavorited);
            return { success: true, message: isFavorited ? 'Removed from favorites' : 'Added to favorites' };
        } catch (error) {
            console.error('Error toggling favorite:', error);
            return { success: false, message: 'Error updating favorite status' };
        } finally {
            setIsLoading(false);
        }
    };

    return { isFavorited, toggleFavorite, isLoading };
};
