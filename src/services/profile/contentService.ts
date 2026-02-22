import supabase from "../../supabase";
import type { LikedMediaItem, UserMediaItem, Spot } from "../../types";
import { getSpotThumbnail } from "../../utils/media-utils";

export const contentService = {
    async fetchFavoriteSpots(userId: string): Promise<Spot[]> {
        const { data, error } = await supabase
            .from('user_favorite_spots')
            .select(`spots (*, spot_photos (url))`)
            .eq('user_id', userId);

        if (error) throw error;

        const spots = (data || []).map((item: any) => {
            if (!item.spots) return null;
            return {
                ...item.spots,
                photoUrl: getSpotThumbnail(item.spots.spot_photos)
            };
        });

        return spots.filter(Boolean) as Spot[];
    },

    async fetchLikedMedia(userId: string): Promise<LikedMediaItem[]> {
        const { data: likes, error: likesError } = await supabase
            .from('media_likes')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (likesError) throw likesError;
        if (!likes?.length) return [];

        const photoIds = likes.filter(l => l.media_type === 'photo').map(l => l.photo_id);
        const videoIds = likes.filter(l => l.media_type === 'video').map(l => l.video_id);

        const [photosResult, videosResult] = await Promise.all([
            photoIds.length ? supabase.from('spot_photos').select('*, spot:spots(id, name, city, country, latitude, longitude)').in('id', photoIds) : { data: [] },
            videoIds.length ? supabase.from('spot_videos').select('*, spot:spots(id, name, city, country, latitude, longitude)').in('id', videoIds) : { data: [] }
        ]);

        const authorIds = [...new Set([...(photosResult.data || []), ...(videosResult.data || [])].map((m: any) => m.user_id))];
        const { data: profiles } = await supabase.from('profiles').select('id, username, "avatarUrl"').in('id', authorIds);
        const profileMap = new Map(profiles?.map(p => [p.id, p]));

        const formattedMedia = likes.map((like) => {
            const mediaData = like.media_type === 'photo'
                ? photosResult.data?.find((p: any) => p.id === like.photo_id)
                : videosResult.data?.find((v: any) => v.id === like.video_id);

            if (!mediaData) return null;
            const authorProfile = profileMap.get(mediaData.user_id);

            return {
                id: like.id,
                mediaId: mediaData.id,
                url: mediaData.url,
                thumbnailUrl: mediaData.thumbnail_url,
                type: like.media_type,
                spot: mediaData.spot,
                author: {
                    id: mediaData.user_id,
                    username: authorProfile?.username || 'Unknown',
                    avatarUrl: authorProfile?.avatarUrl || null
                }
            };
        });

        return formattedMedia.filter(Boolean) as LikedMediaItem[];
    },

    async fetchUserContent(userId: string): Promise<{ createdSpots: Spot[], userMedia: UserMediaItem[] }> {
        const [spotsRes, photosRes, videosRes] = await Promise.all([
            supabase.from('spots').select('*, spot_photos(url)').eq('created_by', userId).order('created_at', { ascending: false }),
            supabase.from('spot_photos').select('id, url, created_at, spots(id, name, city, country, latitude, longitude)').eq('user_id', userId).order('created_at', { ascending: false }),
            supabase.from('spot_videos').select('id, url, thumbnail_url, created_at, spots(id, name, city, country, latitude, longitude)').eq('user_id', userId).order('created_at', { ascending: false })
        ]);

        if (spotsRes.error) throw spotsRes.error;

        const formattedSpots = (spotsRes.data || []).map((s: any) => ({
            ...s,
            photoUrl: s.spot_photos?.[0]?.url || null
        }));

        const formattedPhotos = (photosRes.data || []).map((p: any) => ({
            id: p.id,
            url: p.url,
            type: 'photo' as const,
            created_at: p.created_at,
            spot: {
                id: p.spots?.id || 'unknown',
                name: p.spots?.name || 'Unknown Spot',
                city: p.spots?.city || 'Unknown City',
                country: p.spots?.country || 'Unknown Country'
            }
        }));

        const formattedVideos = (videosRes.data || []).map((v: any) => ({
            id: v.id,
            url: v.url,
            thumbnailUrl: v.thumbnail_url,
            type: 'video' as const,
            created_at: v.created_at,
            spot: {
                id: v.spots?.id || 'unknown',
                name: v.spots?.name || 'Unknown Spot',
                city: v.spots?.city || 'Unknown City',
                country: v.spots?.country || 'Unknown Country'
            }
        }));

        return {
            createdSpots: formattedSpots as Spot[],
            userMedia: [...formattedPhotos, ...formattedVideos].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        };
    },
};
