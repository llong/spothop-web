import supabase from "@/supabase";
import type { ContentReport, UserProfile } from "@/types";
import { extractStoragePath } from "@/utils/media-utils";
import { imageExtension, pinThumbnail } from "@/utils/imageOptimization";
import { readFunctionError, isFunctionNotDeployed } from "@/utils/functionErrors";

/** Totals returned by the cleanup-orphan-media Edge Function (summed across pages). */
export interface OrphanCleanupReport {
    dryRun: boolean;
    scannedFolders: number;
    orphanFolders: number;
    liveSpotsWithOrphans: number;
    orphanFiles: number;
    bytes: number;
    skippedRecent: number;
    removed: number;
    sample: string[];
}

/** One page of results from the cleanup-orphan-media Edge Function. */
interface OrphanCleanupPage extends Omit<OrphanCleanupReport, 'dryRun'> {
    nextOffset: number | null;
}

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
                case 'comment': {
                    const comment = commentMap.get(report.target_id);
                    targetContent = comment;
                    contextId = comment?.spot_id;
                    break;
                }
                case 'media': {
                    const photo = photoMap.get(report.target_id);
                    const video = videoMap.get(report.target_id);
                    targetContent = photo || video;
                    contextId = (photo || video)?.spot_id;
                    break;
                }
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
     * Deletes the target of a report and handles storage cleanup.
     * Cascading database triggers handle related DB records (likes, reports, etc.).
     */
    async deleteReportTarget(targetType: 'spot' | 'comment' | 'media', targetId: string): Promise<void> {
        console.log(`[adminService] Deleting report target: ${targetType} (${targetId})`);
        
        switch (targetType) {
            case 'spot': {
                const { spotService } = await import('./spotService');
                await spotService.deleteSpot(targetId);
                break;
            }

            case 'comment': {
                const { error: commentError } = await supabase.from('spot_comments').delete().eq('id', targetId);
                if (commentError) throw commentError;
                break;
            }

            case 'media': {
                // We try both tables. We don't throw immediately if one fails to find.
                // 1. Try spot_photos
                const { data: photo } = await supabase
                    .from('spot_photos')
                    .select('url, thumbnail_small_url, thumbnail_large_url, thumbnail_pin_url')
                    .eq('id', targetId)
                    .maybeSingle();

                if (photo) {
                    const paths = [
                        extractStoragePath(photo.url),
                        extractStoragePath(photo.thumbnail_small_url || ''),
                        extractStoragePath(photo.thumbnail_large_url || ''),
                        extractStoragePath(photo.thumbnail_pin_url || '')
                    ].filter(Boolean);

                    const { error: delError } = await supabase.from('spot_photos').delete().eq('id', targetId);
                    if (delError) throw delError;

                    if (paths.length > 0) {
                        await supabase.storage.from('spot-media').remove(paths);
                    }
                    return;
                }

                // 2. Try spot_videos
                const { data: video } = await supabase
                    .from('spot_videos')
                    .select('url, thumbnail_url')
                    .eq('id', targetId)
                    .maybeSingle();

                if (video) {
                    const paths = [
                        extractStoragePath(video.url),
                        extractStoragePath(video.thumbnail_url || '')
                    ].filter(Boolean);

                    const { error: delError } = await supabase.from('spot_videos').delete().eq('id', targetId);
                    if (delError) throw delError;

                    if (paths.length > 0) {
                        await supabase.storage.from('spot-media').remove(paths);
                    }
                    return;
                }

                // 3. Fallback: If we can't select but still want to attempt delete (admin might have delete but not select permission)
                const { data: delPhotoData } = await supabase.from('spot_photos').delete().eq('id', targetId).select();
                if (delPhotoData && delPhotoData.length > 0) return;

                const { data: delVideoData } = await supabase.from('spot_videos').delete().eq('id', targetId).select();
                if (delVideoData && delVideoData.length > 0) return;

                throw new Error("Media content not found or already deleted");
            }
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
    },

    /**
     * Makes the map-pin thumbnail for photos uploaded before it existed, from their small thumbnail (no
     * re-upload by users). Safe to run again: only photos without a pin thumbnail are processed.
     * Updating other users' rows relies on the admin_update_photos policy.
     */
    async backfillPinThumbnails(onProgress?: (done: number, total: number) => void) {
        const { data: photos, error } = await supabase
            .from('spot_photos')
            .select('id, spot_id, url, thumbnail_small_url, thumbnail_large_url')
            .is('thumbnail_pin_url', null);
        if (error) throw error;

        let done = 0;
        let failed = 0;
        for (const photo of photos ?? []) {
            try {
                // The small thumbnail is ~20KB; fall back to larger sources for old rows without one
                const source = photo.thumbnail_small_url || photo.thumbnail_large_url || photo.url;
                const response = await fetch(source);
                if (!response.ok) throw new Error(`Could not download ${source}`);

                const pin = await pinThumbnail(await response.blob());
                const path = `spots/${photo.spot_id}/photos/thumbnails/pin/${photo.id}.${imageExtension(pin)}`;
                const { error: uploadError } = await supabase.storage
                    .from('spot-media')
                    .upload(path, pin, { contentType: pin.type, cacheControl: '31536000', upsert: true });
                if (uploadError) throw uploadError;

                const { error: updateError } = await supabase
                    .from('spot_photos')
                    .update({ thumbnail_pin_url: supabase.storage.from('spot-media').getPublicUrl(path).data.publicUrl })
                    .eq('id', photo.id);
                if (updateError) throw updateError;
                done++;
            } catch (err) {
                failed++;
                console.error('Pin thumbnail backfill failed for photo', photo.id, err);
            }
            onProgress?.(done + failed, photos?.length ?? 0);
        }
        return { total: photos?.length ?? 0, done, failed };
    },

    /**
     * Scans (dryRun: true) or cleans up (dryRun: false) files in the spot-media bucket that no spot
     * references, by calling the admin-only cleanup-orphan-media Edge Function page by page and
     * summing the results.
     */
    async cleanupOrphanMedia(dryRun: boolean): Promise<OrphanCleanupReport> {
        const total: OrphanCleanupReport = {
            dryRun, scannedFolders: 0, orphanFolders: 0, liveSpotsWithOrphans: 0,
            orphanFiles: 0, bytes: 0, skippedRecent: 0, removed: 0, sample: [],
        };

        let offset: number | null = 0;
        while (offset !== null) {
            const response: { data: OrphanCleanupPage | null; error: unknown } =
                await supabase.functions.invoke('cleanup-orphan-media', { body: { dryRun, offset } });
            const { data, error } = response;
            if (error || !data) {
                const { status, message } = await readFunctionError(error ?? new Error('Empty response'));
                throw new Error(
                    isFunctionNotDeployed(status, message)
                        ? 'The cleanup-orphan-media Edge Function is not deployed yet.'
                        : message || 'Storage cleanup failed.'
                );
            }

            total.scannedFolders += data.scannedFolders;
            total.orphanFolders += data.orphanFolders;
            total.liveSpotsWithOrphans += data.liveSpotsWithOrphans;
            total.orphanFiles += data.orphanFiles;
            total.bytes += data.bytes;
            total.skippedRecent += data.skippedRecent;
            total.removed += data.removed;
            if (total.sample.length < 20) total.sample.push(...data.sample.slice(0, 20 - total.sample.length));
            offset = data.nextOffset;
        }
        return total;
    }
};