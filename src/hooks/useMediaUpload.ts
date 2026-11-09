import { v4 as uuidv4 } from 'uuid';
import supabase from '@/supabase';
import { optimizePhoto, generateImageFilename, imageExtension } from '@/utils/imageOptimization';
import { checkContent } from '@/utils/moderation';
import type { VideoAsset } from '@/types';

const BUCKET = 'spot-media';
/** Photos optimized/scanned/uploaded at once (each decodes a full-size image, so keep this small). */
const PHOTO_CONCURRENCY = 3;

interface UseMediaUploadProps {
    user: any;
    setStatusMessage: (message: string) => void;
}

/** Uploads to the spot-media bucket and returns the public URL. Unique paths + 1-year cache. */
async function upload(path: string, body: Blob, what: string, contentType = body.type) {
    const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, body, { contentType, cacheControl: '31536000', upsert: false });
    // uploads return { error } rather than throwing; never continue (or insert a row) after a failed one
    if (error) throw new Error(`Error uploading ${what}: ${error.message}`);
    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Blocks the upload when the scan flags the image. */
async function assertSafe(image: Blob) {
    const result = await checkContent(image);
    if (!result.safe) throw new Error(`Upload rejected: ${result.reason || 'Content violation detected'}`);
}

/** Maps with at most `limit` calls in flight, keeping result order. Stops starting new work after a failure. */
async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
    const results = new Array<R>(items.length);
    let next = 0;
    const worker = async () => {
        while (next < items.length) {
            const index = next++;
            try {
                results[index] = await fn(items[index]);
            } catch (error) {
                next = items.length;
                throw error;
            }
        }
    };
    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
    return results;
}

export const useMediaUpload = ({ user, setStatusMessage }: UseMediaUploadProps) => {
    const uploadMedia = async (spotId: string, photos: File[], videos: VideoAsset[]) => {
        const userId = user?.user?.id;
        if (!userId) throw new Error("User not authenticated");

        // Optimize, scan and upload every photo (in parallel), then insert the rows in the original order
        let done = 0;
        const reportPhotoProgress = () => setStatusMessage(`Uploading photos (${done}/${photos.length})...`);
        if (photos.length > 0) reportPhotoProgress();

        const photoRows = await mapWithConcurrency(photos, PHOTO_CONCURRENCY, async (photo) => {
            const { original, thumbnailSmall, thumbnailLarge, thumbnailPin } = await optimizePhoto(photo);
            // Scan the 800px version: ~50x smaller than the original, so it is fast on mobile data
            await assertSafe(thumbnailLarge);

            const name = `${generateImageFilename(userId).replace(/\.[^/.]+$/, '')}.${imageExtension(original)}`;
            const folder = `spots/${spotId}/photos`;
            const [url, thumbnail_small_url, thumbnail_large_url, thumbnail_pin_url] = await Promise.all([
                upload(`${folder}/originals/${name}`, original, 'photo'),
                upload(`${folder}/thumbnails/small/${name}`, thumbnailSmall, 'photo'),
                upload(`${folder}/thumbnails/large/${name}`, thumbnailLarge, 'photo'),
                upload(`${folder}/thumbnails/pin/${name}`, thumbnailPin, 'photo'),
            ]);

            done++;
            reportPhotoProgress();
            return { spot_id: spotId, user_id: userId, url, thumbnail_small_url, thumbnail_large_url, thumbnail_pin_url };
        });

        // One insert per photo (not a batch): each needs its own created_at for the feed's timestamp cursor
        for (const row of photoRows) {
            const { error } = await supabase.from('spot_photos').insert(row);
            if (error) throw new Error('Error saving photo metadata: ' + error.message);
        }

        for (const [index, { file, thumbnail }] of videos.entries()) {
            setStatusMessage(`Uploading video ${index + 1}/${videos.length}...`);

            // The video file itself can't be scanned (the image API rejects it), so scan its thumbnail frame
            await assertSafe(thumbnail);

            const id = uuidv4();
            const [url, thumbnail_url] = await Promise.all([
                upload(`spots/${spotId}/videos/originals/${id}.mp4`, file, 'video', 'video/mp4'),
                upload(`spots/${spotId}/videos/thumbnails/thumb_${id}.${imageExtension(thumbnail)}`, thumbnail, 'video thumbnail'),
            ]);

            const { error } = await supabase.from('spot_videos').insert({
                spot_id: spotId,
                user_id: userId,
                url,
                thumbnail_url,
                duration: 0,
            });
            if (error) throw new Error('Error saving video metadata: ' + error.message);
        }
    };

    return { uploadMedia };
};
