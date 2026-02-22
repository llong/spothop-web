import supabase from "../supabase";
import type { UserProfile } from "../types";
import { followService } from './profile/followService';
import { contentService } from './profile/contentService';
import { notificationService } from './profile/notificationService';

export const PROFILE_SELECT = `id, username, "displayName", "avatarUrl", city, country, "riderType", bio, "instagramHandle", role, "isBanned"`;

export const profileService = {
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

    async fetchProfileByUsername(username: string): Promise<UserProfile | null> {
        const { data, error } = await supabase
            .from("profiles")
            .select(PROFILE_SELECT)
            .eq("username", username)
            .single();

        if (error) {
            console.error('Error fetching profile by username:', error);
            return null;
        }

        return data as UserProfile;
    },

    async searchUsers(query: string, limit: number = 5): Promise<Array<{ id: string, username: string, displayName: string, avatarUrl: string | null }>> {
        const cleanQuery = query.trim().startsWith('@') ? query.trim().substring(1) : query.trim();
        if (!cleanQuery || cleanQuery.length < 2) return [];

        const orFilter = `"username".ilike.*${cleanQuery}*,"displayName".ilike.*${cleanQuery}*`;

        const { data, error } = await supabase
            .from('profiles')
            .select('id, username, "displayName", "avatarUrl"')
            .or(orFilter)
            .limit(limit);

        if (error) {
            console.error('Error searching users:', error);
            return [];
        }

        return data.map((user: any) => ({
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl
        }));
    },

    // Spread sub-services
    ...followService,
    ...contentService,
    ...notificationService,
};
export { followService, contentService, notificationService };
