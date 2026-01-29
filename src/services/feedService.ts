import supabase from "../supabase";
import type { FeedItem, MediaComment } from "../types";

export const feedService = {
    /**
     * Fetches paginated global feed content.
     */
    async fetchGlobalFeed(limit: number = 10, offset: number = 0, userId?: string) {
        const { data, error } = await supabase.rpc('get_global_feed_content', {
            p_limit: limit,
            p_offset: offset
        });

        if (error) throw error;

        let feedItems = (data as FeedItem[]) || [];

        // If userId is provided, we need to check if the user has liked/favorited the items
        // In a real scenario, this would be part of the RPC for better performance
        if (userId && feedItems.length > 0) {
            const photoIds = feedItems.filter(item => item.media_type === 'photo').map(item => item.media_id);
            const videoIds = feedItems.filter(item => item.media_type === 'video').map(item => item.media_id);
            const spotIds = feedItems.map(item => item.spot_id);

            const [likesResult, favoritesResult] = await Promise.all([
                supabase
                    .from('media_likes')
                    .select('photo_id, video_id')
                    .eq('user_id', userId)
                    .or(`photo_id.in.(${photoIds.join(',')}),video_id.in.(${videoIds.join(',')})`),
                supabase
                    .from('user_favorite_spots')
                    .select('spot_id')
                    .eq('user_id', userId)
                    .in('spot_id', spotIds)
            ]);

            const likedPhotoIds = new Set(likesResult.data?.map(l => l.photo_id).filter(Boolean));
            const likedVideoIds = new Set(likesResult.data?.map(l => l.video_id).filter(Boolean));
            const favoritedSpotIds = new Set(favoritesResult.data?.map(f => f.spot_id));

            feedItems = feedItems.map(item => ({
                ...item,
                is_liked_by_user: item.media_type === 'photo'
                    ? likedPhotoIds.has(item.media_id)
                    : likedVideoIds.has(item.media_id),
                is_favorited_by_user: favoritedSpotIds.has(item.spot_id)
            }));
        }

        return feedItems;
    },

    /**
     * Toggles a like on a media item.
     */
    async toggleMediaLike(mediaId: string, mediaType: 'photo' | 'video') {
        const { error } = await supabase.rpc('handle_media_like', {
            p_media_id: mediaId,
            p_media_type: mediaType
        });

        if (error) throw error;
    },

    /**
     * Fetches comments for a specific media item.
     */
    async fetchMediaComments(mediaId: string, mediaType: 'photo' | 'video') {
        let query = supabase
            .from('media_comments')
            .select(`
                *,
                author:profiles (
                    username,
                    "avatarUrl"
                )
            `)
            .order('created_at', { ascending: true });

        if (mediaType === 'photo') {
            query = query.eq('photo_id', mediaId);
        } else {
            query = query.eq('video_id', mediaId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as MediaComment[];
    },

    /**
     * Posts a new comment on a media item.
     */
    async postMediaComment(mediaId: string, mediaType: 'photo' | 'video', content: string) {
        // Use the post_comment RPC which handles abuse prevention
        const { data: commentId, error: rpcError } = await supabase.rpc('post_comment', {
            p_media_id: mediaId,
            p_media_type: mediaType,
            p_content: content
        });

        if (rpcError) throw rpcError;

        // Fetch the created comment to return it with author details
        const { data, error } = await supabase
            .from('media_comments')
            .select(`
                *,
                author:profiles (
                    username,
                    "avatarUrl"
                )
            `)
            .eq('id', commentId)
            .single();

        if (error) throw error;
        return data as MediaComment;
    }
};
