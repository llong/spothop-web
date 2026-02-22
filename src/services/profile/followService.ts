import supabase from "../../supabase";

export const followService = {
    async fetchFollowStats(userId: string): Promise<{ followerCount: number, followingCount: number }> {
        console.log('🚀 fetchFollowStats called for userId:', userId);
        const { data, error } = await supabase.rpc('get_user_follow_stats_simple', { p_user_id: userId });
        console.log('📊 RPC Response:', data, error);

        if (error) throw error;
        if (!data || data.length === 0) {
            console.log('⚠️ No data returned from RPC');
            return { followerCount: 0, followingCount: 0 };
        }
        const stats = Array.isArray(data) ? data[0] : data;
        return {
            followerCount: Number(stats.follower_count) || 0,
            followingCount: Number(stats.following_count) || 0
        };
    },

    async fetchUserFollowers(userId: string, cursor?: string | null, limit = 20): Promise<{
        followers: Array<{
            user_id: string;
            username: string;
            avatar_url: string | null;
        }>;
        cursor: string | null;
        hasMore: boolean;
    }> {
        const { data, error } = await supabase.rpc('get_user_followers_batch', {
            p_user_id: userId,
            p_cursor: cursor || null,
            p_limit: limit
        });

        if (error) throw error;

        if (!data || data.length === 0) {
            return { followers: [], cursor: null, hasMore: false };
        }

        const followers = data.map((row: any) => ({
            user_id: row.user_id,
            username: row.username,
            avatar_url: row.avatar_url
        }));

        const hasMore = data.length > limit;
        const nextCursor = data[data.length - 1]?.cursor || null;

        return { followers, cursor: nextCursor, hasMore };
    },

    async fetchUserFollowing(userId: string, cursor?: string | null, limit = 20): Promise<{
        following: Array<{
            user_id: string;
            username: string;
            avatar_url: string | null;
        }>;
        cursor: string | null;
        hasMore: boolean;
    }> {
        const { data, error } = await supabase.rpc('get_user_following_batch', {
            p_user_id: userId,
            p_cursor: cursor || null,
            p_limit: limit
        });

        if (error) throw error;

        if (!data || data.length === 0) {
            return { following: [], cursor: null, hasMore: false };
        }

        const following = data.map((row: any) => ({
            user_id: row.user_id,
            username: row.username,
            avatar_url: row.avatar_url
        }));

        const hasMore = data.length > limit;
        const nextCursor = data[data.length - 1]?.cursor || null;

        return { following, cursor: nextCursor, hasMore };
    },
};
