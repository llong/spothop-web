import supabase from "../supabase";
import type { MediaItem } from "../types";
import { reverseGeocode } from "../utils/geocoding";

export const spotService = {
    /**
     * Fetches a full spot with its media, stats, and favorite status.
     */
    async fetchSpotDetails(spotId: string, userId?: string) {
        // 1. Fetch Spot with Media and Metadata
        const spotPromise = supabase
            .from('spots')
            .select(`
                id, name, description, latitude, longitude, address, city, state, country, created_by, created_at, difficulty, kickout_risk, is_lit, spot_type,
                spot_photos (
                    id,
                    url,
                    created_at,
                    user_id,
                    media_likes!photo_id (
                        user_id
                    ),
                    media_comments!photo_id (
                        id
                    )
                ),
                spot_videos (
                    id,
                    url,
                    thumbnail_url,
                    created_at,
                    user_id,
                    media_likes!video_id (
                        user_id
                    ),
                    media_comments!video_id (
                        id
                    )
                )
            `)
            .eq('id', spotId)
            .maybeSingle();

        // 2. Fetch Social Stats
        const favoriteStatusPromise = userId
            ? supabase
                .from('user_favorite_spots')
                .select('*')
                .eq('user_id', userId)
                .eq('spot_id', spotId)
            : Promise.resolve({ data: null, error: null });

        const favoriteCountPromise = supabase
            .from('user_favorite_spots')
            .select('user_id', { count: 'exact' })
            .eq('spot_id', spotId);

        const commentCountPromise = supabase
            .from('spot_comments')
            .select('id', { count: 'exact' })
            .eq('spot_id', spotId);

        const flagCountPromise = supabase
            .from('content_reports')
            .select('*', { count: 'exact' })
            .eq('target_id', spotId)
            .eq('target_type', 'spot');

        const favoritedUsersPromise = supabase
            .from('user_favorite_spots')
            .select(`
                user_id,
                profiles (
                    id,
                    username,
                    "avatarUrl"
                )
            `)
            .eq('spot_id', spotId);

        const [spotResult, favoriteStatusResult, favoriteCountResult, commentCountResult, flagCountResult, favoritedUsersResult] = await Promise.all([
            spotPromise,
            favoriteStatusPromise,
            favoriteCountPromise,
            commentCountPromise,
            flagCountPromise,
            favoritedUsersPromise
        ]);

        if (spotResult.error) throw spotResult.error;
        const spotData = spotResult.data;

        if (!spotData) return null;

        // 3. Location Enrichment (Only if missing)
        if (!spotData.city || !spotData.country || !spotData.state) {
            try {
                const info = await reverseGeocode(spotData.latitude, spotData.longitude);
                spotData.city = spotData.city || info.city;
                spotData.state = spotData.state || info.state;
                spotData.country = spotData.country || info.country;
            } catch (e) {
                console.warn("Geocoding failed for spot:", spotId);
            }
        }

        // 4. Author Profiles
        const authorIds = [
            ...(spotData.spot_photos || []).map((p: any) => p.user_id),
            ...(spotData.spot_videos || []).map((v: any) => v.user_id),
            spotData.created_by
        ].filter((v, i, a) => v && a.indexOf(v) === i);

        const { data: profiles } = authorIds.length > 0
            ? await supabase.from('profiles').select('id, username, "avatarUrl", "displayName"').in('id', authorIds)
            : { data: [] };

        const profileMap = new Map(profiles?.map(p => [p.id, p]));
        const creatorProfile = profileMap.get(spotData.created_by);

        // 5. Format Media
        const photos: MediaItem[] = (spotData.spot_photos || []).map((p: any) => {
            const author = profileMap.get(p.user_id);
            return {
                id: p.id,
                url: p.url,
                type: 'photo' as const,
                createdAt: p.created_at,
                author: {
                    id: p.user_id,
                    username: author?.username || 'unknown',
                    avatarUrl: author?.avatarUrl || null
                },
                likeCount: p.media_likes?.length || 0,
                commentCount: p.media_comments?.length || 0,
                isLiked: userId ? p.media_likes?.some((l: any) => l.user_id === userId) : false
            };
        });

        const videos: MediaItem[] = (spotData.spot_videos || []).map((v: any) => {
            const author = profileMap.get(v.user_id);
            return {
                id: v.id,
                url: v.url,
                thumbnailUrl: v.thumbnail_url,
                type: 'video' as const,
                createdAt: v.created_at,
                author: {
                    id: v.user_id,
                    username: author?.username || 'unknown',
                    avatarUrl: author?.avatarUrl || null
                },
                likeCount: v.media_likes?.length || 0,
                commentCount: v.media_comments?.length || 0,
                isLiked: userId ? v.media_likes?.some((l: any) => l.user_id === userId) : false
            };
        });

        return {
            ...spotData,
            media: [...photos, ...videos],
            creator: {
                username: creatorProfile?.username || 'unknown',
                avatarUrl: creatorProfile?.avatarUrl || null,
                displayName: creatorProfile?.displayName || null,
            },
            username: creatorProfile?.username || 'unknown', // Keep for backward compatibility
            favoriteCount: favoriteCountResult.count || 0,
            commentCount: commentCountResult.count || 0,
            flagCount: flagCountResult.count || 0,
            isFavorited: !!(userId && favoriteStatusResult.data && favoriteStatusResult.data.length > 0),
            favoritedByUsers: (favoritedUsersResult.data || []).map((f: any) => ({
                id: f.user_id,
                username: f.profiles?.username || 'unknown',
                avatarUrl: f.profiles?.avatarUrl || null
            }))
        };
    },

    /**
     * Deletes a spot and its associated media/comments
     */
    async deleteSpot(spotId: string) {
        const { error } = await supabase
            .from('spots')
            .delete()
            .eq('id', spotId);

        if (error) throw error;
    },

    /**
     * Toggles favorite status for a spot
     */
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
    }
};
