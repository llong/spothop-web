import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMediaUpload } from './useMediaUpload';
import { spotKeys } from './useSpotQueries';
import type { VideoAsset } from '../types';
import type { User } from '@supabase/supabase-js';

interface UseMediaUploadMutationProps {
    user: User | null;
    spotId: string;
}

export const useMediaUploadMutation = ({ user, spotId }: UseMediaUploadMutationProps) => {
    const queryClient = useQueryClient();
    const { uploadMedia } = useMediaUpload({ 
        user, 
        setStatusMessage: () => {} // Placeholder - mutation handles its own status
    });

    return useMutation({
        mutationFn: async ({ photos, videos }: { photos: File[]; videos: VideoAsset[] }) => {
            await uploadMedia(spotId, photos, videos);
            return { photosCount: photos.length, videosCount: videos.length };
        },
        onSuccess: () => {
            // Invalidate spot details to refresh media gallery
            queryClient.invalidateQueries({ queryKey: spotKeys.details(spotId) });
        }
    });
};