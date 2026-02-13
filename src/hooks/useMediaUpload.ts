import supabase from 'src/supabase';
import { optimizePhoto, generateImageFilename } from 'src/utils/imageOptimization';
import { checkContent } from 'src/utils/moderation';
import type { VideoAsset } from 'src/types';

interface UseMediaUploadProps {
    user: any;
    setStatusMessage: (message: string) => void;
}

export const useMediaUpload = ({ user, setStatusMessage }: UseMediaUploadProps) => {
    const uploadMedia = async (
        spotId: string,
        photos: File[],
        videos: VideoAsset[]
    ) => {
        if (!user?.user?.id) throw new Error("User not authenticated");

        // 1. Upload Photos
        if (photos.length > 0) {
            setStatusMessage(`Optimizing and uploading ${photos.length} photos...`);

            for (let i = 0; i < photos.length; i++) {
                const photo = photos[i];

                // Moderate content before processing
                setStatusMessage(`Scanning photo ${i + 1}/${photos.length} for safety...`);
                const moderationResult = await checkContent(photo);
                if (!moderationResult.safe) {
                    throw new Error(`Upload rejected: ${moderationResult.reason || 'Content violation detected'}`);
                }

                const { original, thumbnailSmall, thumbnailLarge } = await optimizePhoto(photo);
                const filename = generateImageFilename(user.user.id);

                const webpFilename = filename.replace(/\.[^/.]+$/, "") + ".webp";
                const originalPath = `spots/${spotId}/photos/originals/${webpFilename}`;
                const thumbnailSmallPath = `spots/${spotId}/photos/thumbnails/small/${webpFilename}`;
                const thumbnailLargePath = `spots/${spotId}/photos/thumbnails/large/${webpFilename}`;

                // Parallel uploads for this photo
                await Promise.all([
                    supabase.storage.from('spot-media').upload(originalPath, original.blob, { contentType: 'image/webp', cacheControl: '3600', upsert: false }),
                    supabase.storage.from('spot-media').upload(thumbnailSmallPath, thumbnailSmall.blob, { contentType: 'image/webp', cacheControl: '3600', upsert: false }),
                    supabase.storage.from('spot-media').upload(thumbnailLargePath, thumbnailLarge.blob, { contentType: 'image/webp', cacheControl: '3600', upsert: false }),
                ]);

                // Get Public URLs
                const { data: { publicUrl: originalUrl } } = supabase.storage.from('spot-media').getPublicUrl(originalPath);
                const { data: { publicUrl: thumbnailSmallUrl } } = supabase.storage.from('spot-media').getPublicUrl(thumbnailSmallPath);
                const { data: { publicUrl: thumbnailLargeUrl } } = supabase.storage.from('spot-media').getPublicUrl(thumbnailLargePath);

                // Save to DB
                const { error: photoError } = await supabase.from('spot_photos').insert({
                    spot_id: spotId,
                    user_id: user.user.id,
                    url: originalUrl,
                    thumbnail_small_url: thumbnailSmallUrl,
                    thumbnail_large_url: thumbnailLargeUrl,
                });

                if (photoError) throw new Error('Error saving photo metadata: ' + photoError.message);
            }
        }

        // 2. Upload Videos
        if (videos.length > 0) {
            setStatusMessage(`Uploading ${videos.length} videos...`);

            for (let i = 0; i < videos.length; i++) {
                const videoAsset = videos[i];
                const videoFile = videoAsset.file;

                // Moderate content before processing (if possible for videos, otherwise skip or check thumbnail)
                // Note: Full video moderation is expensive/slow. For MVP, we might check the thumbnail
                // if one exists, or rely on post-upload moderation.
                // Here we'll check the file itself if the service supports it, or skip.
                // The mock service just checks the file object, so we'll run it.
                setStatusMessage(`Scanning video ${i + 1}/${videos.length} for safety...`);
                const moderationResult = await checkContent(videoFile);
                if (!moderationResult.safe) {
                    throw new Error(`Upload rejected: ${moderationResult.reason || 'Content violation detected'}`);
                }

                const fileExt = videoFile.name.split('.').pop();
                const videoFilename = `${Math.random()}.${fileExt}`;
                const videoPath = `spots/${spotId}/videos/originals/${videoFilename}`;

                // Upload Video File
                const { error: uploadError } = await supabase.storage.from('spot-media').upload(videoPath, videoFile, {
                    contentType: videoFile.type || 'video/mp4',
                    cacheControl: '3600',
                    upsert: false
                });
                if (uploadError) throw uploadError;

                // Get Video Public URL
                const { data: { publicUrl: videoUrl } } = supabase.storage.from('spot-media').getPublicUrl(videoPath);

                // Upload Thumbnail if exists
                // Upload Thumbnail if exists
                let thumbnailUrl = '';
                if (videoAsset.thumbnail) {
                    const thumbFilename = `thumb_${videoFilename.replace(/\.[^/.]+$/, "")}.webp`;
                    const thumbPath = `spots/${spotId}/videos/thumbnails/${thumbFilename}`;
                    const { error: thumbUploadError } = await supabase.storage.from('spot-media').upload(thumbPath, videoAsset.thumbnail, { contentType: 'image/webp' });

                    if (!thumbUploadError) {
                        const { data: thumbData } = supabase.storage.from('spot-media').getPublicUrl(thumbPath);
                        thumbnailUrl = thumbData.publicUrl;
                    }
                }

                const { error: videoError } = await supabase.from('spot_videos').insert({
                    spot_id: spotId,
                    user_id: user.user.id,
                    url: videoUrl,
                    thumbnail_url: thumbnailUrl,
                    duration: 0, // Duration could be extracted in the thumbnail selector if needed
                });

                if (videoError) throw new Error('Error saving video metadata: ' + videoError.message);
            }
        }
    };

    return { uploadMedia };
};
