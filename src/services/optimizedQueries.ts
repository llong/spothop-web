import supabase from "../supabase";
import type { LikedMediaItem, UserMediaItem } from "../types";

export const optimizedQueries = {
    /**
     * Optimized fetch for liked media with profile information in one query
     */
    async fetchLikedMediaOptimized(userId: string, limit = 50, offset = 0): Promise<LikedMediaItem[]> {
        const { data: likes, error: likesError } = await supabase
            .from('media_likes')
            .select(`
                id,
                mediaId: photo_id,
                video_id,
                media_type,
                spot_photos!inner(id, url, thumbnail_url, created_at, user_id, spots!inner(id, name, city, country, latitude, longitude)),
                spot_videos!inner(id, url, thumbnail_url, created_at, user_id, spots!inner(id, name, city, country, latitude, longitude)),
                profiles!inner(id, username, "avatarUrl")
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (likesError) throw likesError;

        return likes.map((like: {
            id: string;
            media_type: 'photo' | 'video';
            photo_id?: string;
            video_id?: string;
            spot_photos: Array<{
                id: string;
                url: string;
                thumbnail_url?: string;
                created_at: string;
                user_id: string;
                spots: Array<{
                    id: string;
                    name: string;
                    city?: string;
                    country?: string;
                    latitude: number;
                    longitude: number;
                }>;
            }>;
            spot_videos: Array<{
                id: string;
                url: string;
                thumbnail_url?: string;
                created_at: string;
                user_id: string;
                spots: Array<{
                    id: string;
                    name: string;
                    city?: string;
                    country?: string;
                    latitude: number;
                    longitude: number;
                }>;
            }>;
            profiles: Array<{
                id: string;
                username: string | null;
                avatarUrl: string | null;
            }>;
        }) => {
            const mediaData = like.media_type === 'photo' ? like.spot_photos[0] : like.spot_videos[0];
            const profile = like.profiles[0];
            
            return {
                id: like.id,
                mediaId: mediaData.id,
                url: mediaData.url,
                thumbnailUrl: mediaData.thumbnail_url,
                type: like.media_type,
                spot: mediaData.spots[0],
                author: {
                    id: profile.id,
                    username: profile.username,
                    avatarUrl: profile.avatarUrl
                }
            };
        }) as LikedMediaItem[];
    },

    /**
     * Optimized fetch for user content with pagination
     */
    async fetchUserContentOptimized(userId: string, limit = 20, offset = 0): Promise<{ createdSpots: any[], userMedia: UserMediaItem[] }> {
        const [spotsRes, mediaRes] = await Promise.all([
            supabase
                .from('spots')
                .select('*, spot_photos(url)')
                .eq('created_by', userId)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1),
            
            supabase.rpc('fetch_user_media_with_spot', {
                p_user_id: userId,
                p_limit: limit,
                p_offset: offset
            })
        ]);

        if (spotsRes.error) throw spotsRes.error;
        if (mediaRes.error) throw mediaRes.error;

        return {
            createdSpots: spotsRes.data || [],
            userMedia: (mediaRes.data || []) as UserMediaItem[]
        };
    },

    /**
     * Paginated fetch for comments with reactions
     */
    async fetchCommentsPaginated(
        spotId: string, 
        limit = 20, 
        offset = 0
    ): Promise<Array<{
        id: string;
        spot_id: string;
        user_id: string;
        parent_id: string | null;
        content: string;
        is_edited: boolean;
        created_at: string;
        updated_at: string;
        author: {
            username: string | null;
            avatarUrl: string | null;
        } | null;
        reactions: Array<{
            count: number;
        }>;
        replies: Array<{
            id: string;
            content: string;
            created_at: string;
            author: {
                username: string | null;
                avatarUrl: string | null;
            } | null;
        }>;
    }>> {
        const { data, error } = await supabase
            .from('spot_comments')
            .select(`
                id,
                spot_id,
                user_id,
                parent_id,
                content,
                is_edited,
                created_at,
                updated_at,
                author:profiles!inner(username, "avatarUrl"),
                reactions:comment_reactions(count),
                replies:spot_comments(id, content, created_at, author:profiles!inner(username, "avatarUrl"))
            `)
            .eq('spot_id', spotId)
            .is('parent_id', null)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;
        return (data || []) as any[];
    }
};