import supabase from "@/supabase";
import type { MediaItem, Spot, SpotVideoLink } from "@/types";
import { reverseGeocode } from "@/utils/geocoding";
import { extractStoragePath } from "@/utils/media-utils";
import { readFunctionError, isFunctionNotDeployed } from "@/utils/functionErrors";
import { favoriteService } from './spot/favoriteService';
import { videoLinkService } from './spot/videoLinkService';

/**
 * Fallback used only when the delete-spot Edge Function is unavailable. Limited by RLS: it can only
 * remove storage objects the current user uploaded, so media from other users is left behind.
 */
async function deleteSpotFromBrowser(spotId: string) {
    const [{ data: photos }, { data: videos }] = await Promise.all([
        supabase.from('spot_photos').select('url, thumbnail_small_url, thumbnail_large_url, thumbnailurl').eq('spot_id', spotId),
        supabase.from('spot_videos').select('url, thumbnail_url').eq('spot_id', spotId),
    ]);

    const urls = [
        ...(photos || []).flatMap((p) => [p.url, p.thumbnail_small_url, p.thumbnail_large_url, p.thumbnailurl]),
        ...(videos || []).flatMap((v) => [v.url, v.thumbnail_url]),
    ];
    const paths = [...new Set(urls.map((u) => extractStoragePath(u ?? '')).filter(Boolean))];

    const { error } = await supabase.from('spots').delete().eq('id', spotId).select();
    if (error) throw error;

    if (paths.length > 0) {
        const { error: storageError } = await supabase.storage.from('spot-media').remove(paths);
        if (storageError) console.warn('Spot deleted, but some media files could not be removed:', storageError.message);
    }
}

export const spotService = {
    async fetchSpotDetails(spotId: string, userId?: string) {
        const spotPromise = supabase
            .from('spots')
            .select(`
                id, name, description, latitude, longitude, address, city, state, country, created_by, created_at, difficulty, kickout_risk, is_lit, spot_type,
                favorite_count,
                spot_photos (
                    id,
                    url,
                    created_at,
                    user_id,
                    like_count,
                    comment_count,
                    media_likes!photo_id (
                        user_id
                    )
                ),
                spot_videos (
                    id,
                    url,
                    thumbnail_url,
                    created_at,
                    user_id,
                    like_count,
                    comment_count,
                    media_likes!video_id (
                        user_id
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

        const [spotResult, favoriteStatusResult, commentCountResult, flagCountResult, favoritedUsersResult] = await Promise.all([
            spotPromise,
            favoriteStatusPromise,
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
                spotData.city = spotData.city || info.city || null;
                spotData.state = spotData.state || info.state || null;
                spotData.country = spotData.country || info.country || null;
            } catch {
                console.warn("Geocoding failed for spot:", spotId);
            }
        }

        const authorIds = [
            ...(spotData.spot_photos || []).map((p) => p.user_id),
            ...(spotData.spot_videos || []).map((v) => v.user_id),
            ...(spotData.spot_video_links || []).map((l) => l.user_id),
            spotData.created_by
        ].filter((v, i, a): v is string => !!v && a.indexOf(v) === i);

        const { data: profiles } = authorIds.length > 0
            ? await supabase.from('profiles').select('id, username, "avatarUrl", "displayName"').in('id', authorIds)
            : { data: [] };

        const profileMap = new Map(profiles?.map(p => [p.id, p]));
        const creatorProfile = spotData.created_by ? profileMap.get(spotData.created_by) : undefined;

        const photos = (spotData.spot_photos || []).map((p): MediaItem => {
            const author = p.user_id ? profileMap.get(p.user_id) : undefined;
            return {
                id: p.id,
                url: p.url,
                type: 'photo' as const,
                createdAt: p.created_at ?? '',
                author: {
                    id: p.user_id ?? '',
                    username: author?.username || 'unknown',
                    avatarUrl: author?.avatarUrl || null
                },
                likeCount: p.like_count || 0,
                commentCount: p.comment_count || 0,
                isLiked: userId ? p.media_likes?.some((l) => l.user_id === userId) : false
            };
        });

        const videos = (spotData.spot_videos || []).map((v): MediaItem => {
            const author = v.user_id ? profileMap.get(v.user_id) : undefined;
            return {
                id: v.id,
                url: v.url,
                thumbnailUrl: v.thumbnail_url ?? undefined,
                type: 'video' as const,
                createdAt: v.created_at ?? '',
                author: {
                    id: v.user_id ?? '',
                    username: author?.username || 'unknown',
                    avatarUrl: author?.avatarUrl || null
                },
                likeCount: v.like_count || 0,
                commentCount: v.comment_count || 0,
                isLiked: userId ? v.media_likes?.some((l) => l.user_id === userId) : false
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
            // Normalize nullable DB columns to the app's Spot shape (optional, not null)
            description: spotData.description ?? '',
            address: spotData.address ?? undefined,
            city: spotData.city ?? undefined,
            state: spotData.state ?? undefined,
            country: spotData.country ?? undefined,
            created_at: spotData.created_at ?? undefined,
            created_by: spotData.created_by ?? undefined,
            difficulty: (spotData.difficulty ?? undefined) as Spot['difficulty'],
            kickout_risk: spotData.kickout_risk ?? undefined,
            is_lit: spotData.is_lit ?? undefined,
            spot_type: spotData.spot_type ?? undefined,
            media: [...photos, ...videos],
            videoLinks,
            creator: {
                username: creatorProfile?.username || 'unknown',
                avatarUrl: creatorProfile?.avatarUrl || null,
                displayName: creatorProfile?.displayName || null,
            },
            username: creatorProfile?.username || 'unknown',
            favoriteCount: spotData.favorite_count || 0,
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
     * Deletes a spot and every file stored for it.
     *
     * Goes through the `delete-spot` Edge Function, which runs with the service role and removes ALL of
     * the spot's files (including media uploaded by other users, which RLS stops the browser from
     * deleting) before removing the row. If the function is not deployed yet we fall back to deleting
     * from the browser, which can only remove files the current user owns.
     */
    async deleteSpot(spotId: string) {
        const { error } = await supabase.functions.invoke('delete-spot', { body: { spotId } });
        if (!error) return;

        const { status, message } = await readFunctionError(error);
        if (isFunctionNotDeployed(status, message)) {
            return deleteSpotFromBrowser(spotId);
        }
        throw new Error(message || 'Could not delete the spot.');
    },

    ...favoriteService,
    ...videoLinkService,
};
export { favoriteService, videoLinkService };
