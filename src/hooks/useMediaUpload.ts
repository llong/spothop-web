import supabase from 'src/supabase';
import { optimizePhoto, generateImageFilename } from 'src/utils/imageOptimization';
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
                const { original, thumbnailSmall, thumbnailLarge } = await optimizePhoto(photo);
                const filename = generateImageFilename(user.user.id);

                const originalPath = `${spotId}/photos/originals/${filename}`;
                const thumbnailSmallPath = `${spotId}/photos/thumbnails/small/${filename}`;
                const thumbnailLargePath = `${spotId}/photos/thumbnails/large/${filename}`;

                // Parallel uploads for this photo
                await Promise.all([
                    supabase.storage.from('spot-media').upload(originalPath, original.blob, { contentType: 'image/jpeg', cacheControl: '3600', upsert: false }),
                    supabase.storage.from('spot-media').upload(thumbnailSmallPath, thumbnailSmall.blob, { contentType: 'image/jpeg', cacheControl: '3600', upsert: false }),
                    supabase.storage.from('spot-media').upload(thumbnailLargePath, thumbnailLarge.blob, { contentType: 'image/jpeg', cacheControl: '3600', upsert: false }),
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
                const fileExt = videoFile.name.split('.').pop();
                const videoFilename = `${Math.random()}.${fileExt}`;
                const videoPath = `${spotId}/videos/originals/${videoFilename}`;

                // Upload Video File
                const { error: uploadError } = await supabase.storage.from('spot-media').upload(videoPath, videoFile);
                if (uploadError) throw uploadError;

                // Get Video Public URL
                const { data: { publicUrl: videoUrl } } = supabase.storage.from('spot-media').getPublicUrl(videoPath);

                // Upload Thumbnail if exists
                let thumbnailUrl = '';
                if (videoAsset.thumbnail) {
                    const thumbFilename = `thumb_${videoFilename.replace(/\.[^/.]+$/, "")}.jpg`;
                    const thumbPath = `${spotId}/videos/thumbnails/${thumbFilename}`;
                    const { error: thumbUploadError } = await supabase.storage.from('spot-media').upload(thumbPath, videoAsset.thumbnail, { contentType: 'image/jpeg' });

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
