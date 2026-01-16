import supabase from "../supabase";
import type { ContentReport, UserProfile } from "../types";

export const adminService = {
    /**
     * Fetches all pending reports from content_reports.
     */
    async fetchReports(): Promise<ContentReport[]> {
        const { data: reports, error } = await supabase
            .from('content_reports')
            .select(`
                *,
                reporter:profiles!user_id(username, "avatarUrl")
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        if (!reports || reports.length === 0) return [];

        // Group IDs by type for efficient fetching
        const spotIds = reports.filter(r => r.target_type === 'spot').map(r => r.target_id);
        const commentIds = reports.filter(r => r.target_type === 'comment').map(r => r.target_id);
        const mediaIds = reports.filter(r => r.target_type === 'media').map(r => r.target_id);

        // Fetch targets in parallel
        const [spotsRes, commentsRes, photosRes, videosRes] = await Promise.all([
            spotIds.length ? supabase.from('spots').select('id, name, address, city, state, country, spot_photos(url)').in('id', spotIds) : { data: [] },
            commentIds.length ? supabase.from('spot_comments').select('id, content, spot_id').in('id', commentIds) : { data: [] },
            mediaIds.length ? supabase.from('spot_photos').select('id, url, spot_id').in('id', mediaIds) : { data: [] },
            mediaIds.length ? supabase.from('spot_videos').select('id, url, thumbnail_url, spot_id').in('id', mediaIds) : { data: [] }
        ]);

        // Create maps for quick lookup
        const spotMap = new Map(spotsRes.data?.map((s: any) => [s.id, {
            ...s,
            thumbnailUrl: s.spot_photos?.[0]?.url || null
        }]));
        const commentMap = new Map(commentsRes.data?.map(c => [c.id, c]));
        const photoMap = new Map(photosRes.data?.map(p => [p.id, p]));
        const videoMap = new Map(videosRes.data?.map(v => [v.id, v]));

        // Merge target data into reports
        return reports.map(report => {
            let targetContent = null;
            let contextId = null;

            switch (report.target_type) {
                case 'spot':
                    targetContent = spotMap.get(report.target_id);
                    contextId = report.target_id;
                    break;
                case 'comment':
                    const comment = commentMap.get(report.target_id);
                    targetContent = comment;
                    contextId = comment?.spot_id;
                    break;
                case 'media':
                    const photo = photoMap.get(report.target_id);
                    const video = videoMap.get(report.target_id);
                    targetContent = photo || video;
                    contextId = (photo || video)?.spot_id;
                    break;
            }

            return {
                ...report,
                target_content: targetContent,
                context_id: contextId // Used for linking back to the spot page
            };
        }) as ContentReport[];
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
