import supabase from "../../supabase";

export const favoriteService = {
    async toggleFavorite(spotId: string, userId: string, isFavorited: boolean) {
        if (isFavorited) {
            const { error } = await supabase
                .from('user_favorite_spots')
                .delete()
                .eq('user_id', userId)
                .eq('spot_id', spotId);
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('user_favorite_spots')
                .upsert(
                    { user_id: userId, spot_id: spotId },
                    { onConflict: 'user_id,spot_id', ignoreDuplicates: true }
                );
            if (error) throw error;
        }
    },
};
