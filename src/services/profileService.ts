import supabase from "../supabase";
import type { UserProfile, Spot, LikedMediaItem, UserMediaItem, AppNotification } from "../types";
import { enrichLocation, getSpotThumbnail, formatMediaItem } from "../utils/media-utils";

export const PROFILE_SELECT = `id, username, "displayName", "avatarUrl", city, country, "riderType", bio, "instagramHandle"`;

export const profileService = {
    /**
     * Fetches basic identity (for AppBar/Avatar).
     */
    async fetchIdentity(userId: string): Promise<UserProfile | null> {
        const { data, error, status } = await supabase
            .from("profiles")
            .select(PROFILE_SELECT)
            .eq("id", userId)
            .single();

        if (error) {
            if (status === 406) return null;
            throw error;
        }

        return data as UserProfile;
    },

    /**
     * Fetches follower/following counts.
     */
    async fetchFollowStats(userId: string): Promise<{ followerCount: number, followingCount: number }> {
        const { data, error } = await supabase
            .from("user_followers")
            .select("follower_id, following_id")
            .or(`follower_id.eq.${userId},following_id.eq.${userId}`);

        if (error) throw error;

        const followerCount = (data || []).filter(f => f.following_id === userId).length;
        const followingCount = (data || []).filter(f => f.follower_id === userId).length;

        return { followerCount, followingCount };
    },

    /**
     * Fetches a user's favorite spots.
     */
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

    /**
     * Fetches media items liked by the user.
     */
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

    /**
     * Fetches spots and media created by the user.
     */
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

        // PASSIVE FORMATTING: No automated enrichment logic in lists to avoid geocoding floods
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

    /**
     * Fetches notifications for a user.
     */
    async fetchNotifications(userId: string): Promise<AppNotification[]> {
        // 1. Fetch Notifications
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        if (!data) return [];

        // 2. Fetch Actors separately to avoid join issues
        const actorIds = [...new Set(data.map((n: any) => n.actor_id))];
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username, "avatarUrl"')
            .in('id', actorIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]));

        return data.map((n: any) => {
            const actor = profileMap.get(n.actor_id);
            return {
                ...n,
                actor: {
                    username: actor?.username || 'unknown',
                    avatarUrl: actor?.avatarUrl || null
                }
            };
        });
    }
};
