import supabase from "../supabase";
import type { FeedItem, MediaComment } from "../types";

export const feedService = {
    /**
     * Fetches paginated global feed content.
     */
    async fetchGlobalFeed(
        limit: number = 10, 
        offset: number = 0, 
        userId?: string,
        filters?: {
            lat?: number;
            lng?: number;
            maxDistKm?: number;
            followingOnly?: boolean;
            spotTypes?: string[];
            difficulties?: string[];
            minRisk?: number;
            maxRisk?: number;
            riderTypes?: string[];
            authorId?: string;
        }
    ) {
        console.error('[FeedService] Fetching feed. User:', userId, 'Filters:', JSON.stringify(filters));
        
        let response;
        
        console.log('[FeedService] Calling get_global_feed_content');
        response = await supabase.rpc('get_global_feed_content', {
            p_limit: limit,
            p_offset: offset,
            p_user_id: userId || null,
            p_lat: filters?.lat || null,
            p_lng: filters?.lng || null,
            p_max_dist_km: filters?.maxDistKm || null,
            p_following_only: false,
            p_spot_types: filters?.spotTypes || null,
            p_difficulties: filters?.difficulties || null,
            p_min_risk: filters?.minRisk || null,
            p_max_risk: filters?.maxRisk || null,
            p_rider_types: filters?.riderTypes || null,
            p_author_id: filters?.authorId || null
        });

        const { data, error } = response;
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
     * Fetches paginated following feed content.
     */
    async fetchFollowingFeed(limit: number = 10, offset: number = 0, userId: string) {
        console.log('[FeedService] Calling get_following_feed_content');
        const { data, error } = await supabase.rpc('get_following_feed_content', {
            p_limit: limit,
            p_offset: offset,
            p_user_id: userId
        });

        if (error) throw error;

        let feedItems = (data as FeedItem[]) || [];
        
        // Enrichment for following feed (similar to global)
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
     * Toggles follow for a user.
     */
    async toggleFollow(followingId: string) {
        const { error } = await supabase.rpc('handle_user_follow', {
            p_following_id: followingId
        });

        if (error) throw error;
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
     * Toggles a reaction on a comment.
     */
    async toggleCommentReaction(commentId: string, reactionType: string = 'like') {
        const { error } = await supabase.rpc('handle_media_comment_reaction', {
            p_comment_id: commentId,
            p_reaction_type: reactionType
        });

        if (error) throw error;
    },

    /**
     * Fetches comments for a specific media item.
     */
    async fetchMediaComments(mediaId: string, mediaType: 'photo' | 'video', userId?: string): Promise<MediaComment[]> {
        let query = supabase
            .from('media_comments')
            .select(`
                *,
                author:profiles (
                    username,
                    "displayName",
                    "avatarUrl"
                ),
                media_comment_reactions (
                    user_id,
                    reaction_type
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

        // Aggregate reactions for each comment
        return (data || []).map((comment: any) => {
            const reactions = comment.media_comment_reactions || [];
            const likes = reactions.filter((r: any) => r.reaction_type === 'like').length;
            const userReaction = userId 
                ? reactions.find((r: any) => r.user_id === userId)?.reaction_type || null
                : null;

            return {
                ...comment,
                reactions: {
                    likes,
                    userReaction
                }
            };
        }) as MediaComment[];
    },

    /**
     * Posts a new comment on a media item.
     */
    async postMediaComment(mediaId: string, mediaType: 'photo' | 'video', content: string, parentId?: string) {
        // Use the post_comment RPC which handles abuse prevention
        const { data: commentId, error: rpcError } = await supabase.rpc('post_comment', {
            p_media_id: mediaId,
            p_media_type: mediaType,
            p_content: content,
            p_parent_id: parentId || null
        });

        if (rpcError) throw rpcError;

        // Fetch the created comment to return it with author details
        const { data, error } = await supabase
            .from('media_comments')
            .select(`
                *,
                author:profiles (
                    username,
                    "displayName",
                    "avatarUrl"
                )
            `)
            .eq('id', commentId)
            .single();

        if (error) throw error;
        return data as MediaComment;
    }
};