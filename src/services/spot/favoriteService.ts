import supabase from "../../supabase";

export const favoriteService = {
    async toggleFavorite(spotId: string) {
        const { data, error } = await supabase.rpc('toggle_spot_favorite', {
            p_spot_id: spotId
        });

        if (error) throw error;
        return data?.[0] as { new_is_favorited: boolean, new_favorite_count: number };
    },
};
