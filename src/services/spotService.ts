import supabase from "../supabase";
import type { MediaItem, SpotVideoLink } from "../types";
import { reverseGeocode } from "../utils/geocoding";
import { extractStoragePath } from "../utils/media-utils";
import { favoriteService } from './spot/favoriteService';
import { videoLinkService } from './spot/videoLinkService';

export const spotService = {
    async fetchSpotDetails(spotId: string, userId?: string) {
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
                ),
                spot_video_links (
                    id,
                    youtube_video_id,
                    start_time,
                    end_time,
                    description,
                    skater_name,
                    created_at,
                    updated_at,
                    user_id,
                    spot_video_link_likes (
                        user_id
                    )
                )
            `)
            .eq('id', spotId)
            .maybeSingle();

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

        const authorIds = [
            ...(spotData.spot_photos || []).map((p: any) => p.user_id),
            ...(spotData.spot_videos || []).map((v: any) => v.user_id),
            ...(spotData.spot_video_links || []).map((l: any) => l.user_id),
            spotData.created_by
        ].filter((v, i, a) => v && a.indexOf(v) === i);

        const { data: profiles } = authorIds.length > 0
            ? await supabase.from('profiles').select('id, username, "avatarUrl", "displayName"').in('id', authorIds)
            : { data: [] };

        const profileMap = new Map(profiles?.map(p => [p.id, p]));
        const creatorProfile = profileMap.get(spotData.created_by);

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

        const videoLinks: SpotVideoLink[] = (spotData.spot_video_links || []).map((l: any) => {
            const author = profileMap.get(l.user_id);
            return {
                ...l,
                author: {
                    username: author?.username || 'unknown',
                    avatarUrl: author?.avatarUrl || null,
                    displayName: author?.displayName || null,
                },
                like_count: l.spot_video_link_likes?.length || 0,
                is_liked_by_user: userId ? l.spot_video_link_likes?.some((like: any) => like.user_id === userId) : false
            };
        });

        return {
            ...spotData,
            media: [...photos, ...videos],
            videoLinks,
            creator: {
                username: creatorProfile?.username || 'unknown',
                avatarUrl: creatorProfile?.avatarUrl || null,
                displayName: creatorProfile?.displayName || null,
            },
            username: creatorProfile?.username || 'unknown',
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

    async deleteSpot(spotId: string) {
        const { data: photos } = await supabase.from('spot_photos').select('url').eq('spot_id', spotId);
        const { data: videos } = await supabase.from('spot_videos').select('url, thumbnail_url').eq('spot_id', spotId);
        
        const pathsToDelete: string[] = [];
        [...(photos || []), ...(videos || [])].forEach((item: any) => {
            if (item.url) pathsToDelete.push(extractStoragePath(item.url));
            if (item.thumbnail_url) pathsToDelete.push(extractStoragePath(item.thumbnail_url));
            if (item.url && !item.thumbnail_url) {
                const base = item.url.split('/').pop();
                if (base) {
                    pathsToDelete.push(`spots/${spotId}/photos/thumbnails/${base}`);
                    pathsToDelete.push(`spots/${spotId}/photos/thumbnails/${base.replace(/\.[^/.]+$/, "")}_240.jpg`);
                    pathsToDelete.push(`spots/${spotId}/photos/thumbnails/${base.replace(/\.[^/.]+$/, "")}_720.jpg`);
                }
            }
        });

        const { error } = await supabase.from('spots').delete().eq('id', spotId).select();
        if (error) throw error;

        if (pathsToDelete.length > 0) {
            await supabase.storage.from('spot-media').remove(pathsToDelete);
        }
    },

    ...favoriteService,
    ...videoLinkService,
};
export { favoriteService, videoLinkService };
