import supabase from "../supabase";
import type { ContentReport, UserProfile } from "../types";

export const adminService = {
    /**
     * Fetches all pending reports from content_reports.
     */
    async fetchReports(): Promise<ContentReport[]> {
        const { data, error } = await supabase
            .from('content_reports')
            .select(`
                *,
                reporter:profiles!user_id(username, "avatarUrl")
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Since target_id is not a real foreign key, we might need to fetch target previews
        // but for now we return the list and the UI can handle fetching details if needed.
        return data as ContentReport[];
    },

    /**
     * Deletes a report record (resolves it without action on target).
     */
    async resolveReport(reportId: string): Promise<void> {
        const { error } = await supabase
            .from('content_reports')
            .delete()
            .eq('id', reportId);

        if (error) throw error;
    },

    /**
     * Deletes the target of a report.
     * Cascading triggers will handle report cleanup.
     */
    async deleteReportTarget(targetType: 'spot' | 'comment' | 'media', targetId: string): Promise<void> {
        let table = '';
        switch (targetType) {
            case 'spot': table = 'spots'; break;
            case 'comment': table = 'spot_comments'; break;
            case 'media':
                // We need to check both photos and videos
                // A better approach would be to know which one it is from content_reports
                // For now we'll try to find it in both if targetType is 'media'
                // But typically targetType would be more specific.
                // Looking at migrations, target_type check constraint is ('spot', 'comment', 'media')
                // So we'll try both photos and videos.
                const photoRes = await supabase.from('spot_photos').delete().eq('id', targetId);
                const videoRes = await supabase.from('spot_videos').delete().eq('id', targetId);
                if (photoRes.error && videoRes.error) throw new Error("Target media not found");
                return;
        }

        if (table) {
            const { error } = await supabase.from(table).delete().eq('id', targetId);
            if (error) throw error;
        }
    },

    /**
     * Toggles a user's banned status.
     */
    async toggleUserBan(userId: string, isBanned: boolean): Promise<void> {
        const { error } = await supabase
            .from('profiles')
            .update({ "isBanned": isBanned })
            .eq('id', userId);

        if (error) throw error;
    },

    /**
     * Searches for users to moderate.
     */
    async searchUsers(query: string): Promise<UserProfile[]> {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .or(`username.ilike.%${query}%, "displayName".ilike.%${query}%`)
            .limit(20);

        if (error) throw error;
        return data as UserProfile[];
    }
};
