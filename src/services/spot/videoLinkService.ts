import supabase from "../../supabase";

export const videoLinkService = {
    async addVideoLink(
        spotId: string,
        userId: string,
        youtubeVideoId: string,
        startTime: number,
        endTime?: number,
        description?: string,
        skaterName?: string
    ) {
        const { data, error } = await supabase
            .from('spot_video_links')
            .insert({
                spot_id: spotId,
                user_id: userId,
                youtube_video_id: youtubeVideoId,
                start_time: startTime,
                end_time: endTime,
                description: description,
                skater_name: skaterName
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateVideoLink(
        linkId: string,
        youtubeVideoId: string,
        startTime: number,
        endTime?: number,
        description?: string,
        skaterName?: string
    ) {
        const { data, error } = await supabase
            .from('spot_video_links')
            .update({
                youtube_video_id: youtubeVideoId,
                start_time: startTime,
                end_time: endTime,
                description: description,
                skater_name: skaterName
            })
            .eq('id', linkId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteVideoLink(linkId: string) {
        const { error } = await supabase
            .from('spot_video_links')
            .delete()
            .eq('id', linkId);

        if (error) throw error;
    },

    async fetchSkaterSuggestions(query: string) {
        if (!query || query.length < 2) return [];

        const { data, error } = await supabase
            .from('spot_video_links')
            .select('skater_name')
            .ilike('skater_name', `%${query}%`)
            .not('skater_name', 'is', null)
            .limit(10);

        if (error) throw error;

        return Array.from(new Set((data || []).map((item: any) => item.skater_name)));
    },

    async toggleVideoLinkLike(linkId: string, userId: string, isLiked: boolean) {
        if (isLiked) {
            const { error } = await supabase
                .from('spot_video_link_likes')
                .delete()
                .eq('link_id', linkId)
                .eq('user_id', userId);
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('spot_video_link_likes')
                .upsert(
                    { link_id: linkId, user_id: userId },
                    { onConflict: 'link_id,user_id', ignoreDuplicates: true }
                );
            if (error) throw error;
        }
    }
};
